//
// Created by jglanz on 1/17/2024.
//

#pragma once

#include <filesystem>
#include <intsafe.h>

namespace IRacingTools::Shared {

namespace fs = std::filesystem;

/** Differs from std::filesystem::temp_directory_path() in that
 * it guarantees to be in canonical form */
fs::path GetTemporaryDirectory();
fs::path GetRuntimeDirectory();
fs::path GetInstallationDirectory();

void CleanupTemporaryDirectories();

std::vector<BYTE> ReadFile(const fs::path& path);

namespace Files {
 extern const std::filesystem::path OPENXR_JSON;
}

}
