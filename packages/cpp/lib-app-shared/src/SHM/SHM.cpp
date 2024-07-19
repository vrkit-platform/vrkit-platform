//
// Created by jglanz on 1/5/2024.
//


#include <IRacingTools/Models/LapTrajectory.pb.h>
#include <IRacingTools/Models/TrackMap.pb.h>
#include <IRacingTools/Shared/ProtoHelpers.h>
#include <IRacingTools/Shared/SHM/SHM.h>
#include <IRacingTools/Shared/TrackMapGeometry.h>
#include <IRacingTools/SDK/Utils/LockHelpers.h>
// #include <IRacingTools/SDK/Utils/tracing.h>
#include <spdlog/spdlog.h>


namespace IRacingTools::Shared::SHM {
    using namespace VR;

    enum class LockState {
        Unlocked,
        TryLock,
        Locked,
    };


    class Impl : public SDK::Utils::Lockable {
    protected:
        winrt::handle fileHandle_;
        winrt::handle eventHandle_;
        winrt::handle mutexHandle_;
        std::byte* mapping_ = nullptr;
        FrameMetadata* metadata_ = nullptr;
        LockState lockState_{LockState::Unlocked};
        friend class SHMReader;
        friend class SHMCachedReader;
        friend class Writer;

    public:
        Impl() {
            auto fileHandle = Win32::CreateFileMappingW(
                INVALID_HANDLE_VALUE,
                nullptr,
                PAGE_READWRITE,
                0,
                DWORD{SHMSize},
                // Perfect forwarding fails with static constexpr
                // integer values
                SHMPath().c_str()
            );

            if (!fileHandle) {
                spdlog::error("CreateFileMappingW failed: {}", static_cast<int>(GetLastError()));
                return;
            }

            auto eventHandle = Win32::CreateEventW(nullptr, false, false, SHMEventPath().c_str());
            if (!eventHandle) {
                spdlog::error("CreateEventW failed: {}", static_cast<int>(GetLastError()));
                return;
            }

            auto mutexHandle = Win32::CreateMutexW(nullptr, FALSE, SHMMutexPath().c_str());
            if (!mutexHandle) {
                spdlog::error("CreateMutexW failed: {}", static_cast<int>(GetLastError()));
                return;
            }

            mapping_ = static_cast<std::byte*>(MapViewOfFile(fileHandle.get(), FILE_MAP_WRITE, 0, 0, SHMSize));
            if (!mapping_) {
                spdlog::error("MapViewOfFile failed: {}", static_cast<int>(GetLastError())); //std::bit_cast<uint32_t>(
                return;
            }

            fileHandle_ = std::move(fileHandle);
            eventHandle_ = std::move(eventHandle);
            mutexHandle_ = std::move(mutexHandle);
            metadata_ = reinterpret_cast<FrameMetadata*>(mapping_);
        }

        virtual ~Impl() {
            UnmapViewOfFile(mapping_);
            //      if (state_.Get() != State::Unlocked) {
            //        using namespace OpenKneeboard::ADL;
            //        dprintf(
            //            "Closing SHM with invalid state: {}", formattable_state(state_.Get()));
            //        VRK_BREAK;
            //        std::terminate();
            //      }
        }

        bool isValid() const {
            return mapping_;
        }


        void lock() override {
            spdlog::trace("SHM::Impl::lock()");
            const auto result = WaitForSingleObject(mutexHandle_.get(), INFINITE);
            switch (result) {
            case WAIT_OBJECT_0:
                // success
                break;
            case WAIT_ABANDONED:
                *metadata_ = {};
                break;
            default:
                spdlog::error(
                    "Unexpected result from SHM WaitForSingleObject in lock(): " "{:#016x}",
                    static_cast<uint64_t>(result)
                );
                VRK_BREAK;
                return;
            }

            lockState_ = LockState::Locked;
        }

