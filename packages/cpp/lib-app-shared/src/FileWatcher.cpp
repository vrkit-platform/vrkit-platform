#include <IRacingTools/Shared/FileWatcher.h>
#include <windows.h>
#include <format>
#include <mutex>

#include <IRacingTools/SDK/Utils/UnicodeHelpers.h>
#include <IRacingTools/Shared/Macros.h>

namespace IRacingTools::Shared {
    using namespace IRacingTools::SDK::Utils;

    FileSystem::FileWatcher::FileWatcher(std::wstring path, UnderpinningRegex pattern, Callback callback, bool autostart): path_(fs::absolute(path)),
        pattern_(pattern),
        callback_(callback),
        directory_(getDirectoryHandle(path)) {
        if (autostart)
            start();
    }

    FileSystem::FileWatcher::~FileWatcher() {
        stop();
    }

    FileSystem::FileWatcher::FileWatcher(const FileWatcher& other): FileWatcher(other.path_, other.callback_) {}
    FileSystem::FileWatcher& FileSystem::FileWatcher::operator=(const FileWatcher& other) {
        if (this == &other) {
            return *this;
        }

        stop();
        path_ = other.path_;
        callback_ = other.callback_;
        directory_ = getDirectoryHandle(other.path_);
        start();
        return *this;
    }

    void FileSystem::FileWatcher::stop() {
        std::scoped_lock lock(runningMutex_);
        if (!running_)
            return;
        running_ = false;
        runningPromise_ = std::promise<void>();


        SetEvent(closeEvent_);

        cv_.notify_all();
        watchThread_.join();
        callbackThread_.join();

        CloseHandle(directory_);
    }

    bool FileSystem::FileWatcher::isRunning() {
      std::scoped_lock lock(runningMutex_);
      return running_.load();      
    }

    void FileSystem::FileWatcher::start() {
      std::scoped_lock lock(runningMutex_);
      if (running_) {
        spdlog::warn("Watcher already running ({})", path_.string());
        return;
      }

      running_ = true;

      closeEvent_ = CreateEvent(nullptr, TRUE, FALSE, nullptr);
      if (!closeEvent_) {
        running_ = false;
        throw std::system_error(static_cast<int>(GetLastError()), std::system_category());
      }


      callbackThread_ = std::thread([this] {
        try {
          callbackThread();
        } catch (...) {
          try {
            runningPromise_.set_exception(std::current_exception());
          } catch (...) {
          }// set_exception() may throw too
        }
      });

      watchThread_ = std::thread([this] {
        try {
          monitorDirectory();
        } catch (...) {
          try {
            runningPromise_.set_exception(std::current_exception());
          } catch (...) {
          }// set_exception() may throw too
        }
      });

      std::future<void> future = runningPromise_.get_future();
      future.get();//block until the monitor_directory is up and running
    }
}
