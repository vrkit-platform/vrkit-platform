#include <format>
#include <mutex>
#include <windows.h>

#include <IRacingTools/SDK/Utils/UnicodeHelpers.h>
#include <IRacingTools/Shared/ProtoHelpers.h>

namespace IRacingTools::Shared::Utils {
  namespace {
    auto L = Logging::GetCategoryWithName(__FILE__);
  }
  std::expected<std::shared_ptr<Models::FileInfo>, SDK::GeneralError>
  GetFileInfo(const fs::path &path) {

    auto info = std::make_shared<Models::FileInfo>();
    if (auto res = GetFileInfo(info.get(), path); !res.has_value()) {
      return std::unexpected(res.error());
    }

    return info;
  }

  std::expected<std::shared_ptr<Models::FileInfo>, SDK::GeneralError>
  GetFileInfo(
      const std::shared_ptr<Models::FileInfo> &fileInfo,
      std::optional<fs::path> path) {

    if (auto res = GetFileInfo(fileInfo.get(), path); !res.has_value()) {
      return std::unexpected(res.error());
    }

    return fileInfo;
  }


  std::expected<Models::FileInfo *, SDK::GeneralError>
  GetFileInfo(Models::FileInfo *info, std::optional<fs::path> path) {
    fs::path finalPath = path.value_or(fs::path(info->file()));
    if (!finalPath.is_absolute())
      finalPath = fs::absolute(finalPath);

    if (!fs::exists(finalPath) || fs::is_directory(finalPath)) {
      return std::unexpected(SDK::GeneralError(
          ErrorCode::NotFound,
          std::format(
              "Can not get file info for ({}), does not exist",
              finalPath.string())));
    }

    info->set_parent_dir(finalPath.parent_path().string());
    info->set_file(finalPath.string());
    info->set_filename(finalPath.filename().string());
    info->set_is_deleted(false);

    if (auto tsRes = UpdateFileInfoTimestamps(info); tsRes.has_value()) {
      return std::unexpected(tsRes.value());
    }

    L->debug("FileInfo populated ({})", info->DebugString());

    return info;
  }

  bool FileInfoPathMatch(
      const Models::FileInfo *fileInfo1, const Models::FileInfo *fileInfo2) {
    return fileInfo1->file() == fileInfo2->file();
  }

  std::optional<SDK::GeneralError>
  UpdateFileInfoTimestamps(const std::shared_ptr<Models::FileInfo> &fileInfo) {
    return UpdateFileInfoTimestamps(fileInfo.get());
  }

  std::optional<SDK::GeneralError>
  UpdateFileInfoTimestamps(Models::FileInfo *fileInfo) {
    fs::path path{fileInfo->file()};
    if (!path.is_absolute())
      path = fs::absolute(path);

    if (path.empty() || !fs::exists(path))
      return SDK::GeneralError(
          ErrorCode::NotFound,
          std::format(
              "Invalid path >> {}",
              path.string()));

    auto tsRes = GetFileTimestamps<FileInfoClock>(path);
    if (!tsRes)
      return tsRes.error();

    auto& ts = tsRes.value();
    int64_t createdAtSeconds = ToSeconds(ts.createdAt);
    int64_t modifiedAtSeconds = ToSeconds(ts.modifiedAt);

    fileInfo->set_created_at(createdAtSeconds);
    fileInfo->set_modified_at(modifiedAtSeconds);

    return std::nullopt;
  }
} // namespace IRacingTools::Shared::Utils