        bool try_lock() override {
            spdlog::trace("SHM::Impl::try_lock()");
            const auto result = WaitForSingleObject(mutexHandle_.get(), 0);
            switch (result) {
            case WAIT_OBJECT_0:
                // success
                break;
            case WAIT_ABANDONED:
                *metadata_ = {};
                break;
            case WAIT_TIMEOUT:
                // expected in try_lock()
                lockState_ = LockState::Unlocked;
                return false;
            default:
                spdlog::error("Unexpected result from SHM WaitForSingleObject in try_lock()");
                VRK_BREAK;
                return false;
            }

            lockState_ = LockState::Locked;
            return true;
        }


        void unlock() override {
            spdlog::trace("SHM::Impl::unlock()");
            const auto ret = ReleaseMutex(mutexHandle_.get());
        }
    };



    bool FrameMetadata::haveFeeder() const {
        static constexpr auto FeederAttachedValue = magic_enum::enum_integer(SHMHeaderFlags::FEEDER_ATTACHED);
        return magic == *reinterpret_cast<const uint64_t*>(Magic.data()) && (magic_enum::enum_integer(flags) &
            FeederAttachedValue) == FeederAttachedValue;
    }

    std::wstring SHMPath() {
        static std::wstring sCache;
        if (!sCache.empty()) [[likely]] {
            return sCache;
        }
        sCache = std::format(L"{}/IRT-s{:x}", ProjectReverseDomainW, SHMSize);
        return sCache;
    }

    std::wstring SHMMutexPath() {
        static std::wstring sCache;
        if (sCache.empty()) [[unlikely]] {
            sCache = SHMPath() + L".mutex";
        }
        return sCache;
    }

    std::wstring SHMEventPath() {
        static std::wstring sCache;
        if (sCache.empty()) [[unlikely]] {
            sCache = SHMPath() + L".event";
        }
        return sCache;
    }

    uint64_t CreateSessionID() {
        std::random_device randDevice;
        std::uniform_int_distribution<uint32_t> randDist;
        uint64_t sessionId = static_cast<uint64_t>(GetCurrentProcessId()) << 32;
        sessionId |= randDist(randDevice);
        return sessionId;
    }

    size_t FrameMetadata::getRenderCacheKey() const {
        // This is lazy, and only works because:
        // - session ID already contains random data
        // - we're only combining *one* other value which isn't
        // If adding more data, it either needs to be random,
        // or need something like boost::hash_combine()
        std::hash<uint64_t> HashUI64;
        return HashUI64(sessionId) ^ HashUI64(frameNumber);
    }


    class Writer::Impl : public SHM::Impl {
        friend class Writer;
        DWORD processId_ = GetCurrentProcessId();
        uint64_t gpuLUID_{};

    public:
    };

    Writer::Writer(uint64_t gpuLUID) {
        const auto path = SHMPath();
        // spdlog::info(L"Initializing SHM writer with path {}", path);

        impl_ = std::make_shared<Impl>();
        if (!impl_->isValid()) {
            VRK_BREAK;
            impl_.reset();
            return;
        }

        impl_->gpuLUID_ = gpuLUID;
        *impl_->metadata_ = FrameMetadata{};

        spdlog::info("Writer initialized.");
    }

    void Writer::detach() {
        // impl_->template Transition<State::Locked, State::Detaching>();

        const auto oldID = impl_->metadata_->sessionId;
        *impl_->metadata_ = {};
        FlushViewOfFile(impl_->mapping_, NULL);


        // spdlog::debug(
        //   "Writer::Detach(): Session ID {:#018x} replaced with {:#018x}",
        //   oldID,
        //   impl_->metadata_->sessionId);
    }

    Writer::~Writer() {
        std::unique_lock lock(*this);
        this->detach();
    }

    void Writer::submitEmptyFrame() {
        // const auto transitions = make_scoped_state_transitions<
        //   State::Locked,
        //   State::SubmittingEmptyFrame,
        //   State::Locked>(p);
        impl_->metadata_->frameNumber++;
        impl_->metadata_->layerCount = 0;
    }

