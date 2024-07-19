#pragma once

#include <IRacingTools/Shared/SharedAppLibPCH.h>

#include <filesystem>

#include <IRacingTools/Models/LapTrajectory.pb.h>

#include <IRacingTools/SDK/DiskClient.h>
#include <IRacingTools/SDK/DiskClientDataFrameProcessor.h>
#include <IRacingTools/SDK/Utils/ConsoleHelpers.h>
#include <IRacingTools/SDK/VarHolder.h>

#include <IRacingTools/Shared/Chrono.h>
#include <IRacingTools/Shared/ProtoHelpers.h>

namespace IRacingTools::Shared::Services {
  using namespace IRacingTools::SDK;
  using namespace IRacingTools::SDK::Utils;

  // using Models::;

  class TelemetryFileHandler {

  public:
    using LapPositionCoordinateTuple = std::tuple<
        int,    // 0: LAP #
        double, // 1: LAP TIME
        float,  // 2: Lap Dist Pct (%)
        float,  // 3: Lap Dist (meters)
        double, // 4: Lat
        double, // 5: Lon
        float   // 6: Altitude
        >;

    struct LapPositionCoordinate : public LapPositionCoordinateTuple {
      
      VRK_TUPLE_PROP(lap, 0);
      VRK_TUPLE_PROP(lapTime, 1);
      VRK_TUPLE_PROP(completePercent, 2);
      VRK_TUPLE_PROP(completeMeters, 3);
      VRK_TUPLE_PROP(latitude, 4);
      VRK_TUPLE_PROP(longitude, 5);
      VRK_TUPLE_PROP(altitude, 6);

      template<std::size_t I = 0>
      void setValue(const LapPositionCoordinateTuple &values) {
        if constexpr (I < std::tuple_size_v<LapPositionCoordinateTuple>) {
          auto value = std::get<I>(values);
          std::get<I>(*this) = value;
          setValue<I + 1>(values);
        }
      }
      explicit LapPositionCoordinate(const LapPositionCoordinateTuple &values) {
        setValue(values);
      }
    };

    using DataFrame = std::tuple<
        double, // Session Time
        int,    // Lap
        double, // Lap time
        float,  // Lap dist pct (%)
        float,  // Lap dist (meters)
        int,    // incident count
        double, // lat (deg)
        double, // lon (deg)
        float   // altitude (meters),

        >;

    static constexpr std::array<KnownVarName, std::tuple_size_v<DataFrame>>
        DataFrameVars = {
            KnownVarName::SessionTime,
            KnownVarName::Lap,
            KnownVarName::LapCurrentLapTime,
            KnownVarName::LapDistPct,
            KnownVarName::LapDist,
            KnownVarName::PlayerCarMyIncidentCount,
            KnownVarName::Lat,
            KnownVarName::Lon,
            KnownVarName::Alt};


    using LapDataWithPath = std::
        tuple<double, int, double, int, std::vector<LapPositionCoordinate>>;

    struct GetLapDataContext {
      std::size_t lapCount{0};
    };

    struct ProcessorOutput {
      TelemetryFileHandler *handler;
    };

    std::expected<std::vector<LapDataWithPath>, GeneralError>
    getLapData(bool includeInvalidLaps = false);


  private:
    std::shared_ptr<SDK::DiskClient> client_;

  public:
    explicit TelemetryFileHandler(const std::filesystem::path &file);

    explicit TelemetryFileHandler(
        const std::shared_ptr<SDK::DiskClient> &client);
  };
} // namespace IRacingTools::Shared::Services
