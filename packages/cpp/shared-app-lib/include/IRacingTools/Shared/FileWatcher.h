#pragma once
#include <IRacingTools/Shared/SharedAppLibPCH.h>
#include <IRacingTools/SDK/Utils/FileHelpers.h>

#include <functional>
#include <future>
#include <magic_enum.hpp>
#include <mutex>
#include <regex>
#include <string>
#include <thread>
#include <IRacingTools/SDK/Utils/UnicodeHelpers.h>


namespace IRacingTools::Shared::FileSystem {
    namespace fs = std::filesystem;

    enum class WatchEvent {
        Added,
        Removed,
        Modified,
        RenamedOld,
        RenamedNew
    };

    template <typename StringType>
    struct IsWChar {
        static constexpr auto value = false;
    };

    template <>
    struct IsWChar<wchar_t> {
        static constexpr auto value = true;
    };

    [[maybe_unused]] static std::string_view WatchEventToString(WatchEvent event) {
        return magic_enum::enum_name<WatchEvent>(event);
    }

    static bool IsParentOrSelfDirectory(const std::wstring& path) {
        return path == L"." || path == L"..";
    }

    /**
    * \class FileWatcher
    *
    * \brief Watches a folder or file, and will notify of changes via function callback.
    *
    * \author Thomas Monkman
    *
    */

    class FileWatcher {
        typedef std::wstring::value_type C;
        typedef std::basic_string<C> UnderpinningString;
        typedef std::basic_regex<C> UnderpinningRegex;

        public:
            struct WatchEventData {
                fs::path path;
                std::wstring pathString;
            };

            using Callback = std::function<void(const WatchEventData& file, WatchEvent event_type)>;


            FileWatcher(std::wstring path, UnderpinningRegex pattern, Callback callback);

            FileWatcher(std::wstring path, Callback callback) : FileWatcher(
                path,
                UnderpinningRegex(sRegexAll_),
                callback
            ) {}

            ~FileWatcher();

            FileWatcher(const FileWatcher& other);

            FileWatcher& operator=(const FileWatcher& other);

            // Const memeber varibles don't let me implent moves nicely, if moves are really wanted std::unique_ptr should be used and move that.
            FileWatcher(FileWatcher&&) = delete;
            FileWatcher& operator=(FileWatcher&&) & = delete;

            void destroy();

        private:
            static constexpr C sRegexAll_[] = {'.', '*', '\0'};
            static constexpr C sThisDirectory_[] = {'.', '/', '\0'};

            struct PathParts {
                PathParts(std::wstring directory, std::wstring filename) : directory(directory), filename(filename) {}
                std::wstring directory{};
                std::wstring filename{};
            };

            fs::path path_;

            UnderpinningRegex pattern_;

            static constexpr std::size_t sBufferSize_ = {1024 * 256};

            // only used if watch a single file
            std::wstring filename_;

            Callback callback_;

            std::thread watchThread_;

            std::condition_variable cv_{};
            std::mutex callbackMutex_{};
            std::mutex destroyMutex_{};

            std::vector<std::pair<WatchEventData, WatchEvent>> callbackInformation_;
            std::thread callbackThread_;

            std::promise<void> running_{};
            std::atomic_bool destroy_{false};
            bool watchingSingleFile_{false};

            HANDLE directory_{nullptr};
            HANDLE closeEvent_{nullptr};

            const DWORD listenFilters_ = FILE_NOTIFY_CHANGE_SECURITY | FILE_NOTIFY_CHANGE_CREATION |
                FILE_NOTIFY_CHANGE_LAST_ACCESS | FILE_NOTIFY_CHANGE_LAST_WRITE | FILE_NOTIFY_CHANGE_SIZE |
                FILE_NOTIFY_CHANGE_ATTRIBUTES | FILE_NOTIFY_CHANGE_DIR_NAME | FILE_NOTIFY_CHANGE_FILE_NAME;

            const std::unordered_map<DWORD, WatchEvent> eventTypeMapping_ = {
                {FILE_ACTION_ADDED, WatchEvent::Added},
                {FILE_ACTION_REMOVED, WatchEvent::Removed},
                {FILE_ACTION_MODIFIED, WatchEvent::Modified},
                {FILE_ACTION_RENAMED_OLD_NAME, WatchEvent::RenamedOld},
                {FILE_ACTION_RENAMED_NEW_NAME, WatchEvent::RenamedNew}
            };

            void init();


            bool passFilter(const UnderpinningString& filePath) {
                return std::regex_match(filePath, pattern_);
            }

            template <typename... Args>
            DWORD getFileAttributesX(const char* lpFileName, Args... args) {
                return GetFileAttributesA(lpFileName, args...);
            }

            template <typename... Args>
            DWORD getFileAttributesX(const wchar_t* lpFileName, Args... args) {
                return GetFileAttributesW(lpFileName, args...);
            }

            template <typename... Args>
            HANDLE createFileX(const char* lpFileName, Args... args) {
                return CreateFileA(lpFileName, args...);
            }

            template <typename... Args>
            HANDLE createFileX(const wchar_t* lpFileName, Args... args) {
                return CreateFileW(lpFileName, args...);
            }

