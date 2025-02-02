//
// Created by jglanz on 1/25/2024.
//

#pragma once

#include <cstdio>
#include <filesystem>
#include <string>
#include <vector>

#include <gsl/util>

#include <IRacingTools/SDK/ErrorTypes.h>

/**
 * @brief Cleans up a file resource.
 *
 * This function takes a pointer to a file pointer and closes the file resource
 * pointed to by it, ensuring that the pointer is set to nullptr after the cleanup.
 *
 * @param file variable name of file
 *
 * @return A function object that cleans up the file resource when invoked.
 */
#define FILE_RESOURCE_DISPOSER(file) gsl::finally([&] {\
    if (file) {\
        std::fclose(file);\
        file = nullptr;\
    }\
})

namespace IRacingTools::SDK::Utils {
    bool HasFileExtension(const std::filesystem::path& file, const std::string& ext);
    bool HasFileExtension(const std::filesystem::path& file, const std::vector<std::string>& exts);
    bool FileReadDataFully(void* buffer, std::size_t size, std::size_t count, std::FILE* stream);
    std::vector<std::filesystem::path> ListAllFiles(const std::vector<std::filesystem::path>& paths, bool recursive = false, const std::string &ext = "");

    Expected<std::vector<unsigned char>> ReadFile(const std::filesystem::path& path);
    Expected<std::string> ReadTextFile(const std::filesystem::path& path);

    Expected<std::size_t> WriteFile(const std::filesystem::path& path, const unsigned char* buf, size_t size);
    Expected<std::size_t> WriteFile(const std::filesystem::path& path, const std::vector<unsigned char>& data);
    Expected<std::size_t> WriteTextFile(const std::filesystem::path& path, const std::string& txt);
}
