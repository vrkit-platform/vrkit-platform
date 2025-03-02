#include <IRacingTools/SDK/DiskClientDataFrameProcessor.h>
#include <IRacingTools/SDK/Utils/CollectionHelpers.h>
#include <IRacingTools/SDK/VarHolder.h>
#include <IRacingTools/Shared/Logging/LoggingManager.h>

#include <IRacingTools/Shared/FileSystemHelpers.h>
#include <IRacingTools/Shared/Logging/LoggingManager.h>
#include <IRacingTools/Shared/Services/TelemetryFileHandler.h>

#include <fstream>
#include <iostream>
#include <magic_enum.hpp>


#include <google/protobuf/util/json_util.h>

namespace IRacingTools::Shared::Services {
  using namespace IRacingTools::SDK;
  using namespace IRacingTools::Shared::Logging;
  using namespace IRacingTools::SDK::Utils;

  namespace {
    auto L = GetCategoryWithType<TelemetryFileHandler>();
    constexpr std::size_t MinimumDataFrameCountValidLap =
        60    // 60 data frames per second from iRacing
        * 30; // using 30 seconds as the minimum lap time
  } // namespace

  TelemetryFileHandler::TelemetryFileHandler(const std::filesystem::path &file)
      : client_(std::make_shared<SDK::DiskClient>(file, file.string())) {
    L->info("Created with {}", file.string());
  }

  TelemetryFileHandler::TelemetryFileHandler(
      const std::shared_ptr<SDK::DiskClient> &client)
      : client_(client) {
    L->info(
        "Created with disk client {}", client->getFilePath().value().string());
  }

  std::
      expected<std::vector<TelemetryFileHandler::LapDataWithPath>, GeneralError>
      TelemetryFileHandler::getLapData(bool includeInvalidLaps) {
    using DataFrameProcessor = DiskClientDataFrameProcessor<GetLapDataContext>;

    GetLapDataContext data{};
    DataFrameProcessor processor(client_);
    auto client = processor.getClient();
    auto provider = client->getProvider();

    VarHolder sessionTimeVar(
        IRacingTools::SDK::KnownVarName::SessionTime, provider.get());
    VarHolder lapVar(IRacingTools::SDK::KnownVarName::Lap, provider.get());
    VarHolder lapTimeCurrentVar(
        IRacingTools::SDK::KnownVarName::LapCurrentLapTime, provider.get());
    VarHolder lapDistPctVar(
        IRacingTools::SDK::KnownVarName::LapDistPct, provider.get());
    VarHolder lapDistVar(
        IRacingTools::SDK::KnownVarName::LapDist, provider.get());
    VarHolder incidentCountVar(
        IRacingTools::SDK::KnownVarName::PlayerCarMyIncidentCount,
        provider.get());
    VarHolder latVar(IRacingTools::SDK::KnownVarName::Lat, provider.get());
    VarHolder lonVar(IRacingTools::SDK::KnownVarName::Lon, provider.get());
    VarHolder altVar(IRacingTools::SDK::KnownVarName::Alt, provider.get());

    std::vector<DataFrame> frames{client->getSampleCount()};
    auto addCurrentFrameData =
        [&](const DiskClientDataFrameProcessor<GetLapDataContext>::Context
                &context) {
          // info("Adding frame ({} of {}), session time ({})",
          // context.frameIndex, context.frameCount,
          // context.sessionTimeSeconds);
          frames.emplace_back(
              sessionTimeVar.getDouble(),
              lapVar.getInt(),
              lapTimeCurrentVar.getDouble(),
              lapDistPctVar.getFloat(),
              lapDistVar.getFloat(),
              incidentCountVar.getInt(),
              latVar.getDouble(),
              lonVar.getDouble(),
              altVar.getFloat());
        };


    auto res = processor.run(
        [&](const auto &context, auto &) {
          addCurrentFrameData(context);
          auto lap = lapVar.getInt();
          if (lap > data.lapCount) {
            data.lapCount += 1;
          }
          return true;
        },
        data);

    auto frameLapChunkFn = [](const DataFrame &o1, const DataFrame &o2) {
      return std::get<1>(o1) == std::get<1>(o2);
    };

    auto frameLapChunks = frames | std::views::chunk_by(frameLapChunkFn);
    int32_t totalIncidients = 0;
    std::vector<LapDataWithPath> laps{};
    for (auto const &chunk: frameLapChunks) {
      LapDataWithPath lap{};
      for (auto const &frame: chunk) {
        if (std::get<0>(frame) > std::get<0>(lap)) {
          std::get<0>(lap) = std::get<0>(frame);
          std::get<1>(lap) = std::get<1>(frame);
          std::get<2>(lap) = std::get<2>(frame);
          std::get<3>(lap) = std::get<5>(frame);
          double lat = std::get<6>(frame);
          double lon = std::get<7>(frame);
          if (lat != 0.0 && lon != 0.0) {
            auto coord = LapPositionCoordinateTuple{
                std::get<1>(frame),
                std::get<2>(frame),
                std::get<3>(frame),
                std::get<4>(frame),
                lat,
                lon,
                std::get<8>(frame)};

            std::get<4>(lap).emplace_back(std::move(coord));
          }
        }
      }

      auto lapSessionTime = std::get<0>(lap);
      if (lapSessionTime &&
          (laps.empty() || std::get<0>(laps.back()) < lapSessionTime)) {
        auto incidentCount = std::get<3>(lap);
        std::get<3>(lap) = incidentCount - totalIncidients;
        totalIncidients = incidentCount;

        laps.push_back(std::move(lap));
      }
    }

    for (auto &lap: laps) {
      auto &[sessionTime, lapNumber, lapTime, incidientCount, coordinates] =
          lap;
      L->debug(
          "sessionTime={},lap={},lapTimeSeconds={},incidentCount={},"
          "coordinateCount={}",
          sessionTime,
          lapNumber,
          lapTime,
          incidientCount,
          coordinates.size());
    }

    if (!includeInvalidLaps) {
      std::erase_if(laps, [](auto &lap) {
        return std::get<3>(lap) > 0;
      });
    }

    if (laps.empty()) {
      return std::unexpected(
          SDK::GeneralError(ErrorCode::General, "No lap data found"));
    }

    auto &firstLap = laps[0];
    auto firstLapNumber = std::get<1>(firstLap);
    auto &lastLap = laps.back();
    auto lastLapNumber = std::get<1>(lastLap);

    std::erase_if(laps, [&](auto &lap) {
      auto lapNumber = std::get<1>(lap);
      auto &coordinates = std::get<4>(lap);
      return coordinates.size() < MinimumDataFrameCountValidLap ||
             lapNumber == firstLapNumber || lapNumber == lastLapNumber;
    });

    auto lapCount = laps.size();
    if (lapCount < 3) {
      return std::unexpected(SDK::GeneralError(
          ErrorCode::General,
          "At least 3 laps must exist in a telemetry file to be valid"));
    }


    return laps;
  }


} // namespace IRacingTools::Shared::Services
