//
// Created by jglanz on 4/19/2024.
//


#include <conio.h>
#include <csignal>
#include <cstdio>
#include <ctime>

#include <IRacingTools/SDK/DiskClient.h>
#include <IRacingTools/SDK/DiskClientDataFrameProcessor.h>
#include <IRacingTools/SDK/LiveConnection.h>
#include <IRacingTools/SDK/VarHolder.h>

#include <IRacingTools/Shared/SharedAppLibPCH.h>


#include "LiveDataReplayArgCommand.h"

#include <IRacingTools/Models/LapTrajectory.pb.h>
#include <IRacingTools/SDK/Utils/ConsoleHelpers.h>
#include <IRacingTools/Shared/Chrono.h>
#include <IRacingTools/Shared/Logging/LoggingManager.h>
#include <IRacingTools/Shared/Services/LapTrajectoryTool.h>
#include <IRacingTools/Shared/Utils/TypeIdHelpers.h>

//#include <IRacingTools/Shared/Services/ServiceManager.h>
//#include <IRacingTools/Shared/Services/TelemetryDataService.h>
//#include <IRacingTools/Shared/Services/TrackMapService.h>

namespace IRacingTools::App::Commands {
  using namespace IRacingTools::SDK;
  using namespace IRacingTools::SDK::Utils;
  using namespace IRacingTools::Shared;
  using namespace IRacingTools::Shared::Logging;
  using namespace IRacingTools::Shared::Services;
  using namespace IRacingTools::Shared::Utils;

  namespace {
    auto L = GetCategoryWithType<LiveDataReplayArgCommand>();

    class LiveDataReplayTool {
      DiskClient diskClient_;
      fs::path ibtPath_;
      std::unique_ptr<std::thread> thread_;
      std::atomic_bool running_{true};
      std::mutex mutex_{};
      std::condition_variable sleepCondition_{};

      void run() {
        auto& diskClient = diskClient_;
        bool isFirst = true;

        // CALCULATED REQUIRED SHARED MEMORY SIZE
        // AND CREATE OBJECTS
        auto sessionInfoStr = std::string{diskClient.getSessionInfoStr().value()};
        sessionInfoStr.data()[sessionInfoStr.length() - 1] = '\0';

        auto sessionInfoStrSize = static_cast<uint32_t>(sessionInfoStr.length());

        auto headers = diskClient.getVarHeaders();
        auto headerCount = headers.size();
        auto headerBufferSize = headerCount * sizeof(VarDataHeader);

        std::size_t varBufferSize = 0;
        for (auto& header : headers) {
          varBufferSize += VarDataTypeSizeTable[header.type] * header.count;
        }

        std::size_t varBufferCount = Resources::MaxBufferCount;
        std::size_t varBufferTotalSize = varBufferCount * varBufferSize;

        DWORD memMapBufferSizeWithoutSessionInfo = DataHeaderSize + headerBufferSize + varBufferTotalSize;
        DWORD memMapBufferSize = memMapBufferSizeWithoutSessionInfo + sessionInfoStrSize;
        HANDLE memMapFileHandle = CreateFileMapping(
          INVALID_HANDLE_VALUE,
          nullptr,
          PAGE_READWRITE,
          0,
          memMapBufferSize,
          Resources::MemMapFilename
        );
        std::atomic_int lastTickCount = INT_MAX;


        auto sharedMemPtr = static_cast<char*>(MapViewOfFile(
          memMapFileHandle,
          FILE_MAP_ALL_ACCESS,
          0,
          0,
          memMapBufferSize
        ));

        VRK_LOG_AND_FATAL_IF(!sharedMemPtr, "Unable to create dataValidEventHandle");

        DataHeader dataHeader{
          .ver = Resources::Version,
          .status = ConnectionStatus::Connected,
          .tickRate = 60,
          .session = DataHeader::SessionDetails{
            .count = 1,
            .len = sessionInfoStrSize,
            .offset = static_cast<uint32_t>(memMapBufferSizeWithoutSessionInfo)
          },
          .numVars = static_cast<int>(headerCount),
          .varHeaderOffset =  static_cast<int>(DataHeaderSize),

          .numBuf = static_cast<int>(varBufferCount),
          .bufLen = static_cast<int>(varBufferSize),

        };

        std::size_t varBufferOffset = DataHeaderSize + headerBufferSize;
        for (auto idx = 0; idx < varBufferCount;idx++) {
          // Create data buf desc
          dataHeader.varBuf[idx] = VarDataBufDescriptor{
            .tickCount = 0,
            .bufOffset = static_cast<int>(varBufferOffset + (varBufferSize * idx))
          };
        }
        //= reinterpret_cast<const DataHeader*>(sharedMemPtr);

        auto dataValidEventHandle = CreateEvent(NULL, false, false, Resources::DataValidEventName);
        VRK_LOG_AND_FATAL_IF(!dataValidEventHandle, "Unable to create dataValidEventHandle");

        int varBufIdx = 0;

        auto getVarBuffer = [&] (int idx) {
          VRK_LOG_AND_FATAL_IF(idx >= varBufferCount, "Invalid index");
          return static_cast<char*>(sharedMemPtr + varBufferOffset + (idx * varBufferSize));
        };


        CopyMemory(sharedMemPtr + dataHeader.varHeaderOffset, static_cast<void*>(headers.data()), headerBufferSize);

        auto nextDataFrame = [&]() -> bool {
          std::scoped_lock lock(mutex_);

          if (!diskClient.next()) {
            L->debug("Reached last sample {} of {}", diskClient.getSampleIndex(), diskClient.getSampleCount());
            return false;
          }

          if (isFirst) isFirst = false;

          VRK_LOG_AND_FATAL_IF(!diskClient.copyDataVariableBuffer(getVarBuffer(varBufIdx), varBufferSize), "Unable to copy data variable buffer");

          auto tickOpt = diskClient.getVarInt("SessionTick");
          VRK_LOG_AND_FATAL_IF(!tickOpt, "Unable to get session tick variable");

          dataHeader.varBuf[varBufIdx].tickCount = tickOpt.value();

          varBufIdx++;
          if (varBufIdx >= varBufferCount) {
            varBufIdx = 0;
          }

          return true;
        };

        std::size_t frameCount = 0;
        while (true) {
          ResetEvent(dataValidEventHandle);

          if (!running_)
            break;


          if (isFirst && !nextDataFrame()) {
            break;
          }

          // Grab the tick count from the header, which was
          // updated in `nextDataFrame()`
          auto sessionTickCount = dataHeader.varBuf[varBufIdx].tickCount;

          // Copy all changed data to the shared memory buffer
          CopyMemory(sharedMemPtr, &dataHeader, DataHeaderSize);
          CopyMemory(sharedMemPtr + dataHeader.session.offset, sessionInfoStr.data(), dataHeader.session.len);

          SetEvent(dataValidEventHandle);

          auto currentTimeMillis = TimeEpoch();

          //auto posCountRes = diskClient.getVarCount(KnownVarName::CarIdxPosition);
          auto currentSessionTimeVal = diskClient.getVarDouble(KnownVarName::SessionTime);

          VRK_LOG_AND_FATAL_IF(!currentSessionTimeVal, "No session time");
          auto currentSessionTime = currentSessionTimeVal.value();
          auto currentSessionTimeMillis = SDK::Utils::SessionTimeToMillis(currentSessionTime);


          if (!nextDataFrame()) {
            if (running_) {
              L->info("Reached the last sample, resetting to the first of {}", diskClient.getSampleCount());
            }
            break;
          }

          auto nextSessionTimeVal = diskClient.getVarDouble(KnownVarName::SessionTime);
          VRK_LOG_AND_FATAL_IF(!nextSessionTimeVal, "No next session time");
          auto nextSessionTime = nextSessionTimeVal.value();
          auto nextSessionTimeMillis = SDK::Utils::SessionTimeToMillis(nextSessionTime);

          auto dataFrameIntervalMillis = std::chrono::milliseconds(nextSessionTimeMillis - currentSessionTimeMillis);
          auto nextTimeMillis = currentTimeMillis + dataFrameIntervalMillis;
          std::chrono::steady_clock::time_point nextTime{nextTimeMillis};

          auto nowTime = std::chrono::steady_clock::now();
          auto intervalDuration = nextTime - nowTime;
          if (frameCount % 600 == 0) {
            std::cerr << std::format("FrameCount={},SessionTick={},SessionTime={},NextFrameWait={}ms", frameCount, sessionTickCount, currentSessionTime, duration_cast<std::chrono::milliseconds>(intervalDuration).count()) << std::endl;
          }

          {
            std::unique_lock threadLock(mutex_);
            sleepCondition_.wait_for(
              threadLock,
              intervalDuration,
              [&] {
                return !running_;
              }
            );
          }

          frameCount++;
        }

        CloseHandle(dataValidEventHandle);

        UnmapViewOfFile(sharedMemPtr);
        CloseHandle(memMapFileHandle);

      }

