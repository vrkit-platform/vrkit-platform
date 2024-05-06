//
// Created by jglanz on 1/5/2024.
//




#include <IRacingTools/Models/LapData.pb.h>
#include <IRacingTools/Shared/ProtoHelpers.h>
#include <IRacingTools/Shared/SHM.h>
#include <IRacingTools/Shared/TrackMapGeometry.h>
#include <IRacingTools/SDK/Utils/LockHelpers.h>
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

  public:
    Impl() {
      auto fileHandle = Win32::CreateFileMappingW(
          INVALID_HANDLE_VALUE,
          nullptr,
          PAGE_READWRITE,
          0,
          DWORD {SHMSize},// Perfect forwarding fails with static constexpr
                          // integer values
          SHMPath().c_str());

      if (!fileHandle) {
        spdlog::error(
            "CreateFileMappingW failed: {}", static_cast<int>(GetLastError()));
        return;
      }

      auto eventHandle = Win32::CreateEventW(nullptr,false,false, SHMEventPath().c_str());
      if (!eventHandle) {
        spdlog::error("CreateEventW failed: {}", static_cast<int>(GetLastError()));
        return;
      }

      auto mutexHandle = Win32::CreateMutexW(nullptr, FALSE, SHMMutexPath().c_str());
      if (!mutexHandle) {
        spdlog::error("CreateMutexW failed: {}", static_cast<int>(GetLastError()));
        return;
      }

      mapping_ = static_cast<std::byte*>(
          MapViewOfFile(fileHandle.get(), FILE_MAP_WRITE, 0, 0, SHMSize));
      if (!mapping_) {
        spdlog::error(
            "MapViewOfFile failed: {}", static_cast<int>(GetLastError()));//std::bit_cast<uint32_t>(
        return;
      }

      fileHandle_ = std::move(fileHandle);
      eventHandle_ = std::move(eventHandle);
      mutexHandle_ = std::move(mutexHandle);
      metadata_ = reinterpret_cast<FrameMetadata*>(mapping_);
    }

    virtual ~Impl() {
      UnmapViewOfFile(mapping_);
//      if (mState.Get() != State::Unlocked) {
//        using namespace OpenKneeboard::ADL;
//        dprintf(
//            "Closing SHM with invalid state: {}", formattable_state(mState.Get()));
//        OPENKNEEBOARD_BREAK;
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
              "Unexpected result from SHM WaitForSingleObject in lock(): "
              "{:#016x}",
              static_cast<uint64_t>(result));
          IRT_BREAK;
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
          spdlog::error(
              "Unexpected result from SHM WaitForSingleObject in try_lock()"
              );
          IRT_BREAK;
          return false;
      }

      lockState_ = LockState::Locked;
      return true;
    }


    void unlock() override{
      spdlog::trace("SHM::Impl::unlock()");
      const auto ret = ReleaseMutex(mutexHandle_.get());
    }
  };


  // std::shared_ptr<SHM> SHM::GetInstance() {
  //   static std::shared_ptr<SHM> gInstance;
  //   if (!gInstance) {
  //     gInstance.reset(new SHM());
  //   }
  //
  //   return gInstance;
  // }

  // SHM::SHM() : impl_(std::make_unique<Impl>()) {
  //
  // }


  bool FrameMetadata::haveFeeder() const {
    static constexpr auto FeederAttachedValue = magic_enum::enum_integer(SHMHeaderFlags::FEEDER_ATTACHED);
    return magic == *reinterpret_cast<const uint64_t*>(Magic.data())
           && (magic_enum::enum_integer(flags) &
             FeederAttachedValue) == FeederAttachedValue;
  }

  std::wstring SHMPath() {
    static std::wstring sCache;
    if (!sCache.empty()) [[likely]] {
      return sCache;
    }
    sCache = std::format(
      L"{}/IRT-s{:x}",
      ProjectReverseDomainW,
      SHMSize);
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
    uint64_t gpuLUID_ {};

    public:

  };

  Writer::Writer(uint64_t gpuLUID) {
    const auto path = SHMPath();
    // spdlog::info(L"Initializing SHM writer with path {}", path);

    impl_ = std::make_shared<Impl>();
    if (!impl_->isValid()) {
      IRT_BREAK;
      impl_.reset();
      return;
    }

    impl_->gpuLUID_ = gpuLUID;
    *impl_->metadata_ = FrameMetadata {};

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

    const auto textureIndex
      = static_cast<uint8_t>((impl_->metadata_->frameNumber + 1) % SHMSwapchainLength);
    auto fenceValue = &impl_->metadata_->frameReadyFenceValues[textureIndex];
    const auto fenceOut = InterlockedIncrement64(fenceValue);

    return NextFrameInfo {
      .textureIndex = textureIndex,
      .fenceOut = fenceOut,
    };
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
    //   OPENKNEEBOARD_LOG_AND_FATAL(
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
    memcpy(
      impl_->metadata_->layers, layers.data(), sizeof(LayerConfig) * layers.size());
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



}// namespace IRacingTools::Shared
