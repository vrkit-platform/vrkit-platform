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


    std::vector<fs::path> ListAllFilesRecursively(const std::vector<fs::path>& paths, const std::string &ext) {
        return ListAllFiles(paths, true, ext);
    }
    std::vector<fs::path> ListAllFiles(const std::vector<fs::path>& paths, bool recursive, const std::string &ext) {
        std::vector<fs::path> files{};
        
        for (auto& path : paths) {
            auto iterateFiles = [&](auto it) {
                for(auto& fileEntry : it) {
                    auto& file = fileEntry.path();
                    if (ext.empty() || file.string().ends_with(ext)) {
                        files.push_back(file);
                    }
                }
            };
            if (recursive)
            iterateFiles(fs::recursive_directory_iterator(path));
            else iterateFiles(fs::directory_iterator(path));
            // auto fileIterator = recursive ? fs::recursive_directory_iterator(path) : fs::directory_iterator(path);
            // for(auto& fileEntry : fileIterator) {
            //     auto& file = fileEntry.path();
            //     if (ext.empty() || file.string().ends_with(ext)) {
            //         files.push_back(file);
            //     }
            // }
        }
        return files;
    }
    
    std::vector<fs::path> ListAllFilesRecursively(const fs::path& path, const std::string &ext) {
      return ListAllFilesRecursively(std::vector<fs::path>{path}, ext);
    }

    fs::path GetTemporaryDirectory(const std::optional<std::string> &prefixOpt) {
      static std::mutex gCachePathMutex;
      static std::map<std::string, fs::path> gCachePathMap;

      std::unique_lock lock(gCachePathMutex);
      std::string prefix = prefixOpt.has_value() ? prefixOpt.value() : "";
      if (gCachePathMap.contains(prefix)) {
        return gCachePathMap[prefix];
      }

      wchar_t tempDirBuf[MAX_PATH];
      GetTempPathW(MAX_PATH, tempDirBuf);
      auto tempDir = GetTemporaryDirectoryRoot() /
                     std::format("{:%F %H-%M-%S}_{}_{}",
                                 std::chrono::floor<std::chrono::seconds>(std::chrono::system_clock::now()), prefix,
                                 GetCurrentProcessId());

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
        fs::path appDataPath = GetLocalAppDataPath();
        appDataPath /= Directories::APP_FOLDER;
        return CreateDirectories(appDataPath,childPath);
    }

    fs::path GetUserDataPath(std::optional<fs::path> childPath) {
        return CreateDirectories(GetDocumentsPath() / Directories::APP_FOLDER, childPath);
    }
    fs::path GetOrCreateIRacingDocumentPath(const std::string_view& childPath) {
        fs::path finalPath = GetDocumentsPath() / Directories::IRACING_APP_FOLDER;
        if (!childPath.empty())
            finalPath /= childPath;
        if (!fs::exists(finalPath)) {
           fs::create_directories(finalPath); 
        }
        assert(fs::exists(finalPath) && fs::is_directory(finalPath));

        return finalPath;
    }

    fs::path GetIRacingTelemetryPath() {
        return GetOrCreateIRacingDocumentPath(DocumentsTelemetry);
    }

    fs::path GetTrackMapsPath() {
        return GetAppDataPath(Directories::TRACK_MAPS);
    }

    std::expected<fs::path, SDK::NotFoundError> GetIRacingDocumentPath(std::optional<fs::path> childPath) {
        fs::path finalPath = GetDocumentsPath() / "iRacing";
        if (childPath.has_value())
            finalPath /= childPath.value();

        auto exists = fs::exists(finalPath);
        if (exists && !is_directory(finalPath)) IRT_LOG_AND_FATAL(
            "Path ({}) is not a directory, but exists",
            finalPath.string()
        );

        if (!exists) {
            return std::unexpected(SDK::NotFoundError(SDK::ErrorCode::NotFound, fmt::format("iRacing Path ({}) does not exist", finalPath.string())));
        }

        return finalPath;
    }
    
    namespace Files {
        const fs::path OPENXR_JSON{"openxr-api-layer.json"};
        // const fs::path LOG_FILENAME{APP_NAME ".log"};
    }
}
