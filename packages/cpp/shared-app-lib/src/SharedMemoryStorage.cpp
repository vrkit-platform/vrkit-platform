//
// Created by jglanz on 1/5/2024.
//




#include <IRacingTools/Models/LapData.pb.h>
#include <IRacingTools/Shared/ProtoHelpers.h>
#include <IRacingTools/Shared/SharedMemoryStorage.h>
#include <IRacingTools/Shared/TrackMapGeometry.h>
#include <IRacingTools/SDK/Utils/LockHelpers.h>
#include <spdlog/spdlog.h>


namespace IRacingTools::Shared {

    enum class LockState {
      Unlocked,
      TryLock,
      Locked,
    };



    class SharedMemoryStorage::Impl : public SDK::Utils::Lockable {

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
          DWORD {SHM_SIZE},// Perfect forwarding fails with static constexpr
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

      mapping_ = reinterpret_cast<std::byte*>(
          MapViewOfFile(fileHandle.get(), FILE_MAP_WRITE, 0, 0, SHM_SIZE));
      if (!mapping_) {
        spdlog::error(
            "MapViewOfFile failed: {:#x}", std::bit_cast<uint32_t>(GetLastError()));
        return;
      }

      fileHandle_ = std::move(fileHandle);
      eventHandle_ = std::move(eventHandle);
      mutexHandle_ = std::move(mutexHandle);
      metadata_ = reinterpret_cast<FrameMetadata*>(mapping_);
    }

    ~Impl() {
      UnmapViewOfFile(mapping_);
//      if (mState.Get() != State::Unlocked) {
//        using namespace OpenKneeboard::ADL;
//        dprintf(
//            "Closing SHM with invalid state: {}", formattable_state(mState.Get()));
//        OPENKNEEBOARD_BREAK;
//        std::terminate();
//      }
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
              "Unexpected result from SHM WaitForSingleObject in try_lock(): {}",
              result);
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


  std::shared_ptr<SharedMemoryStorage> SharedMemoryStorage::GetInstance() {
    static std::shared_ptr<SharedMemoryStorage> gInstance;
    if (!gInstance) {
      gInstance.reset(new SharedMemoryStorage());
    }

    return gInstance;
  }

  bool SharedMemoryStorage::loadTrackMapFromTrajectoryFile(const fs::path &path) {
    auto trackMap = Geometry::LoadTrackMapFromTrajectoryFile(path);
    setTrackMap(trackMap);
    return trackMap.has_value();
  }

  std::optional<TrackMap> SharedMemoryStorage::setTrackMap(const std::optional<TrackMap> &newTrackMap) {
    auto oldTrackMap = trackMap_;
    trackMap_ = newTrackMap;
    return oldTrackMap;
  }

  std::optional<TrackMap> SharedMemoryStorage::trackMap() {
    return trackMap_;
  }

  SharedMemoryStorage::SharedMemoryStorage() : impl_(std::make_unique<SharedMemoryStorage::Impl>()) {

  }


  bool FrameMetadata::haveFeeder() const {
    static constexpr auto FeederAttachedValue = magic_enum::enum_integer(SHMHeaderFlags::FEEDER_ATTACHED);
    return (magic == *reinterpret_cast<const uint64_t*>(Magic.data()))
           && ((magic_enum::enum_integer(flags) &
                FeederAttachedValue) == FeederAttachedValue);
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

}// namespace IRacingTools::Shared
