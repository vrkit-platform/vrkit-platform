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

    std::filesystem::path GetKnownFolderPath(const KNOWNFOLDERID& folderId);
    fs::path CreateDirectories(const fs::path& path, const std::optional<fs::path>& childPath = std::nullopt);

    /** Differs from std::filesystem::temp_directory_path() in that
     * it guarantees to be in canonical form */
    fs::path GetTemporaryDirectoryRootA();
    fs::path GetTemporaryDirectoryRoot();
    fs::path GetTemporaryDirectory(const std::optional<std::string>& prefixOpt = std::nullopt);
    fs::path GetRuntimeDirectory();
    fs::path GetInstallationDirectory();
    fs::path GetAppDataPath(std::optional<fs::path> childPath = std::nullopt);
    fs::path GetUserDataPath(std::optional<fs::path> childPath = std::nullopt);

    void CleanupTemporaryDirectories();



    namespace Files {
        extern const std::filesystem::path OPENXR_JSON;
    }
}
