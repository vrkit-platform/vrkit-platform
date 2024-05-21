//
// Created by jglanz on 1/17/2024.
//

#pragma once

#include <filesystem>
#include <intsafe.h>

namespace IRacingTools::Shared {
    namespace fs = std::filesystem;

    constexpr std::string_view TemporaryDirectoryNameA = "IRacingTools";
    constexpr std::wstring_view TemporaryDirectoryNameW = L"IRacingTools";

    /** Differs from std::filesystem::temp_directory_path() in that
     * it guarantees to be in canonical form */
    fs::path GetTemporaryDirectoryRootA();
    fs::path GetTemporaryDirectory();
    fs::path GetRuntimeDirectory();
    fs::path GetInstallationDirectory();
    fs::path GetAppDataPath(std::optional<fs::path> childPath = std::nullopt);
    fs::path GetUserDataPath(std::optional<fs::path> childPath = std::nullopt);

    void CleanupTemporaryDirectories();



    namespace Files {
        extern const std::filesystem::path OPENXR_JSON;
    }
}