    Writer::NextFrameInfo Writer::beginFrame() noexcept {
        // impl_->Transition<State::Locked, State::FrameInProgress>();

        const auto textureIndex = static_cast<uint8_t>((impl_->metadata_->frameNumber + 1) % SHMSwapchainLength);
        auto fenceValue = &impl_->metadata_->frameReadyFenceValues[textureIndex];
        const auto fenceOut = InterlockedIncrement64(fenceValue);

        return NextFrameInfo{.textureIndex = textureIndex, .fenceOut = fenceOut,};
    }

    void Writer::submitFrame(
        const SHMConfig& config,
        const std::vector<LayerConfig>& layers,
        HANDLE texture,
        HANDLE fence
    ) {
        if (!impl_) {
            throw std::logic_error("Attempted to update invalid SHM");
        }


        // if (layers.size() > MaxViewCount) [[unlikely]] {
        //   VRK_LOG_AND_FATAL(
        //     "Asked to publish {} layers, but max is {}", layers.size(), MaxViewCount);
        // }

        impl_->metadata_->gpuLUID = impl_->gpuLUID_;
        impl_->metadata_->config = config;
        impl_->metadata_->frameNumber++;
        impl_->metadata_->flags = static_cast<SHMHeaderFlags>(impl_->metadata_->flags | FEEDER_ATTACHED);
        impl_->metadata_->layerCount = static_cast<uint8_t>(layers.size());
        impl_->metadata_->feederProcessID = impl_->processId_;
        impl_->metadata_->texture = texture;
        impl_->metadata_->fence = fence;
        memcpy(impl_->metadata_->layers, layers.data(), sizeof(LayerConfig) * layers.size());
    }

    void Writer::lock() {
        impl_->lock();
    }

    void Writer::unlock() {
        impl_->unlock();
    }

    bool Writer::try_lock() {
        return impl_->try_lock();
    }


    Snapshot::Snapshot(nullptr_t) : state_(State::Empty) {}

    Snapshot::Snapshot(incorrect_kind_t) : state_(State::IncorrectKind) {}

    Snapshot::Snapshot(incorrect_gpu_t) : state_(State::IncorrectGPU) {}

    Snapshot::Snapshot(FrameMetadata* metadata) : state_(State::Empty) {
        // VRK_TraceLoggingScope("SHM::Snapshot::Snapshot(FrameMetadata)");
        metadata_ = std::make_shared<FrameMetadata>(*metadata);

        if (metadata_ && metadata_->haveFeeder()) {
            state_ = State::ValidWithoutTexture;
        }
    }

    uint64_t Snapshot::getSessionID() const {
        if (!metadata_) {
            return {};
        }

        return metadata_->sessionId;
    }

    Snapshot::Snapshot(
        FrameMetadata* metadata,
        IPCTextureCopier* copier,
        IPCHandles* source,
        const std::shared_ptr<IPCClientTexture>& dest
    )
        : ipcTexture_(dest), state_(State::Empty) {
        // VRK_TraceLoggingScopedActivity(
        //   activity, "SHM::Snapshot::Snapshot(metadataAndTextures)");

        const auto textureIndex = metadata->frameNumber % SHMSwapchainLength;
        auto fenceValue = &metadata->frameReadyFenceValues.at(textureIndex);
        const auto fenceIn = *fenceValue;

        metadata_ = std::make_shared<FrameMetadata>(*metadata);

        {
            // VRK_TraceLoggingScope("CopyTexture");
            copier->copy(source->textureHandle.get(), dest.get(), source->fenceHandle.get(), fenceIn);
        }

        if (metadata_ && metadata_->haveFeeder()) {
            // TraceLoggingWriteTagged(activity, "MarkingValid");
            if (metadata_->layerCount > 0) {
                state_ = State::ValidWithTexture;
            }
            else {
                state_ = State::ValidWithoutTexture;
            }
        }
    }

    Snapshot::State Snapshot::getState() const {
        return state_;
    }

    Snapshot::~Snapshot() {}

    size_t Snapshot::getRenderCacheKey() const {
        // This is lazy, and only works because:
        // - session ID already contains random data
        // - we're only combining *one* other value which isn't
        // If adding more data, it either needs to be random,
        // or need something like boost::hash_combine()
        return metadata_->getRenderCacheKey();
    }