            HANDLE getDirectoryHandle(const std::wstring& path) {
                auto file_info = getFileAttributesX(path.c_str());

                if (file_info == INVALID_FILE_ATTRIBUTES) {
                    throw std::system_error(static_cast<int>(GetLastError()), std::system_category());
                }
                watchingSingleFile_ = (file_info & FILE_ATTRIBUTE_DIRECTORY) == false;

                //const std::wstring watchPath = path;

                HANDLE directory = createFileX(
                    path.c_str(),
                    // pointer to the file name
                    FILE_LIST_DIRECTORY,
                    // access (read/write) mode
                    FILE_SHARE_READ | FILE_SHARE_WRITE | FILE_SHARE_DELETE,
                    // share mode
                    nullptr,
                    // security descriptor
                    OPEN_EXISTING,
                    // how to create
                    FILE_FLAG_BACKUP_SEMANTICS | FILE_FLAG_OVERLAPPED,
                    // file attributes
                    static_cast<HANDLE>(nullptr)
                ); // file with attributes to copy

                if (directory == INVALID_HANDLE_VALUE) {
                    throw std::system_error(static_cast<int>(GetLastError()), std::system_category());
                }
                return directory;
            }

            // void convertWString(const std::wstring& wstr, std::string& out) {
            //     int size_needed = WideCharToMultiByte(
            //         CP_UTF8,
            //         0,
            //         &wstr[0],
            //         static_cast<int>(wstr.size()),
            //         nullptr,
            //         0,
            //         nullptr,
            //         nullptr
            //     );
            //     out.resize(size_needed, '\0');
            //     WideCharToMultiByte(
            //         CP_UTF8,
            //         0,
            //         &wstr[0],
            //         static_cast<int>(wstr.size()),
            //         &out[0],
            //         size_needed,
            //         nullptr,
            //         nullptr
            //     );
            // }
            //
            // void convertWString(const std::wstring& wstr, std::wstring& out) {
            //     out = wstr;
            // }

            void monitorDirectory() {
                std::vector<BYTE> buffer(sBufferSize_);
                DWORD bytesReturned = 0;
                OVERLAPPED overlappedBuffer{0};

                overlappedBuffer.hEvent = CreateEvent(nullptr, TRUE, FALSE, nullptr);
                if (!overlappedBuffer.hEvent) {
                    std::cerr << "Error creating monitor event" << std::endl;
                }

                std::array handles{overlappedBuffer.hEvent, closeEvent_};

                bool asyncPending;
                running_.set_value();
                do {
                    std::vector<std::pair<WatchEventData, WatchEvent>> parsedInfo;
                    ReadDirectoryChangesW(
                        directory_,
                        buffer.data(),
                        static_cast<DWORD>(buffer.size()),
                        TRUE,
                        listenFilters_,
                        &bytesReturned,
                        &overlappedBuffer,
                        nullptr
                    );

                    asyncPending = true;

                    switch (WaitForMultipleObjects(2, handles.data(), FALSE, INFINITE)) {
                    case WAIT_OBJECT_0: {
                        if (!GetOverlappedResult(directory_, &overlappedBuffer, &bytesReturned, TRUE)) {
                            throw std::system_error(static_cast<int>(GetLastError()), std::system_category());
                        }
                        asyncPending = false;

                        if (bytesReturned == 0) {
                            break;
                        }

                        auto fileInfo = reinterpret_cast<FILE_NOTIFY_INFORMATION*>(&buffer[0]);
                        do {
                            std::wstring changedFile{
                                fileInfo->FileName,
                                fileInfo->FileNameLength / sizeof(fileInfo->FileName[0])
                            };

                            if (passFilter(changedFile)) {
                                auto changedPath = path_ / changedFile;
                                parsedInfo.emplace_back(
                                    WatchEventData{
                                        .path = changedPath,
                                        .pathString = std::wstring(changedPath.c_str())
                                    },
                                    eventTypeMapping_.at(fileInfo->Action)
                                );
                            }

                            if (fileInfo->NextEntryOffset == 0) {
                                break;
                            }

                            fileInfo = reinterpret_cast<FILE_NOTIFY_INFORMATION*>(reinterpret_cast<BYTE*>(fileInfo) +
                                fileInfo->NextEntryOffset);
                        } while (true);
                        break;
                    }
                    case WAIT_OBJECT_0 + 1:
                    case WAIT_FAILED:
                        break;
                    }
                    //dispatch callbacks
                    {
                        std::scoped_lock lock(callbackMutex_);
                        callbackInformation_.insert(callbackInformation_.end(), parsedInfo.begin(), parsedInfo.end());
                    }
                    cv_.notify_all();
                } while (destroy_ == false);

                if (asyncPending) {
                    //clean up running async io
                    CancelIo(directory_);
                    GetOverlappedResult(directory_, &overlappedBuffer, &bytesReturned, TRUE);
                }
            }


            void callbackThread() {
                while (destroy_ == false) {
                    std::unique_lock lock(callbackMutex_);
                    if (callbackInformation_.empty() && destroy_ == false) {
                        cv_.wait(
                            lock,
                            [this] {
                                return !callbackInformation_.empty() || destroy_;
                            }
                        );
                    }
                    decltype(callbackInformation_) callbackInfo = {};
                    std::swap(callbackInfo, callbackInformation_);
                    lock.unlock();

                    for (const auto& file : callbackInfo) {
                        if (callback_) {
                            try {
                                callback_(file.first, file.second);
                            } catch (const std::exception&) {}
                        }
                    }
                }
            }
    };
}