    public:
      LiveDataReplayTool() = delete;

      explicit LiveDataReplayTool(const fs::path& ibtPath) : diskClient_(ibtPath, ibtPath.string()),
                                                             ibtPath_{ibtPath},
                                                             thread_(
                                                               std::make_unique<std::thread>(
                                                                 &LiveDataReplayTool::run,
                                                                 this
                                                               )
                                                             ) {
      };

      LiveDataReplayTool(const LiveDataReplayTool&) = delete;
      LiveDataReplayTool(LiveDataReplayTool&&) = delete;

      /**
       * @brief Wait for thread to complete
       */
      void waitFor() {
        if (thread_ && thread_->joinable()) {
          thread_->join();
        }
      }

      /**
       * @brief Destroy the tool
       */
      void destroy() {
        std::scoped_lock lock(mutex_);
        if (!running_.exchange(false)) {
          return;
        }

        sleepCondition_.notify_all();
        waitFor();
      }
    };

    std::shared_ptr<LiveDataReplayTool> gLiveDataReplayTool{nullptr};

    void SignalHandler(int signal) {
      std::cerr << "Interrupted by Signal" << signal << "\n";
      L->info("Interrupted ({})", signal);

      if (gLiveDataReplayTool) gLiveDataReplayTool->destroy();
    }
  } // namespace


  CLI::App* LiveDataReplayArgCommand::createCommand(CLI::App* app) {
    auto cmd = app->add_subcommand("live-data-replay", "Mock a live session using an existing IBT telemetry command");
    cmd->add_option("-i,--ibt-file", ibtPath_, "Input IBT data file");

    return cmd;
  }

  int LiveDataReplayArgCommand::execute() {
    std::signal(SIGINT, SignalHandler);

    L->info("execute live data replay using: {}", ibtPath_);

    auto tool = gLiveDataReplayTool = std::make_shared<LiveDataReplayTool>(ibtPath_);
    tool->waitFor();

    return 0;
  }
} // namespace IRacingTools::App::Commands