    uint64_t Snapshot::getSequenceNumberForDebuggingOnly() const {
        if (!this->hasMetadata()) {
            return 0;
        }
        return metadata_->frameNumber;
    }

    SHMConfig Snapshot::getConfig() const {
        if (!this->hasMetadata()) {
            return {};
        }
        return metadata_->config;
    }

    uint8_t Snapshot::getLayerCount() const {
        if (!this->hasMetadata()) {
            return 0;
        }
        return metadata_->layerCount;
    }

    const LayerConfig* Snapshot::getLayerConfig(uint8_t layerIndex) const {
        if (layerIndex >= this->getLayerCount()) [[unlikely]] {
            VRK_LOG_AND_FATAL("Asked for layer {}, but there are {} layers", layerIndex, this->getLayerCount());
        }

        return &metadata_->layers[layerIndex];
    }

    class SHMReader::Impl : public SHM::Impl {
    public:
        winrt::handle feederProcessHandle_;
        uint64_t sessionID_{~(0ui64)};

        std::array<std::unique_ptr<IPCHandles>, SHMSwapchainLength> handles_;

        void updateSession() {
            // VRK_TraceLoggingScope("SHM::Reader::Impl::UpdateSession()");
            const auto& metadata = *this->metadata_;

            if (sessionID_ != metadata.sessionId) {
                feederProcessHandle_ = {};
                handles_ = {};
                sessionID_ = metadata.sessionId;
            }

            if (feederProcessHandle_) {
                return;
            }

            feederProcessHandle_ = winrt::handle{OpenProcess(PROCESS_DUP_HANDLE, FALSE, metadata.feederProcessID)};
        }

    private:
        // Only valid in the feeder process, but keep track of them to see if they
        // change
        HANDLE foreignTextureHandle_{};
        HANDLE foreignFenceHandle_{};
    };


    SHMReader::SHMReader() {
        // VRK_TraceLoggingScope("SHM::Reader::Reader()");
        const auto path = SHMPath();
        //spdlog::info(L"Initializing SHM reader with path {}", path);

        this->p = std::make_shared<Impl>();
        if (!p->isValid()) {
            p.reset();
            return;
        }
        spdlog::info("Reader initialized.");
    }

    SHMReader::~SHMReader() {
        //VRK_TraceLoggingScope("SHM::Reader::~Reader()");
    }


    uint64_t SHMReader::getFrameCountForMetricsOnly() const {
        if (!(p && p->metadata_)) {
            return {};
        }
        return p->metadata_->frameNumber;
    }


    uint64_t SHMReader::getSessionID() const {
        if (!p) {
            return {};
        }
        if (!p->metadata_) {
            return {};
        }
        return p->metadata_->sessionId;
    }

    SHMReader::operator bool() const {
        return p && p->isValid() & p->metadata_->haveFeeder();
    }

    Writer::operator bool() const {
        return impl_.get();
    }

    SHMCachedReader::SHMCachedReader(IPCTextureCopier* copier, ConsumerKind kind)
      : textureCopier_(copier), consumerKind_(kind) {
    }

    Snapshot SHMReader::maybeGetUncached(ConsumerKind kind) {
        return maybeGetUncached({}, nullptr, nullptr, kind);
    }

