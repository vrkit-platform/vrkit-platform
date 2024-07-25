//
// Created by jglanz on 1/17/2024.
//

#pragma once

#include "Macros.h"
#include <io.h>


#include <IRacingTools/Models/FileInfo.pb.h>
#include <IRacingTools/Shared/Chrono.h>
#include <IRacingTools/Shared/SharedAppLibPCH.h>
#include <cstdio>
#include <filesystem>
#include <gsl/util>
#include <variant>


namespace IRacingTools::Shared {
  namespace fs = std::filesystem;

  constexpr std::string_view TemporaryDirectoryNameA = "VRKit";
  constexpr std::wstring_view TemporaryDirectoryNameW = L"VRKit";

  constexpr std::string_view TracksPath = "tracks";
  constexpr std::string_view TrackMapFileJSONLFilename = "track-map-file.jsonl";

  constexpr std::string_view TelemetryDataFileJSONLFilename = "telemetry-data-file.jsonl";

  // iRacing Paths
  constexpr std::string_view DocumentsIRacingTelemetryPath = "telemetry";

  // Default FileClock
  using DefaultFileClock = std::chrono::system_clock;

  /**
   * @brief Holds `createdAt` & `modifiedAt` timestamps for a file
   * @tparam Clock the `std::chrono::clock` to use when calculating file
   * timestamps
   */
  template<typename Clock = DefaultFileClock>
  struct FileTimestamps {
    using TimePoint = std::chrono::time_point<Clock>;
    TimePoint createdAt;
    TimePoint modifiedAt;
  };



  /**
   * @brief Get created & modified timestamps for a file
   *
   * @tparam Clock `std::chrono::clock` to use
   * @param fileOrPathVar either a file `HANDLE` OR `std::filesystem::path`
   * @return Either `FileTimestamps<Clock>` OR `SDK::GeneralError`
   */
  template<typename Clock = DefaultFileClock>
  std::expected<FileTimestamps<Clock>, SDK::GeneralError>
  GetFileTimestamps(std::variant<fs::path, std::FILE *, HANDLE> fileOrPathVar) {
    using TimePoint = typename FileTimestamps<Clock>::TimePoint;

    bool closeHandle = false;

    HANDLE fileHandle = nullptr;
    auto fileDisposer = gsl::finally([&] {
      if (fileHandle && closeHandle) {
        ::CloseHandle(fileHandle);
      }
    });
    FILETIME modifiedTime, createdTime;
    std::optional<SDK::GeneralError> errorOpt{std::nullopt};
    std::visit(
        [&](auto &&fileOrPath) {
          using T = std::decay_t<decltype(fileOrPath)>;
          if constexpr (std::is_same_v<T, fs::path>) {
            fileHandle = CreateFileA(
                fileOrPath.string().c_str(),
                GENERIC_READ,
                FILE_SHARE_READ,
                nullptr,
                OPEN_EXISTING,
                0,
                nullptr);

            if (!fileHandle)
              errorOpt = std::make_optional(SDK::GeneralError(
                  SDK::ErrorCode::NotFound,
                  std::format("Unable to open {}", fileOrPath.string())));
            else
              closeHandle = true;
          } else if constexpr (std::is_same_v<T, std::FILE *>) {
            fileHandle =
                reinterpret_cast<HANDLE>(_get_osfhandle(fileno(fileOrPath)));
          } else if constexpr (std::is_same_v<T, HANDLE>) {
            fileHandle = fileOrPath;
          }
        },
        fileOrPathVar);

    if (errorOpt)
      return std::unexpected(errorOpt.value());

    if (!fileHandle) {
      return std::unexpected(
          SDK::GeneralError(SDK::ErrorCode::NotFound, "invalid file handle"));
    }

    if (!GetFileTime(fileHandle, &createdTime, nullptr, &modifiedTime)) {
      return std::unexpected(SDK::GeneralError(
          SDK::ErrorCode::General, "Unable to get file timestamps"));
    }

    auto createdAt = toDuration<std::chrono::seconds>(createdTime);
    auto modifiedAt = toDuration<std::chrono::seconds>(modifiedTime);

    return FileTimestamps<Clock>{
        .createdAt = TimePoint(createdAt), .modifiedAt = TimePoint(modifiedAt)};
  }

