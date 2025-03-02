//
// Created by jglanz on 4/19/2024.
//


#include <conio.h>
#include <csignal>
#include <cstdio>
#include <cassert>
#include <ctime>
#include <windows.h>

#include <IRacingTools/SDK/SessionInfo/ModelParser.h>
#include <IRacingTools/SDK/LiveConnection.h>
#include <IRacingTools/SDK/Utils/YamlParser.h>
#include <IRacingTools/SDK/DiskClient.h>
#include <IRacingTools/SDK/LiveClient.h>
#include <IRacingTools/SDK/Types.h>
#include <IRacingTools/SDK/Utils/YamlParser.h>

#include "SessionRecordArgCommand.h"

#include <yaml-cpp/yaml.h>

// for timeBeginPeriod
#pragma comment(lib, "Winmm")

// 16 ms timeout
#define TIMEOUT 16
namespace IRacingTools::App::Commands {
  namespace {

    using namespace IRacingTools::SDK;

    char *g_data = nullptr;
    int g_nData = 0;
    time_t g_ttime;
    FILE *g_file = nullptr;

    const char g_playerInCarString[] = "IsOnTrack";
    int g_playerInCarOffset = -1;

    const char g_sessionTimeString[] = "SessionTime";
    int g_sessionTimeOffset = -1;

    const char g_sessionUniqueIdString[] = "SessionUniqueID";
    int g_sessionUniqueIdOffset = -1;

    const char g_sessionTickString[] = "SessionTick";
    int g_sessionTickOffset = -1;


    const char g_lapIndexString[] = "Lap";
    int g_lapIndexOffset = -1;

    // place holders for data that needs to be updated in our IBT file
    DataHeader g_diskHeader;
    DiskSubHeader g_diskSubHeader;
    int g_diskSubHeaderOffset = 0;
    int g_diskLastLap = -1;

    std::string gOutputPath{};

    // open a file for writing, without overwriting any existing files
    std::optional<std::pair<std::string, FILE *>> openUniqueFile(const char *name, const char *ext, time_t t_time, bool asBinary, std::string outputPath = gOutputPath) {
      FILE *file = nullptr;
      char tmpFileNameStr[MAX_PATH] = "";
      int i = 0;

      // find an unused filename
      do {
        if (file)
          fclose(file);


        _snprintf(tmpFileNameStr, MAX_PATH, "%s\\%s", outputPath.c_str(), name);
        tmpFileNameStr[MAX_PATH - 1] = '\0';

        tm tm_time;
        localtime_s(&tm_time, &t_time);
        strftime(tmpFileNameStr + strlen(tmpFileNameStr), MAX_PATH - strlen(tmpFileNameStr), " %Y-%m-%d %H-%M-%S", &tm_time);
        tmpFileNameStr[MAX_PATH - 1] = '\0';

        if (i > 0) {
          _snprintf(tmpFileNameStr + strlen(tmpFileNameStr), MAX_PATH - strlen(tmpFileNameStr), " %02d", i, ext);
          tmpFileNameStr[MAX_PATH - 1] = '\0';
        }

        _snprintf(tmpFileNameStr + strlen(tmpFileNameStr), MAX_PATH - strlen(tmpFileNameStr), ".%s", ext);
        tmpFileNameStr[MAX_PATH - 1] = '\0';

        file = fopen(tmpFileNameStr, "r");
      } while (file && ++i < 100);

      // failed to find an unused file
      if (file) {
        fclose(file);
        return std::nullopt;
      }

      std::string filename(tmpFileNameStr);
      auto fileMode = asBinary ? "wb" : "w";
      file = fopen(tmpFileNameStr, fileMode);
      if (!file) {
        std::println(std::cerr, "Failed to open temp file {} with mode {}", tmpFileNameStr, fileMode);
        return std::nullopt;
      }
      return {{filename,file}};

    }

    // log header to ibt binary format
    void logHeaderToIBT(const DataHeader *header, FILE *file, time_t t_time) {
      static auto &conn = LiveConnection::GetInstance();
      if (header && file) {
        int offset = 0;

        // main header
        std::memcpy(&g_diskHeader, header, sizeof(g_diskHeader));
        offset += sizeof(g_diskHeader);

        // sub header is written out at end of session
        std::memset(&g_diskSubHeader, 0, sizeof(g_diskSubHeader));
        g_diskSubHeader.startDate = t_time;
        g_diskSubHeaderOffset = offset;
        offset += sizeof(g_diskSubHeader);

        // pointer to var definitions
        g_diskHeader.varHeaderOffset = offset;
        offset += g_diskHeader.numVars * sizeof(VarDataHeader);

        // pointer to session info string
        g_diskHeader.session.offset = offset;
        offset += g_diskHeader.session.len;

        // pointer to start of buffered data
        g_diskHeader.numBuf = 1;
        g_diskHeader.varBuf[0].bufOffset = offset;

        fwrite(&g_diskHeader, 1, sizeof(g_diskHeader), file);
        fwrite(&g_diskSubHeader, 1, sizeof(g_diskSubHeader), file);
        fwrite(conn.getVarHeaderPtr(), 1, g_diskHeader.numVars * sizeof(VarDataHeader), file);
        fwrite(conn.getSessionInfoStr(), 1, g_diskHeader.session.len, file);

        if (ftell(file) != g_diskHeader.varBuf[0].bufOffset)
          printf("ERROR: file pointer mismatch: %ld != %d\n", ftell(file), g_diskHeader.varBuf[0].bufOffset);
      }
    }

