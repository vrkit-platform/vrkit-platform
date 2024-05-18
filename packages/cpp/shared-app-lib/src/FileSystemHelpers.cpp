#include <IRacingTools/Shared/FileSystemHelpers.h>
#include <windows.h>
#include <format>
#include <mutex>

#include <IRacingTools/SDK/Utils/UnicodeHelpers.h>
#include <IRacingTools/Shared/Macros.h>

namespace IRacingTools::Shared {
    using namespace IRacingTools::SDK::Utils;

    namespace {

        std::filesystem::path GetKnownFolderPath(const KNOWNFOLDERID& folderId) {
            static std::mutex sMutex{};
            static std::map<KNOWNFOLDERID, std::filesystem::path> sPaths{};

            std::scoped_lock lock(sMutex);
            if (!sPaths.contains(folderId)) {
                PWSTR tempPath;
                check_hresult(SHGetKnownFolderPath(folderId, KF_FLAG_DEFAULT, nullptr, &tempPath));

                std::filesystem::path path{ToUtf8(std::wstring(tempPath))};
                sPaths[folderId] = path;

                CoTaskMemFree(tempPath);
            }

            return sPaths[folderId];
        }

        fs::path CreateDirIfNeeded(const fs::path& path, const std::optional<fs::path>& childPath = std::nullopt) {
            static std::mutex sMutex{};
            std::scoped_lock lock(sMutex);

            fs::path finalPath = path;
            if (childPath.has_value())
                finalPath /= childPath.value();

            auto exists = fs::exists(finalPath);
            if (exists && !fs::is_directory(finalPath))
                IRT_LOG_AND_FATAL("Path ({}) is not a directory, but exists", finalPath.string());

            if (!fs::exists(finalPath)) {
                std::error_code errorCode;
                if (!fs::create_directories(finalPath, errorCode)) {
                    IRT_LOG_AND_FATAL("Failed to create directory @ {}: ({}) {}", finalPath.string(), errorCode.value(),errorCode.message());
                }
            }

            return finalPath;

        }

        fs::path GetLocalAppDataPath() {
            return GetKnownFolderPath(FOLDERID_LocalAppData);
        }

        fs::path GetDocumentsPath() {
            return GetKnownFolderPath(FOLDERID_Documents);
        }


        std::filesystem::path GetTemporaryDirectoryRoot() {
            wchar_t tempDirBuf[MAX_PATH];
            auto tempDirLen = GetTempPathW(MAX_PATH, tempDirBuf);
            return std::filesystem::path{std::wstring_view{tempDirBuf, tempDirLen}} / L"IRacingTools";
        }
    }

    std::filesystem::path GetTemporaryDirectory() {
        static std::filesystem::path gCachePath;
        static std::mutex gCachePathMutex;
        thread_local std::filesystem::path gThreadCachePath;
        if (!gThreadCachePath.empty()) {
            return gThreadCachePath;
        }
        std::unique_lock lock(gCachePathMutex);
        if (!gCachePath.empty()) {
            gThreadCachePath = gCachePath;
            return gCachePath;
        }

        wchar_t tempDirBuf[MAX_PATH];
        GetTempPathW(MAX_PATH, tempDirBuf);
        auto tempDir = GetTemporaryDirectoryRoot() / std::format(
            "{:%F %H-%M-%S} {}",
            std::chrono::floor<std::chrono::seconds>(std::chrono::system_clock::now()),
            GetCurrentProcessId()
        );

        if (!std::filesystem::exists(tempDir)) {
            std::filesystem::create_directories(tempDir);
        }

        gCachePath = std::filesystem::canonical(tempDir);
        gThreadCachePath = gCachePath;

        return gCachePath;
    }

    void CleanupTemporaryDirectories() {
        const auto root = GetTemporaryDirectoryRoot();
        if (!std::filesystem::exists(root)) {
            return;
        }

        std::error_code ignored;
        for (const auto& it : std::filesystem::directory_iterator(root)) {
            std::filesystem::remove_all(it.path(), ignored);
        }
    }

    std::vector<BYTE> ReadFile(const fs::path& path) {
        size_t size;
        if (!exists(path) || (size = file_size(path)) == 0) {
            return {};
        }

        std::vector<BYTE> data(size);
        auto buf = data.data();
        auto pathStr = ToUtf8(path);
        auto file = std::fopen(pathStr.c_str(), "rb");
        {
            size_t readTotal = 0;

            while (readTotal < size) {
                size_t read = std::fread(buf + readTotal, 1, size - readTotal, file);
                if (!read) {
                    break;
                }
                readTotal += read;
            }

            AssertMsg(readTotal == size, "Did not read correct number of bytes");
        }

        std::fclose(file);
        return data;
    }

    std::filesystem::path GetRuntimeDirectory() {
        static std::filesystem::path sCache;
        if (!sCache.empty()) {
            return sCache;
        }

        wchar_t exePathStr[MAX_PATH];
        const auto exePathStrLen = GetModuleFileNameW(nullptr, exePathStr, MAX_PATH);

        const std::filesystem::path exePath = std::filesystem::canonical(std::wstring_view{exePathStr, exePathStrLen});

        sCache = exePath.parent_path();
        return sCache;
    }

    fs::path GetInstallationDirectory() {
        return GetRuntimeDirectory();
    }

    fs::path GetAppDataPath(std::optional<fs::path> childPath) {
        return CreateDirIfNeeded(GetLocalAppDataPath() / APP_NAME, childPath);
    }

    fs::path GetUserDataPath(std::optional<fs::path> childPath) {
        return CreateDirIfNeeded(GetDocumentsPath() / APP_NAME, childPath);
    }

    namespace Files {
        const std::filesystem::path OPENXR_JSON{"openxr-api-layer.json"};
    }
}