    Snapshot SHMReader::maybeGetUncached(
      uint64_t gpuLUID,
      IPCTextureCopier* copier,
      const std::shared_ptr<IPCClientTexture>& dest,
      ConsumerKind kind) const {
        // VRK_TraceLoggingScopedActivity(
        //   activity, "SHM::Reader::MaybeGetUncached()");
        // const auto transitions = make_scoped_state_transitions<
        //   State::Locked,
        //   State::CreatingSnapshot,
        //   State::Locked>(p);

        // if (!p->metadata_->config.target.Matches(kind)) {
        //     // TraceLoggingWriteTagged(
        //     //   activity,
        //     //   "SHM::Reader::MaybeGetUncached/incorrect_kind",
        //     //   TraceLoggingValue(
        //     //     static_cast<std::underlying_type_t<ConsumerKind>>(kind),
        //     //     "Consumer kind"),
        //     //   TraceLoggingValue(
        //     //     p->mHeader->mConfig.mTarget.GetRawMaskForDebugging(), "Target kind"));
        //     // activity.StopWithResult("incorrect_kind");
        //     return {Snapshot::incorrect_kind};
        // }

        p->updateSession();

        if (!(gpuLUID && copier && dest)) {
            return Snapshot(p->metadata_);
        }

        if (p->metadata_->gpuLUID != gpuLUID) {
            // TraceLoggingWriteTagged(
            //   activity,
            //   "SHM::Reader::MaybeGetUncached/incorrect_gpu",
            //   TraceLoggingValue(p->mHeader->mGPULUID, "FeederLUID"),
            //   TraceLoggingValue(gpuLUID, "ReaderLUID"));
            // activity.StopWithResult("incorrect_gpu");
            return {Snapshot::incorrect_gpu};
        }

        auto& handles = p->handles_.at(p->metadata_->frameNumber % SHMSwapchainLength);
        if (handles && (
          (handles->foreignFenceHandle != p->metadata_->fence)
        ||
          (handles->foreignTextureHandle != p->metadata_->texture) )) {
            // Impl::UpdateSession() should have nuked the whole lot
            spdlog::info("Replacing handles without new session ID");
            VRK_BREAK;
            handles = {};
          }
        if (!handles) {
            handles = std::make_unique<IPCHandles>(
              p->feederProcessHandle_.get(), *p->metadata_);
        }

        return Snapshot(p->metadata_, copier, handles.get(), dest);
    }

    size_t SHMReader::getRenderCacheKey(ConsumerKind kind) const {
        if (!(p && p->metadata_)) {
            return {};
        }

        // if (p->metadata_->config.target.Matches(kind)) {
        //     ActiveConsumers::Set(kind);
        // }

        return p->metadata_->getRenderCacheKey();
    }

