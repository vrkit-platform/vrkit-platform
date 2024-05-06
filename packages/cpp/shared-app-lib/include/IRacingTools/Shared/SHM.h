//
// Created by jglanz on 1/5/2024.
//

#pragma once

#include <optional>
#include <random>
#include <shared_mutex>


#include <IRacingTools/Shared/SharedAppLibPCH.h>
#include <IRacingTools/Shared/Constants.h>
#include <IRacingTools/Shared/FileSystemHelpers.h>
#include <IRacingTools/Shared/Geometry2D.h>
#include <IRacingTools/Shared/VRTypes.h>

namespace IRacingTools::Shared::SHM {
    static constexpr DXGI_FORMAT SHARED_TEXTURE_PIXEL_FORMAT = DXGI_FORMAT_B8G8R8A8_UNORM;
    static constexpr auto SHARED_TEXTURE_IS_PREMULTIPLIED = true;

    struct SHMConfig final {
        uint64_t globalInputLayerId{};
        VR::VRRenderConfig vr{};
        //  ConsumerPattern target {};
        PixelSize textureSize{};
        std::array<float, 4> tint{1, 1, 1, 1};
    };

    enum SHMHeaderFlags : ULONG {
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
    static uint64_t CreateSessionID();


    // DUPLICATED FROM OKB
    struct FrameMetadata {
        // Use the magic string to make sure we don't have
        // uninitialized memory that happens to have the
        // feeder-attached bit set
        static constexpr std::string_view Magic{"IRTMagic"};
        static_assert(Magic.size() == sizeof(uint64_t));
        uint64_t magic = *reinterpret_cast<const uint64_t*>(Magic.data());

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

        std::size_t getRenderCacheKey() const;
        bool haveFeeder() const;
    };

    static_assert(std::is_standard_layout_v<FrameMetadata>);
    static constexpr DWORD SHMSize = sizeof(FrameMetadata);

    static std::wstring SHMPath();

    static std::wstring SHMMutexPath();

    static std::wstring SHMEventPath();


    class Writer final {
    public:
        struct NextFrameInfo {
            uint8_t textureIndex{};
            LONG64 fenceOut{};
        };

        Writer() = delete;
        Writer(uint64_t gpuLUID);
        ~Writer();

        void detach();

        operator bool() const;

        void submitEmptyFrame();

        NextFrameInfo beginFrame() noexcept;
        void submitFrame(const SHMConfig& config, const std::vector<LayerConfig>& layers, HANDLE texture, HANDLE fence);

        // "Lockable" C++ named concept: supports std::unique_lock
        void lock();
        bool try_lock();
        void unlock();

    private:
        class Impl;
        std::shared_ptr<Impl> impl_;
    };
} // namespace IRacingTools::Shared
