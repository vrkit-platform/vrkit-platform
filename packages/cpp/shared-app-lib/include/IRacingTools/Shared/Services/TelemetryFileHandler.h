#pragma once

#include <IRacingTools/Shared/SharedAppLibPCH.h>

#include <filesystem>

#include <IRacingTools/Models/LapData.pb.h>

#include <IRacingTools/SDK/DiskClient.h>
#include <IRacingTools/SDK/DiskClientDataFrameProcessor.h>
#include <IRacingTools/SDK/Utils/ConsoleHelpers.h>
#include <IRacingTools/SDK/VarHolder.h>

#include <IRacingTools/Shared/Chrono.h>
#include <IRacingTools/Shared/ProtoHelpers.h>

namespace IRacingTools::Shared::Services {
  using namespace IRacingTools::SDK;
  using namespace IRacingTools::SDK::Utils;

  // using Models::UI::;

  class TelemetryFileHandler {
    
  public:
    using LapPositionCoordinate = std::tuple<int,
    double,
                                             float, // Lap Dist Pct (%)
                                             float, // Lap Dist (meters)
                                             double,// Lat
                                             double,// Lon
                                             float  // Altitude
                                             >;

    using DataFrame = std::tuple<double,// Session Time
                                 int,   // Lap
                                 double,// Lap time
                                 float, // Lap dist pct (%)
                                 float, // Lap dist (meters)
                                 int,   // incident count
                                 double,// lat (deg)
                                 double,// lon (deg)
                                 float  // altitude (meters),

                                 >;

    static constexpr std::array<KnownVarName, std::tuple_size_v<DataFrame>> DataFrameVars = {
        KnownVarName::SessionTime, KnownVarName::Lap,     KnownVarName::LapCurrentLapTime,
        KnownVarName::LapDistPct,  KnownVarName::LapDist, KnownVarName::PlayerCarMyIncidentCount,
        KnownVarName::Lat,         KnownVarName::Lon,     KnownVarName::Alt};


    using LapDataWithPath = std::tuple<double, int, double, int, std::vector<LapPositionCoordinate>>;

    struct GetLapDataContext {
      std::size_t lapCount{0};
    };

    struct ProcessorOutput {
      TelemetryFileHandler *handler;
    };

    std::expected<std::vector<LapDataWithPath>, GeneralError> getLapData(bool includeInvalidLaps = false);


  private:
    std::shared_ptr<SDK::DiskClient> client_;

  public:
    explicit TelemetryFileHandler(const std::filesystem::path &file);

    explicit TelemetryFileHandler(const std::shared_ptr<SDK::DiskClient> &client);
  };
}// namespace IRacingTools::Shared::Services
