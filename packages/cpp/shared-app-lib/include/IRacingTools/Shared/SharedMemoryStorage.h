//
// Created by jglanz on 1/5/2024.
//

#pragma once
#include <IRacingTools/Models/TrackMapData.pb.h>
#include <optional>
#include <random>
#include <shared_mutex>

#include "Constants.h"
#include "FileSystemHelpers.h"
#include "Geometry2D.h"
#include "VRTypes.h"

namespace IRacingTools::Shared {

  using namespace Geometry2D;
  using namespace VR;

  struct SHMConfig final {
    uint64_t globalInputLayerId{};
    VRRenderConfig vr{};
    //  ConsumerPattern target {};
    PixelSize textureSize{};
    std::array<float, 4> tint{1, 1, 1, 1};
  };

  enum class SHMHeaderFlags : ULONG {
    FEEDER_ATTACHED = 1 << 0,
  };

  struct LayerConfig final {
    uint64_t layerID{};

    bool vrEnabled{false};
    VR::VRLayer vr{};
  };
  static_assert(std::is_standard_layout_v<LayerConfig>);

  /**
   * @brief Create unique session id
   * @return
   */
  static uint64_t CreateSessionID() {
    std::random_device randDevice;
    std::uniform_int_distribution<uint32_t> randDist;
    return (static_cast<uint64_t>(GetCurrentProcessId()) << 32) | randDist(randDevice);
  }



  // DUPLICATED FROM OKB
  struct FrameMetadata {
    // Use the magic string to make sure we don't have
    // uninitialized memory that happens to have the
    // feeder-attached bit set
    static constexpr std::string_view Magic{"IRTMagic"};
    static_assert(Magic.size() == sizeof(uint64_t));
    uint64_t magic = *reinterpret_cast<const uint64_t *>(Magic.data());

    uint64_t gpuLUID{};

    uint64_t frameNumber = 0;
    uint64_t sessionId = CreateSessionID();
    SHMHeaderFlags flags;
    SHMConfig config;

    uint8_t layerCount = 0;
    LayerConfig layers[MaxViewCount];

    DWORD feederProcessID{};
    // If you're looking for texture size, it's in Config
    HANDLE texture{};
    HANDLE fence{};

    alignas(2 * sizeof(LONG64)) std::array<LONG64, SHMSwapchainLength> frameReadyFenceValues{0};

    size_t getRenderCacheKey() const;
    bool haveFeeder() const;
  };

  static_assert(std::is_standard_layout_v<FrameMetadata>);
  static constexpr DWORD SHM_SIZE = sizeof(FrameMetadata);

  static auto SHMPath() {
    static std::wstring sCache;
    if (!sCache.empty()) [[likely]] {
      return sCache;
    }
    sCache = std::format(
        L"{}/IRT-s{:x}",
        ProjectReverseDomainW,
        SHM_SIZE);
    return sCache;
  }

  static auto SHMMutexPath() {
    static std::wstring sCache;
    if (sCache.empty()) [[unlikely]] {
      sCache = SHMPath() + L".mutex";
    }
    return sCache;
  }

  static auto SHMEventPath() {
    static std::wstring sCache;
    if (sCache.empty()) [[unlikely]] {
      sCache = SHMPath() + L".event";
    }
    return sCache;
  }


  class SharedMemoryStorage {
  public:
    static std::shared_ptr<SharedMemoryStorage> GetInstance();

    bool loadTrackMapFromLapTrajectoryFile(const fs::path &path);
    std::optional<TrackMap> setTrackMap(const std::optional<TrackMap> &newTrackMap);
    std::optional<TrackMap> trackMap();


  private:
    SharedMemoryStorage();

    class Impl;
    std::unique_ptr<Impl> impl_{nullptr};
    std::shared_mutex mutex_{};
    std::optional<TrackMap> trackMap_{std::nullopt};
  };

}// namespace IRacingTools::Shared
