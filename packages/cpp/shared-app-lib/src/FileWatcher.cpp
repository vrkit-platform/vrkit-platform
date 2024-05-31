#include <IRacingTools/Shared/FileWatcher.h>
#include <windows.h>
#include <format>
#include <mutex>

#include <IRacingTools/SDK/Utils/UnicodeHelpers.h>
#include <IRacingTools/Shared/Macros.h>

namespace IRacingTools::Shared {
    using namespace IRacingTools::SDK::Utils;

    FileSystem::FileWatcher::FileWatcher(std::wstring path, UnderpinningRegex pattern, Callback callback): path_(fs::absolute(path)),
        pattern_(pattern),
        callback_(callback),
        directory_(getDirectoryHandle(path)) {
        init();
    }

    FileSystem::FileWatcher::~FileWatcher() {
        destroy();
    }

    FileSystem::FileWatcher::FileWatcher(const FileWatcher& other): FileWatcher(other.path_, other.callback_) {}
    FileSystem::FileWatcher& FileSystem::FileWatcher::operator=(const FileWatcher& other) {
        if (this == &other) {
            return *this;
        }

        destroy();
        path_ = other.path_;
        callback_ = other.callback_;
        directory_ = getDirectoryHandle(other.path_);
        init();
        return *this;
    }

    void FileSystem::FileWatcher::destroy() {
        std::scoped_lock lock(destroyMutex_);
        if (destroy_)
            return;
        destroy_ = true;
        running_ = std::promise<void>();


        SetEvent(closeEvent_);

        cv_.notify_all();
        watchThread_.join();
        callbackThread_.join();

        CloseHandle(directory_);
    }

    void FileSystem::FileWatcher::init() {
        closeEvent_ = CreateEvent(nullptr, TRUE, FALSE, nullptr);
        if (!closeEvent_) {
            throw std::system_error(static_cast<int>(GetLastError()), std::system_category());
        }


        callbackThread_ = std::thread(
            [this] {
                try {
                    callbackThread();
                } catch (...) {
                    try {
                        running_.set_exception(std::current_exception());
                    } catch (...) {} // set_exception() may throw too
                }
            }
        );

        watchThread_ = std::thread(
            [this] {
                try {
                    monitorDirectory();
                } catch (...) {
                    try {
                        running_.set_exception(std::current_exception());
                    } catch (...) {} // set_exception() may throw too
                }
            }
        );

        std::future<void> future = running_.get_future();
        future.get(); //block until the monitor_directory is up and running
    }
}