    void logDataToIBT(const DataHeader *header, const char *data, FILE *file) {
      // write data to disk, and update irsdk_diskSubHeader in memory
      if (header && data && file) {
        fwrite(data, 1, g_diskHeader.bufLen, file);
        g_diskSubHeader.sampleCount++;

        if (g_sessionTimeOffset >= 0) {
          double time = *((double *) (data + g_sessionTimeOffset));
          if (g_diskSubHeader.sampleCount == 1) {
            g_diskSubHeader.startTime = time;
            g_diskSubHeader.endTime = time;
          }

          if (g_diskSubHeader.endTime < time)
            g_diskSubHeader.endTime = time;
        }

        if (g_lapIndexOffset >= 0) {
          const int lap = *((int *) (data + g_lapIndexOffset));

          if (g_diskSubHeader.sampleCount == 1)
            g_diskLastLap = lap - 1;

          if (g_diskLastLap < lap) {
            g_diskSubHeader.lapCount++;
            g_diskLastLap = lap;
          }
        }
      }
    }

    void logCloseIBT(FILE *file) {
      if (file) {
        fseek(file, g_diskSubHeaderOffset, SEEK_SET);
        fwrite(&g_diskSubHeader, 1, sizeof(g_diskSubHeader), file);
      }
    }


    void logStateToFile(time_t t_time) {
      static auto &conn = LiveConnection::GetInstance();
      static std::atomic_int32_t counter {0};
      auto tickCountRes = conn.getSessionTickCount();
      if (!tickCountRes.has_value()) {
        printf("Tick count unavailable\n");
        return;
      }

      if (auto sessionInfoStr = conn.getSessionInfoStr()) {
        auto filePrefix = std::format("{}_{}_irsdk_session", counter.load(), tickCountRes.value());
        auto fileRes = openUniqueFile(filePrefix.c_str(), "yaml", t_time, false);
        if (!fileRes)
          abort();

        auto [filename, file] = fileRes.value();
        if (file) {
          // dump session information to disk
          fputs(sessionInfoStr, file);
          fclose(file);
        }

        ++counter;
      }
    }

    // dump data to display, for debugging
    void logHeaderToDisplay(const DataHeader *header) {
      if (header) {
        printf("\n\nSession Info String:\n\n");

        // puts is safer in case the string contains '%' characters
        puts(LiveConnection::GetInstance().getSessionInfoStr());

        printf("\n\nVariable Headers:\n\n");
        for (int i = 0; i < header->numVars; i++) {
          const VarDataHeader *rec = LiveConnection::GetInstance().getVarHeaderEntry(i);
          printf("%s, %s, %s\n", rec->name, rec->desc, rec->unit);
        }
        printf("\n\n");
      }
    }

    void logDataToDisplay(const DataHeader *header, const char *data) {
      if (header && data) {
        for (int i = 0; i < header->numVars; i++) {
          const VarDataHeader *rec = LiveConnection::GetInstance().getVarHeaderEntry(i);

          printf("%s[", rec->name);

          // only dump the first 4 entrys in an array to save space
          // for now ony carsTrkPct and carsTrkLoc output more than 4 entrys
          int count = 1;
          if (rec->type != VarDataType::Char)
            count = std::min<int>(4, rec->count);

          for (int j = 0; j < count; j++) {
            switch (rec->type) {
              case VarDataType::Char:
                printf("%s", (char *) (data + rec->offset));
                break;
              case VarDataType::Bool:
                printf("%d", ((bool *) (data + rec->offset))[j]);
                break;
              case VarDataType::Int32:
                printf("%d", ((int *) (data + rec->offset))[j]);
                break;
              case VarDataType::Bitmask:
                printf("0x%08x", ((int *) (data + rec->offset))[j]);
                break;
              case VarDataType::Float:
                printf("%0.2f", ((float *) (data + rec->offset))[j]);
                break;
              case VarDataType::Double:
                printf("%0.2f", ((double *) (data + rec->offset))[j]);
                break;
            }

            if (j + 1 < count)
              printf("; ");
          }
          if (rec->type != VarDataType::Char && count < rec->count)
            printf("; ...");

          printf("]");

          if ((i + 1) < header->numVars)
            printf(", ");
        }
        printf("\n\n");
      }
    }

