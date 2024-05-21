//
// Created by jglanz on 1/25/2024.
//

#pragma once

#include <cstdio>
#include <filesystem>
#include <string>
#include <vector>
#include <IRacingTools/SDK/ErrorTypes.h>

namespace IRacingTools::SDK::Utils {
    bool HasFileExtension(const std::filesystem::path& file, const std::string& ext);
    bool HasFileExtension(const std::filesystem::path& file, const std::vector<std::string>& exts);
    bool FileReadDataFully(void* buffer, std::size_t size, std::size_t count, std::FILE* stream);

    Expected<std::vector<unsigned char>> ReadFile(const std::filesystem::path& path);
    Expected<std::string> ReadTextFile(const std::filesystem::path& path);

    Expected<std::size_t> WriteFile(const std::filesystem::path& path, const unsigned char* buf, size_t size);
    Expected<std::size_t> WriteFile(const std::filesystem::path& path, const std::vector<unsigned char>& data);
    Expected<std::size_t> WriteTextFile(const std::filesystem::path& path, const std::string& txt);
}