    //const std::source_location& loc
Snapshot SHMCachedReader::maybeGet() {
  // TraceLoggingThreadActivity<gTraceProvider> activity;
  // TraceLoggingWriteStart(activity, "SHMCachedReader::MaybeGet()");
  if (!(*this)) {
    // TraceLoggingWriteStop(
    //   activity,
    //   "SHMCachedReader::MaybeGet()",
    //   TraceLoggingValue("Invalid SHM", "Result"));
    return {nullptr};
  }

  this->updateSession();

  //ActiveConsumers::Set(consumerKind_);

  const auto swapchainIndex = swapchainIndex_;
  if (swapchainIndex >= clientTextures_.size()) [[unlikely]] {
      VRK_LOG_AND_FATAL("swapchainIndex > lnegth - initializeCache?");
      // VRK_LOG_SOURCE_LOCATION_AND_FATAL(
    //   loc,
    //   "swapchainIndex {} >= swapchainLength {}; did you call "
    //   "InitializeCache()?",
    //   swapchainIndex,
    //   clientTextures_.size());
  }
  swapchainIndex_ = (swapchainIndex_ + 1) % clientTextures_.size();

  const auto cacheKey = this->getRenderCacheKey(consumerKind_);

  if (cacheKey == cacheKey_) {
    const auto& cache = cache_.front();
    if (cache.getState() == Snapshot::State::ValidWithTexture) {
      // TraceLoggingWriteStop(
      //   activity,
      //   "SHMCachedReader::MaybeGet()",
      //   TraceLoggingValue("Returning cached snapshot", "Result"),
      //   TraceLoggingValue(
      //     static_cast<unsigned int>(cache.getState()), "State"));
      return cache;
    }
  }

  // TraceLoggingWriteTagged(activity, "LockingSHM");
  std::unique_lock lock(*p);
  // TraceLoggingWriteTagged(activity, "LockedSHM");
  // VRK_TraceLoggingScopedActivity(
  //   maybeGetActivity, "MaybeGetUncached");

  if (p->metadata_->layerCount == 0) {
    // maybeGetActivity.StopWithResult("NoLayers");
    return Snapshot {p->metadata_};
  }

  const auto dimensions = p->metadata_->config.textureSize;
  auto dest = getIPCClientTexture(dimensions, swapchainIndex);

  auto snapshot
    = this->maybeGetUncached(gpuluid_, textureCopier_, dest, consumerKind_);
  const auto state = snapshot.getState();
  // maybeGetActivity.StopWithResult(static_cast<int>(state));

  if (state == Snapshot::State::Empty) {
    const auto& cache = cache_.front();
    // TraceLoggingWriteStop(
    //   activity,
    //   "SHMCachedReader::MaybeGet()",
    //   TraceLoggingValue("Using stale cache", "Result"),
    //   TraceLoggingValue(static_cast<unsigned int>(cache.getState()), "State"));
    return cache;
  }

  cache_.push_front(snapshot);
  cache_.resize(clientTextures_.size(), nullptr);
  cacheKey_ = cacheKey;

  // TraceLoggingWriteStop(
  //   activity,
  //   "SHMCachedReader::MaybeGet()",
  //   TraceLoggingValue("Updated cache", "Result"),
  //   TraceLoggingValue(static_cast<unsigned int>(state), "State"),
  //   TraceLoggingValue(
  //     snapshot.getSequenceNumberForDebuggingOnly(), "SequenceNumber"));
  return snapshot;
}

std::shared_ptr<IPCClientTexture> SHMCachedReader::getIPCClientTexture(
  const PixelSize& dimensions,
  uint8_t swapchainIndex) noexcept {
  // VRK_TraceLoggingScope(
  //   "SHMCachedReader::GetIPCClientTexture",
  //   TraceLoggingValue(swapchainIndex, "swapchainIndex"));
  auto& ret = clientTextures_.at(swapchainIndex);
  if (ret && ret->getDimensions() != dimensions) {
    ret = {};
  }

  if (!ret) {
    // VRK_TraceLoggingScope("SHMCachedReader::CreateIPCClientTexture");
    ret = this->createIPCClientTexture(dimensions, swapchainIndex);
  }
  return ret;
}

Snapshot SHMCachedReader::maybeGetMetadata() {
  // VRK_TraceLoggingScope("SHMCachedReader::MaybeGetMetadata()");

  if (!*this) {
    return {nullptr};
  }

  this->updateSession();

  const auto cacheKey = this->getRenderCacheKey(consumerKind_);

  if ((!cache_.empty()) && cacheKey == cacheKey_) {
    return cache_.front();
  }

  if (!clientTextures_.empty()) {
    return maybeGet();
  }

  std::unique_lock lock(*p);
  auto snapshot = this->maybeGetUncached(consumerKind_);
  if (snapshot.hasMetadata()) {
    cache_.push_front(snapshot);
    cacheKey_ = cacheKey;
  }

  return snapshot;
}

void SHMCachedReader::updateSession() {
  const auto sessionID = this->getSessionID();
  if (sessionID == sessionId_) {
    return;
  }
  this->releaseIPCHandles();
  p->updateSession();
  sessionId_ = sessionID;
}

    void SHMCachedReader::initializeCache(uint64_t gpuLUID, uint8_t swapchainLength) {
        // VRK_TraceLoggingScope(
        //   "SHM::CachedReader::InitializeCache()",
        //   TraceLoggingValue(swapchainLength, "SwapchainLength"));
        gpuluid_ = gpuLUID;
        cache_ = {};
        cacheKey_ = {};
        clientTextures_ = {swapchainLength, nullptr};
    }


    IPCClientTexture::IPCClientTexture(const PixelSize& dimensions, uint8_t swapchainIndex)
        : dimensions_(dimensions), swapchainIndex_(swapchainIndex) {}

    IPCClientTexture::~IPCClientTexture() = default;
    IPCTextureCopier::~IPCTextureCopier() = default;
} // namespace IRacingTools::Shared