    void initData(const DataHeader *header, char *&data, int &nData) {
      if (data)
        delete[] data;
      nData = header->bufLen;
      data = new char[nData];

      // grab the memory offset to the playerInCar flag
      g_playerInCarOffset = LiveConnection::GetInstance().varNameToOffset(g_playerInCarString);
      g_sessionTickOffset = LiveConnection::GetInstance().varNameToOffset(g_sessionTickString);
      g_sessionUniqueIdOffset = LiveConnection::GetInstance().varNameToOffset(g_sessionUniqueIdString);
      g_sessionTimeOffset = LiveConnection::GetInstance().varNameToOffset(g_sessionTimeString);
      g_lapIndexOffset = LiveConnection::GetInstance().varNameToOffset(g_lapIndexString);

    }

    bool canLogToFile(const DataHeader *header, const char *data) {
      (void) header;
      (void) data;
      return
#ifdef LOG_IN_CAR_ONLY
          // only log if driver in car...
          (g_playerInCarOffset < 0 || *((bool *) (data + g_playerInCarOffset)));
#else
          true;
#endif
    }

    bool open_file(const int sessionId, FILE *&file, time_t &t_time) {
      // get current time
      t_time = time(nullptr);

      auto sessionInfoData = LiveConnection::GetInstance().getSessionInfoStr();
      std::shared_ptr<SessionInfo::SessionInfoMessage> sessionInfo{nullptr};
      if (sessionInfoData) {
        auto rootNode = YAML::Load(sessionInfoData);
        sessionInfo = std::make_shared<SessionInfo::SessionInfoMessage>();
        if (sessionInfo) {
          SessionInfo::SessionInfoMessage * sessionInfoMessage = sessionInfo.get();
          *sessionInfoMessage = rootNode.as<SessionInfo::SessionInfoMessage>();
        }
      }

      std::string trackName = "UNKNOWN";
      if (sessionInfo) {
        auto& weekendInfo = sessionInfo->weekendInfo;
        trackName = weekendInfo.trackName;
      }

      #ifdef LOG_TO_CSV
      #define LOG_FILE_ARGS "csv", t_time, false
      #else
      #define LOG_FILE_ARGS "ibt", t_time, true
      #endif

      std::string prefix = fmt::format("{}_ir_session_track_{}", sessionId, trackName);
      auto fileRes = openUniqueFile(prefix.c_str(), LOG_FILE_ARGS);
      auto [filename, tmpFile] = fileRes.value();
      file = tmpFile;

      if (file) {
        fmt::println("Recording session to file ({})", filename);
        return true;
      }

      fmt::println("Failed to create recording file");
      return false;
    }

    void close_file(FILE *&file, time_t t_time) {
      // if disconnected close file
      if (file) {
#ifndef LOG_TO_CSV
        logCloseIBT(file);
#endif
        // write last state string recieved out to disk
        logStateToFile(t_time);

        fclose(file);
        file = nullptr;

        printf("Session ended.\n\n");
      }
    }

    void end_session(bool shutdown) {
      close_file(g_file, g_ttime);

      if (g_data)
        delete[] g_data;
      g_data = nullptr;

      if (shutdown) {
        LiveConnection::GetInstance().cleanup();
        timeEndPeriod(1);
      }
    }

    // exited with ctrl-c
    void ex_program(int sig) {
      (void) sig;

      printf("received ctrl-c, exiting\n\n");

      end_session(true);

      signal(SIGINT, SIG_DFL);
      exit(0);
    }

    int getSessionId() {
      assert((g_sessionUniqueIdOffset > -1, "g_sessionUniqueIdOffset is not set properly"));
      auto sessionId = *((int *) (g_data + g_sessionUniqueIdOffset));
      return sessionId;
    }

    int getSessionTick() {
      assert((g_sessionTickOffset > -1 && "g_sessionTickOffset is not set properly"));
      auto sessionTick = *((int *) (g_data + g_sessionTickOffset));
      return sessionTick;
    }

