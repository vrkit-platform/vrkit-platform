//
// Created by jglanz on 1/17/2024.
//

#pragma once

#include <IRacingTools/Shared/SharedAppLibPCH.h>
#include <filesystem>


namespace IRacingTools::Shared {
  namespace fs = std::filesystem;

  constexpr std::string_view TemporaryDirectoryNameA = "IRacingTools";
  constexpr std::wstring_view TemporaryDirectoryNameW = L"IRacingTools";

  constexpr std::string_view TracksPath = "tracks";
  constexpr std::string_view TrackDataPath = "track-data.jsonl";

  constexpr std::string_view DocumentsTelemetry = "telemetry";

  fs::path GetKnownFolderPath(const KNOWNFOLDERID &folderId);
  fs::path CreateDirectories(const fs::path &path, const std::optional<fs::path> &childPath = std::nullopt);

  std::vector<fs::path> ListAllFilesRecursively(const std::vector<fs::path> &paths, const std::string &ext = "");
  std::vector<fs::path> ListAllFiles(const std::vector<fs::path>& paths, bool recursive = false, const std::string &ext = "");

  /** Differs from std::filesystem::temp_directory_path() in that
   * it guarantees to be in canonical form */
  fs::path GetTemporaryDirectoryRootA();
  fs::path GetTemporaryDirectoryRoot();
  fs::path GetTemporaryDirectory(const std::optional<std::string> &prefixOpt = std::nullopt);
  fs::path GetRuntimeDirectory();
  fs::path GetInstallationDirectory();

  fs::path GetAppDataPath(std::optional<fs::path> childPath = std::nullopt);
  fs::path GetUserDataPath(std::optional<fs::path> childPath = std::nullopt);
  fs::path GetOrCreateIRacingDocumentPath(const std::string_view &childPath);
  fs::path GetIRacingTelemetryPath();
  fs::path GetTrackMapsPath();
  std::expected<fs::path, SDK::NotFoundError> GetIRacingDocumentPath(std::optional<fs::path> childPath = std::nullopt);

  void CleanupTemporaryDirectories();
  namespace Extensions {
    constexpr auto TRACK_MAP = ".trackmap";
  }

  namespace Directories {
    constexpr auto APP_FOLDER = "VRKit";
    constexpr auto LOGS = "Logs";
    constexpr auto IRACING_APP_FOLDER = "iRacing";

    constexpr auto TRACK_MAPS = "TrackMaps";
  }

  namespace Files {
    constexpr auto LOG_FILENAME = APP_NAME ".log";
    // extern const std::filesystem::path LOG_FILENAME;
    extern const std::filesystem::path OPENXR_JSON;
  } // namespace Files
} // namespace IRacingTools::Shared
