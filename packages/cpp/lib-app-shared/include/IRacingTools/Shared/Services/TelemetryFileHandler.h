#pragma once

#include <IRacingSDK/DiskClient.h>
#include <IRacingTools/Shared/SharedAppLibPCH.h>
#include <IRacingTools/Models/LapTrajectory.pb.h>
#include <IRacingTools/Shared/ProtoHelpers.h>

#include <filesystem>

namespace IRacingTools::Shared::Services {
  using namespace IRacingSDK;
  using namespace IRacingSDK::Utils;

  class TelemetryFileHandler {

    public:

      using LapPositionCoordinateTuple = std::tuple<int, // 0: LAP #
                                                    double, // 1: LAP TIME
                                                    float, // 2: Lap Dist Pct (%)
                                                    float, // 3: Lap Dist (meters)
                                                    double, // 4: Lat
                                                    double, // 5: Lon
                                                    float // 6: Altitude
      >;

      struct LapPositionCoordinate : public LapPositionCoordinateTuple {

        auto& lap() {
          return std::get<0>(*this);
        };

        auto& lapTime() {
          return std::get<1>(*this);
        };

        auto& completePercent() {
          return std::get<2>(*this);
        };

        auto& completeMeters() {
          return std::get<3>(*this);
        };

        auto& latitude() {
          return std::get<4>(*this);
        };

        auto& longitude() {
          return std::get<5>(*this);
        };

        auto& altitude() {
          return std::get<6>(*this);
        };

        template <std::size_t I = 0>
        void setValue(const LapPositionCoordinateTuple& values) {
          if constexpr (I < std::tuple_size_v<LapPositionCoordinateTuple>) {
            auto value = std::get<I>(values);
            std::get<I>(*this) = value;
            setValue<I + 1>(values);
          }
        }

        explicit LapPositionCoordinate(const LapPositionCoordinateTuple& values) {
          setValue(values);
        }
      };

      using DataFrame = std::tuple<double, // Session Time
                                   int, // Lap
                                   double, // Lap time
                                   float, // Lap dist pct (%)
                                   float, // Lap dist (meters)
                                   int, // incident count
                                   double, // lat (deg)
                                   double, // lon (deg)
                                   float // altitude (meters),
      >;

      static constexpr std::array<KnownVarName, std::tuple_size_v<DataFrame>> DataFrameVars = {
        KnownVarName::SessionTime,
        KnownVarName::Lap,
        KnownVarName::LapCurrentLapTime,
        KnownVarName::LapDistPct,
        KnownVarName::LapDist,
        KnownVarName::PlayerCarMyIncidentCount,
        KnownVarName::Lat,
        KnownVarName::Lon,
        KnownVarName::Alt
      };


      using LapDataWithPath = std::tuple<double, int, double, int, std::vector<LapPositionCoordinate>>;

      struct GetLapDataContext {
        std::size_t lapCount{0};
      };

      struct ProcessorOutput {
        TelemetryFileHandler* handler;
      };

      std::expected<std::vector<LapDataWithPath>, GeneralError>
      getLapData(bool includeInvalidLaps = false);

    private:

      std::shared_ptr<IRacingSDK::DiskClient> client_;

    public:

      explicit TelemetryFileHandler(const std::filesystem::path& file);

      explicit TelemetryFileHandler(const std::shared_ptr<IRacingSDK::DiskClient>& client);
  };
} // namespace IRacingTools::Shared::Services