    int recordSession(const std::string &outputPath, bool printHeader, bool printData) {

      // SET GLOBAL OUTPUT PATH
      assert((std::filesystem::is_directory(outputPath) && "output path is does not exist"));

      gOutputPath = outputPath;

      // CREATE CHILD SESSION INFO OUTPUT PATH
      auto sessionInfoOutputPath = fs::path(gOutputPath) / "session-info";
      if (!fs::is_directory(sessionInfoOutputPath)) {
        fs::create_directories(sessionInfoOutputPath);
      }

      assert((std::filesystem::is_directory(sessionInfoOutputPath) && "output path is does not exist"));

      // trap ctrl-c
      signal(SIGINT, ex_program);
      printf("press enter to exit:\n\n");

      // bump priority up so we get time from the sim
      SetPriorityClass(GetCurrentProcess(), HIGH_PRIORITY_CLASS);

      // ask for 1ms timer so sleeps are more precise
      timeBeginPeriod(1);
      g_data = nullptr;
      g_nData = 0;
      //auto &client = LiveClient::GetInstance();
      auto &conn = LiveConnection::GetInstance();

      //std::shared_ptr<Client::WeakSessionInfoWithUpdateCount> prevSessionInfo{nullptr};
      std::atomic_uint32_t prevSessionInfoUpdateCount = 0;
      while (!_kbhit()) {
        // wait for new data and copy it into the g_data buffer, if g_data is not null
        if (conn.waitForDataReady(TIMEOUT, g_data)) {
          auto pHeader = conn.getHeader();
          if (pHeader) {
            // if header changes size, assume a new connection
            if (!g_data || g_nData != pHeader->bufLen) {
              // relocate our g_data buffer to fit, and lookup some data offsets
              initData(pHeader, g_data, g_nData);

              if (printHeader)
                logHeaderToDisplay(pHeader);

            }

            if (g_data) {
              auto sessionId = getSessionId();
              auto sessionTick = getSessionTick();

              // open file if first time
              if (!g_file && open_file(sessionId, g_file, g_ttime)) {
                logHeaderToIBT(pHeader, g_file, g_ttime);
              }

              // and log data to file
              if (g_file) {
                logDataToIBT(pHeader, g_data, g_file);
              }

              if (printData) {
                static int ct = 0;
                if (ct++ % 100 == 0) {
                  printf("Index %d ticks=%d, session info updates=%u\n", ct, sessionTick, prevSessionInfoUpdateCount.load());
                  //logDataToDisplay(pHeader, g_data);
                }
              }

              auto newSessionInfoUpdateCount = conn.getSessionUpdateCount();
              if (newSessionInfoUpdateCount > prevSessionInfoUpdateCount) {
                prevSessionInfoUpdateCount = newSessionInfoUpdateCount;
                auto sessionInfoStr = conn.getSessionInfoStr();
                if (sessionInfoStr) {
                  auto sessionInfoLen = strlen(sessionInfoStr);
                  auto sessionInfo = conn.getSessionInfo();

                  auto t_time = time(nullptr);
                  std::string prefix = fmt::format("{}_{}_{}_ir_session_info_update_track-{}", sessionTick, sessionId, newSessionInfoUpdateCount, sessionInfo->weekendInfo.trackName);
                  auto fileRes = openUniqueFile(prefix.c_str(), "yaml", t_time, false, sessionInfoOutputPath.string());
                  if (fileRes) {
                    auto [filename, tmpFile] = fileRes.value();
                    if (!tmpFile) {
                      fmt::println("ERROR creating file for session info dump #{}", newSessionInfoUpdateCount);
                    } else {
                      fmt::println("Session info updated #{}, dumping {} ", newSessionInfoUpdateCount, filename);
                      fwrite(sessionInfoStr, 1, sessionInfoLen, tmpFile);
                      fclose(tmpFile);
                    }
                  }
                }
              }
            }
          }
        }
        // session ended
        else if (!conn.isConnected())
          end_session(false);
      }

      // exited with a keyboard hit
      printf("Shutting down.\n\n");

      end_session(true);

      return 0;
    }

  }// namespace


  CLI::App *SessionRecordArgCommand::createCommand(CLI::App *app) {


    auto cmd = app->add_subcommand("record", "Record Live Session");

    cmd->add_option("-o,--output", outputPath_, "Output path")
        ->required(false)
        ->default_val(std::filesystem::current_path().string());
    cmd->add_flag("--print-header", printHeader_, "Print header to stdout")->required(false)->default_val(false);
    cmd->add_flag("--print-data", printData_, "Print data to stdout")->required(false)->default_val(false);


    return cmd;
  }

  int SessionRecordArgCommand::execute() {
    auto outputPath = outputPath_;
    fmt::println("outputPath: {}", outputPath);
    assert((!outputPath.empty() && "Output path is invalid"));
    outputPath = std::filesystem::absolute(outputPath).string();
    fmt::println("Absolute Output Path: {}", outputPath);
    std::filesystem::create_directories(outputPath);
    assert((std::filesystem::is_directory(outputPath) && "Fail create output path"));

    return recordSession(outputPath, printHeader_, printData_);
  }
}