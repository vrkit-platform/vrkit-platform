#include <IRacingTools/Shared/FileSystemHelpers.h>
#include <windows.h>
#include <format>
#include <mutex>

#include <IRacingTools/Shared/Macros.h>
#include <IRacingTools/Shared/UnicodeHelpers.h>

namespace IRacingTools::Shared {

namespace {
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
    for (const auto &it : std::filesystem::directory_iterator(root)) {
        std::filesystem::remove_all(it.path(), ignored);
    }
}

std::vector<BYTE> ReadFile(const fs::path &path) {
    size_t size;
    if (!exists(path) || (size = file_size(path)) == 0) {
        return {};
    }

    std::vector<BYTE> data(size);
    auto buf = data.data();
    auto pathStr = UnicodeConvStd::ToUtf8(path);
    auto file = std::fopen(pathStr.c_str(),"rb");
    {

        size_t readTotal = 0;

        while (readTotal < size) {
            size_t read = std::fread(buf + readTotal,1,size - readTotal, file);
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
    const auto exePathStrLen = GetModuleFileNameW(NULL, exePathStr, MAX_PATH);

    const std::filesystem::path exePath = std::filesystem::canonical(std::wstring_view{exePathStr, exePathStrLen});

    sCache = exePath.parent_path();
    return sCache;
}
}
