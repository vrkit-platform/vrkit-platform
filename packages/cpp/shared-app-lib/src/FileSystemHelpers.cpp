#include <IRacingTools/Shared/FileSystemHelpers.h>
#include <windows.h>
#include <format>
#include <mutex>

#include <IRacingTools/SDK/Utils/UnicodeHelpers.h>
#include <IRacingTools/Shared/Macros.h>

namespace IRacingTools::Shared {
    using namespace IRacingTools::SDK::Utils;

    namespace {

        fs::path GetLocalAppDataPath() {
            return GetKnownFolderPath(FOLDERID_LocalAppData);
        }

        fs::path GetDocumentsPath() {
            return GetKnownFolderPath(FOLDERID_Documents);
        }



    }

    fs::path GetTemporaryDirectoryRootA() {
        char tempDirBuf[MAX_PATH];
        auto tempDirLen = GetTempPathA(MAX_PATH, tempDirBuf);
        return fs::path{std::string_view{tempDirBuf, tempDirLen}} / TemporaryDirectoryNameA;
    }

    fs::path GetTemporaryDirectoryRoot() {
        wchar_t tempDirBuf[MAX_PATH];
        auto tempDirLen = GetTempPathW(MAX_PATH, tempDirBuf);
        return fs::path{std::wstring_view{tempDirBuf, tempDirLen}} / TemporaryDirectoryNameW;
    }

    fs::path GetKnownFolderPath(const KNOWNFOLDERID& folderId) {
        // std::scoped_lock lock(sMutex);
        // if (!sPaths.contains(folderId)) {
        PWSTR tempPath;
        check_hresult(SHGetKnownFolderPath(folderId, KF_FLAG_DEFAULT, nullptr, &tempPath));

        fs::path path{ToUtf8(std::wstring(tempPath))};

        CoTaskMemFree(tempPath);
        return path;
    }

    fs::path CreateDirectories(const fs::path& path, const std::optional<fs::path>& childPath) {
        static std::mutex sMutex{};
        std::scoped_lock lock(sMutex);

        fs::path finalPath = path;
        if (childPath.has_value())
            finalPath /= childPath.value();

        auto exists = fs::exists(finalPath);
        if (exists && !fs::is_directory(finalPath)) IRT_LOG_AND_FATAL(
            "Path ({}) is not a directory, but exists",
            finalPath.string()
        );

        if (!fs::exists(finalPath)) {
            std::error_code errorCode;
            if (!fs::create_directories(finalPath, errorCode)) {
                IRT_LOG_AND_FATAL(
                    "Failed to create directory @ {}: ({}) {}",
                    finalPath.string(),
                    errorCode.value(),
                    errorCode.message()
                );
            }
        }

        return finalPath;
    }

    fs::path GetTemporaryDirectory(const std::optional<std::string>& prefixOpt) {
        static std::mutex gCachePathMutex;
        static std::map<std::string,fs::path> gCachePathMap;

        std::unique_lock lock(gCachePathMutex);
        std::string prefix = prefixOpt.has_value() ? prefixOpt.value() : "";
        if (gCachePathMap.contains(prefix)) {
            return gCachePathMap[prefix];
        }

        wchar_t tempDirBuf[MAX_PATH];
        GetTempPathW(MAX_PATH, tempDirBuf);
        auto tempDir = GetTemporaryDirectoryRoot() / std::format(
            "{:%F %H-%M-%S} {}",
            std::chrono::floor<std::chrono::seconds>(std::chrono::system_clock::now()),
            GetCurrentProcessId()
        );

        if (!fs::exists(tempDir)) {
            fs::create_directories(tempDir);
        }

        gCachePathMap[prefix] = fs::canonical(tempDir);
        return gCachePathMap[prefix];
    }

    void CleanupTemporaryDirectories() {
        const auto root = GetTemporaryDirectoryRoot();
        if (!fs::exists(root)) {
            return;
        }

        std::error_code ignored;
        for (const auto& it : fs::directory_iterator(root)) {
            fs::remove_all(it.path(), ignored);
        }
    }


    fs::path GetRuntimeDirectory() {
        static fs::path sCache;
        if (!sCache.empty()) {
            return sCache;
        }

        wchar_t exePathStr[MAX_PATH];
        const auto exePathStrLen = GetModuleFileNameW(nullptr, exePathStr, MAX_PATH);

        const fs::path exePath = fs::canonical(std::wstring_view{exePathStr, exePathStrLen});

        sCache = exePath.parent_path();
        return sCache;
    }

    fs::path GetInstallationDirectory() {
        return GetRuntimeDirectory();
    }

    fs::path GetAppDataPath(std::optional<fs::path> childPath) {
        return CreateDirectories(GetLocalAppDataPath() / APP_NAME, childPath);
    }

    fs::path GetUserDataPath(std::optional<fs::path> childPath) {
        return CreateDirectories(GetDocumentsPath() / APP_NAME, childPath);
    }

    namespace Files {
        const fs::path OPENXR_JSON{"openxr-api-layer.json"};
    }
}
