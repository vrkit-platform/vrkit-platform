//
// Created by jglanz on 1/5/2024.
//

#pragma once

#include <deque>
#include <optional>
#include <random>
#include <shared_mutex>


#include <IRacingTools/Shared/SharedAppLibPCH.h>
#include <IRacingTools/Shared/Constants.h>
#include <IRacingTools/Shared/FileSystemHelpers.h>
#include <IRacingTools/Shared/Geometry2D.h>
#include <IRacingTools/Shared/VRTypes.h>
#include <IRacingTools/Shared/Macros.h>

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

    struct LayerSprite {
        PixelRect sourceRect;
        PixelRect destRect;
        float opacity{0.0f};
    };

    struct IPCHandles;

    // See SHM::D3D11::IPCClientTexture etc
    class IPCClientTexture {
    public:
        IPCClientTexture() = delete;
        virtual ~IPCClientTexture();

        PixelSize getDimensions() const {
            return dimensions_;
        }

        uint8_t getSwapchainIndex() const {
            return swapchainIndex_;
        }

    protected:
        IPCClientTexture(const PixelSize&, uint8_t swapchainIndex);

    private:
        const PixelSize dimensions_;
        const uint8_t swapchainIndex_;
    };

    // See SHM::D3D11::CachedReader etc
    class IPCTextureCopier {
    public:
        virtual ~IPCTextureCopier();
        virtual void copy(
          HANDLE sourceTexture,
          IPCClientTexture* destinationTexture,
          HANDLE fence,
          uint64_t fenceValueIn) noexcept
          = 0;
    };

    // This needs to be kept in sync with `SHM::ActiveConsumers`
    enum class ConsumerKind : uint32_t {
        SteamVR = 1 << 0,
        OpenXR = 1 << 1,
        OculusD3D11 = 1 << 2,
        OculusD3D12 = 1 << 3,
        NonVRD3D11 = 1 << 4,
        Viewer = ~(0ui32),
      };

    class ConsumerPattern final {
    public:
        ConsumerPattern();
        explicit ConsumerPattern(std::underlying_type_t<ConsumerKind>(consumerKindMask));

        explicit ConsumerPattern(ConsumerKind kind)
          : kindMask_(static_cast<std::underlying_type_t<ConsumerKind>>(kind)) {
        }

        bool matches(ConsumerKind) const;

        std::underlying_type_t<ConsumerKind> getRawMaskForDebugging() const;

    private:
        std::underlying_type_t<ConsumerKind> kindMask_ {0};
    };


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
        static constexpr std::string_view Magic{"VRKMagic"};
        static_assert(Magic.size() == sizeof(uint64_t));
        uint64_t magic = *reinterpret_cast<const uint64_t*>(Magic.data());

        uint64_t gpuLUID{};

        uint64_t frameNumber = 0;
        uint64_t sessionId = CreateSessionID();
        SHMHeaderFlags flags{};
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

    struct IPCHandles {

        winrt::handle textureHandle;
        winrt::handle fenceHandle;

        const HANDLE foreignTextureHandle;
        const HANDLE foreignFenceHandle;

        IPCHandles(HANDLE feederProcess, const FrameMetadata& frame)
          : foreignTextureHandle(frame.texture), foreignFenceHandle(frame.fence) {
            const auto thisProcess = GetCurrentProcess();
            winrt::check_bool(DuplicateHandle(
              feederProcess,
              frame.fence,
              thisProcess,
              fenceHandle.put(),
              NULL,
              FALSE,
              DUPLICATE_SAME_ACCESS));
            winrt::check_bool(DuplicateHandle(
              feederProcess,
              frame.texture,
              thisProcess,
              textureHandle.put(),
              NULL,
              FALSE,
              DUPLICATE_SAME_ACCESS));
        }

        IPCHandles() = delete;
        IPCHandles(const IPCHandles&) = delete;
        IPCHandles(IPCHandles&&) = delete;
        IPCHandles& operator=(const IPCHandles&) = delete;
        IPCHandles& operator=(IPCHandles&&) = delete;
    };


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
        explicit Writer(uint64_t gpuLUID);
        virtual ~Writer();

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



    class Snapshot final {
    public:
        enum class State {
            Empty,
            IncorrectKind,
            IncorrectGPU,
            ValidWithoutTexture,
            ValidWithTexture,
          };
        // marker for constructor
        struct incorrect_kind_t {};
        static constexpr incorrect_kind_t incorrect_kind {};
        struct incorrect_gpu_t {};
        static constexpr incorrect_gpu_t incorrect_gpu {};

        Snapshot(nullptr_t);
        Snapshot(incorrect_kind_t);
        Snapshot(incorrect_gpu_t);

        Snapshot(
          FrameMetadata*,
          IPCTextureCopier* copier,
          IPCHandles* source,
          const std::shared_ptr<IPCClientTexture>& dest);
        Snapshot(FrameMetadata*);
        ~Snapshot();

        uint64_t getSessionID() const;
        /// Changes even if the feeder restarts with frame ID 0
        size_t getRenderCacheKey() const;
        SHMConfig getConfig() const;
        uint8_t getLayerCount() const;
        const LayerConfig* getLayerConfig(uint8_t layerIndex) const;

        template <std::derived_from<IPCClientTexture> T>
        T* getTexture() const {
            if (state_ != State::ValidWithTexture) [[unlikely]] {
                VRK_LOG_AND_FATAL(
                  "Called SHM::Snapshot::GetTexture() with invalid state {}",
                  static_cast<uint8_t>(state_));
            }
            const auto ret = std::dynamic_pointer_cast<T>(ipcTexture_);
            if (!ret) [[unlikely]] {
                VRK_LOG_AND_FATAL("Layer texture cache type mismatch");
            }
            return ret.get();
        }

        State getState() const;

        constexpr bool hasMetadata() const {
            return state_ == State::ValidWithoutTexture
              || state_ == State::ValidWithTexture;
        }

        constexpr bool hasTexture() const {
            return state_ == State::ValidWithTexture;
        }

        // Use GetRenderCacheKey() instead for almost all purposes
        uint64_t getSequenceNumberForDebuggingOnly() const;
        Snapshot() = delete;

    private:
        std::shared_ptr<FrameMetadata> metadata_;
        std::shared_ptr<IPCClientTexture> ipcTexture_;

        State state_;
    };


    class SHMReader {
    public:

        SHMReader();
        virtual ~SHMReader();

        operator bool() const;
        /// Do not use for caching - use GetRenderCacheKey instead
        uint64_t getFrameCountForMetricsOnly() const;

        /** Fetch the render cache key, and mark the consumer kind as active if
         * enabled.
         *
         *
         * Changes even if the feeder restarts from frame ID 0.
         */
        size_t getRenderCacheKey(ConsumerKind kind) const;

        uint64_t getSessionID() const;

    protected:
        Snapshot maybeGetUncached(ConsumerKind);
        Snapshot maybeGetUncached(
          uint64_t gpuLUID,
          IPCTextureCopier* copier,
          const std::shared_ptr<IPCClientTexture>& dest,
          ConsumerKind) const;

        class Impl;
        std::shared_ptr<Impl> p;
    };

    class SHMCachedReader : public SHMReader {
    public:
        SHMCachedReader() = delete;
        SHMCachedReader(IPCTextureCopier*, ConsumerKind);
        virtual ~SHMCachedReader() = default;

        Snapshot maybeGetMetadata();
        virtual Snapshot maybeGet(
          );//const std::source_location& loc = std::source_location::current()

    protected:
        void initializeCache(uint64_t gpuLUID, uint8_t swapchainLength);

        virtual std::shared_ptr<IPCClientTexture>
        createIPCClientTexture(const PixelSize&, uint8_t swapchainIndex) noexcept = 0;

        virtual void releaseIPCHandles() = 0;

    private:
        IPCTextureCopier* textureCopier_ {nullptr};
        ConsumerKind consumerKind_ {};

        uint64_t gpuluid_ {};
        uint64_t cacheKey_ {~0ui64};
        uint64_t sessionId_ {};
        std::deque<Snapshot> cache_;
        uint8_t swapchainIndex_ {};

        std::vector<std::shared_ptr<IPCClientTexture>> clientTextures_;

        std::shared_ptr<IPCClientTexture> getIPCClientTexture(
          const PixelSize&,
          uint8_t swapchainIndex) noexcept;

        void updateSession();
    };
} // namespace IRacingTools::Shared
