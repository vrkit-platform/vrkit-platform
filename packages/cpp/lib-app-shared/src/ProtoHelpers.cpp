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
  GetFileInfo(Models::FileInfo *fileInfo, std::optional<fs::path> path) {
    fs::path finalPath = path.value_or(fs::path(fileInfo->file()));
    if (!finalPath.is_absolute())
      finalPath = fs::absolute(finalPath);

    if (!fs::exists(finalPath) || fs::is_directory(finalPath)) {
      return std::unexpected(SDK::GeneralError(
          ErrorCode::NotFound,
          std::format(
              "Can not get file info for ({}), does not exist",
              finalPath.string())));
    }

    fileInfo->set_parent_dir(finalPath.parent_path().string());
    fileInfo->set_file(finalPath.string());
    fileInfo->set_filename(finalPath.filename().string());
    fileInfo->set_is_deleted(false);

    if (auto tsRes = UpdateFileInfoTimestamps(fileInfo); tsRes.has_value()) {
      return std::unexpected(tsRes.value());
    }

    L->debug("FileInfo populated ({})", fileInfo->DebugString());

    return fileInfo;
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
    // int64_t createdAtSeconds = std::chrono::duration_cast<std::chrono::seconds>(ts.createdAt.time_since_epoch()).count();
    // int64_t modifiedAtSeconds = std::chrono::duration_cast<std::chrono::seconds>(ts.modifiedAt.time_since_epoch()).count();
    int64_t createdAtSeconds = ToSeconds(ts.createdAt);
    int64_t modifiedAtSeconds = ToSeconds(ts.modifiedAt);

    fileInfo->mutable_created_at()->set_seconds(createdAtSeconds);
    fileInfo->mutable_created_at()->set_nanos(0);
    fileInfo->mutable_modified_at()->set_seconds(modifiedAtSeconds);
    fileInfo->mutable_modified_at()->set_nanos(0);

    return std::nullopt;
  }
} // namespace IRacingTools::Shared::Utils