  template<typename T>
  concept HasFileInfo = requires(T t) {
    { t.file_info() };
  };

  template<HasFileInfo T>
  std::expected<std::pair<bool, FileTimestamps<DefaultFileClock>>, SDK::GeneralError> CheckFileInfoModified(const std::shared_ptr<T>& msg, const std::optional<fs::path>& fileOverride = std::nullopt) {

    auto& fi = msg->file_info();
    fs::path file(fi.file());
    if (fileOverride)
      file = fileOverride.value();

    auto res = GetFileTimestamps(file);
    if (!res) {
      return std::unexpected(SDK::GeneralError(SDK::ErrorCode::General,
        std::format("Unable to get timestamps for ({}), failing the file: {}", file.string(), res.error().what())));
    }

    // CHECK THE TIMESTAMPS
    auto ts = res.value();
    auto fileModifiedAtNow = ToSeconds(ts.modifiedAt);
    auto fileModifiedAt = fi.modified_at();

    // IF NO CHANGE, MARK AS PROCESSED
    return std::pair<bool, FileTimestamps<DefaultFileClock>>(fileModifiedAtNow > fileModifiedAt, ts);
  }


  fs::path GetKnownFolderPath(const KNOWNFOLDERID &folderId);
  fs::path CreateDirectories(
      const fs::path &path,
      const std::optional<fs::path> &childPath = std::nullopt);

  std::vector<fs::path> ListAllFilesRecursively(
      const std::vector<fs::path> &paths, const std::string &ext = "");
  std::vector<fs::path> ListAllFiles(
      const std::vector<fs::path> &paths,
      bool recursive = false,
      const std::string &ext = "");

  /**
   * @brief Differs from std::filesystem::temp_directory_path() in that
   * it guarantees to be in canonical form
   */
  fs::path GetTemporaryDirectoryRootA();

  /**
   * @brief Differs from std::filesystem::temp_directory_path() in that
   * it guarantees to be in canonical form
   */
  fs::path GetTemporaryDirectoryRoot();

  /**
   * @brief Create a temporary directory
   *
   * @param prefixOpt to apply to the generated temporary root
   * @return fs::path of new temporary directory
   */
  fs::path GetTemporaryDirectory(
      const std::optional<std::string> &prefixOpt = std::nullopt);

  /**
   * @brief Get the working directory
   *
   * @return working directory
   */
  fs::path GetRuntimeDirectory();

  /**
   * @brief Get the directory where the app was installed
   *
   * @return installation path
   */
  fs::path GetInstallationDirectory();

  /**
   * @brief Get `~/AppData/local/VRKit/<childPath>` path
   * @param childPath relative to the `AppData` path
   * @return `fs::path` with childPath appended if provided
   */
  fs::path GetAppDataPath(std::optional<fs::path> childPath = std::nullopt);
  fs::path GetUserDataPath(std::optional<fs::path> childPath = std::nullopt);

  fs::path GetOrCreateIRacingDocumentPath(const std::string_view &childPath);
  fs::path GetIRacingTelemetryPath();

  /**
   * @brief Get the track maps path
   *
   * @return `fs::path` to track maps path
   */
  fs::path GetTrackMapsPath();

  /**
   * @brief Get `~/Documents/iRacing/<child-path>`
   * @param childPath iRacing documents childPath
   * @return appended iracing path
   */
  std::expected<fs::path, SDK::NotFoundError>
  GetIRacingDocumentPath(std::optional<fs::path> childPath = std::nullopt);

  void CleanupTemporaryDirectories();

  namespace Extensions {
    constexpr auto TRACK_MAP = ".trackmap";
  }

  namespace Directories {
    constexpr auto APP_FOLDER = "VRKit";
    constexpr auto LOGS = "Logs";
    constexpr auto IRACING_APP_FOLDER = "iRacing";

    constexpr auto TRACK_MAPS = "TrackMaps";
  } // namespace Directories

  namespace Files {
    constexpr auto LOG_FILENAME = "VRKit.log";
    extern const std::filesystem::path OPENXR_JSON;
  } // namespace Files
} // namespace IRacingTools::Shared
