//
// Created by jglanz on 1/5/2024.
//

#pragma once

#include <IRacingTools/Shared/SharedAppLibPCH.h>

#include <IRacingTools/Models/TrackMap.pb.h>

#include <numbers>
#include <optional>
#include <random>
#include <shared_mutex>

#include <IRacingTools/Shared/FileSystemHelpers.h>
#include <IRacingTools/Shared/Geometry2D.h>

namespace IRacingTools::Shared::VR {


  /** Position and orientation.
   *
   * This is what's stored in the config file, so intended to be
   * semi-human-editable: distances in meters, rotations in radians.
   */
  struct VRNativePose {
    float x = 0.15f, eyeY = -0.7f, z = -0.4f;
    float rX = -2 * std::numbers::pi_v<float> / 5, rY = -std::numbers::pi_v<float> / 32, rZ = 0.0f;

    VRNativePose getHorizontalMirror() const;

    constexpr auto operator<=>(const VRNativePose &) const noexcept = default;

    bool isValid() const {
      return !(x == 0.0f && eyeY == 0.0f && z == 0.0f);
    }
  };

  struct VRNativeLayout {
    VRNativePose pose{-0.25f, 0.0f, -1.0f};
    VRSize size{0.15f, 0.25f};
  };

  /** If gaze zoom is enabled, how close you need to be looking for zoom to
 * activate */
  struct GazeTargetScale {
    float vertical{1.0f};
    float horizontal{1.0f};
    constexpr auto operator<=>(const GazeTargetScale &) const noexcept = default;
  };

  struct VROpacityConfig {
    float normal{1.0f};
    float gaze{1.0f};
    constexpr auto operator<=>(const VROpacityConfig &) const noexcept = default;
  };

  /** VR settings that apply to every view/layer.
 *
 * Per-view settings are in `ViewVRConfig`
 *
 * This ends up in the SHM; it is extended by `VRConfig` for
 * values that are stored in the config file but need further processing before
 * being put in SHM.
 */
  struct VRRenderConfig {
    struct Quirks final {
      bool alwaysUpdateSwapchain{false};

      enum class Upscaling {
        Automatic,// Varjo-only
        AlwaysOff,
        AlwaysOn,
      };
      Upscaling upscaling{Upscaling::Automatic};

      constexpr auto operator<=>(const Quirks &) const noexcept = default;
    };
    Quirks quirks{};
    bool enableGazeInputFocus{true};

    ///// Runtime-only settings (no JSON) ////

    bool forceZoom{false};
    // Increment every time binding is pressed
    uint64_t recenterCount = 0;

    constexpr auto operator<=>(const VRRenderConfig &) const noexcept = default;
  };



  // Distances in metres, positions in radians.
  struct VROverlayFrameRenderConfig {
    VRNativeLayout layout;
    //VRPose pose;

    //TODO: move physical size references -> `rect.size()` references
    //VRSize physicalSize {0.15f, 0.25f};
    //VRRect rect{};

    // TODO: Remove `enableGazeZoom`, `gazeTargetScale`
    bool enableGazeZoom{true};
    float zoomScale = 2.0f;
    GazeTargetScale gazeTargetScale{};
    VROpacityConfig opacity{};
    // PixelRect locationOnTexture{};
  };

}