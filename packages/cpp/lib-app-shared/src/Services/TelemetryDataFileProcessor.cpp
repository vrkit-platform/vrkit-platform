
#include <chrono>
#include <deque>
#include <fstream>
#include <magic_enum.hpp>

#include <google/protobuf/util/json_util.h>

#include <IRacingTools/SDK/Utils/Base64.h>
#include <IRacingTools/SDK/Utils/RunnableThread.h>

#include <IRacingTools/Shared/FileSystemHelpers.h>
#include <IRacingTools/Shared/Logging/LoggingManager.h>
#include <IRacingTools/Shared/Services/Pipelines/PipelineExecutorRegistry.h>
#include <IRacingTools/Shared/Services/TelemetryDataService.h>

#include "TelemetryDataFileProcessor.h"

namespace IRacingTools::Shared::Services {
  using namespace IRacingTools::SDK::Utils;
  using namespace IRacingTools::Shared::Logging;
  using namespace IRacingTools::Shared::Services::Pipelines;
  namespace {
    auto L = GetCategoryWithName("TelemetryDataFileProcessor");

    std::expected<std::shared_ptr<TelemetryDataFile>, SDK::GeneralError>
    CreateTelemetryDataFile(
        TelemetryDataService *service, const fs::path &file) {
      auto fileEncoded = Base64::encode(file.string());
      auto dataFile = std::make_shared<TelemetryDataFile>();

      dataFile->set_id(fileEncoded);
      dataFile->set_alias(file.filename().string());

      auto fileInfo = dataFile->mutable_file_info();

      if (auto fileInfoRes = GetFileInfo(fileInfo, file); !fileInfoRes) {
        auto &err = fileInfoRes.error();
        return std::unexpected(err);
      }

      auto tlmRes = service->getTrackLayoutMetadata(file);
      if (!tlmRes)
        return std::unexpected(tlmRes.error());

      auto tlm = tlmRes.value();
      dataFile->mutable_track_layout_metadata()->CopyFrom(*tlm);
      L->debug(
          "track_layout_metadata ({}): {}", file.string(), tlm->DebugString());

      dataFile->set_status(TelemetryDataFile::STATUS_CREATED);

      return dataFile;
    }
  } // namespace

  using ProcessResult =
      std::expected<std::shared_ptr<TelemetryDataFile>, GeneralError>;

  ProcessResult ProcessTelemetryDataFile(
      const std::shared_ptr<TelemetryDataService> &service,
      const fs::path &file,
      std::shared_ptr<TelemetryDataFile> dataFile) {
    L->info("Processing {}", file.string());

    auto onError = [&]<typename... Args>(
                       fmt::format_string<Args...> fmt,
                       Args &&...args) -> ProcessResult {
      std::string message = fmt::format(fmt, std::forward<Args>(args)...);
      L->error(message);
      if (dataFile) {
        dataFile->set_status(TelemetryDataFile::STATUS_ERROR);
        return dataFile;
      }
      return std::unexpected(GeneralError(ErrorCode::General, message));
    };
    if (fs::is_directory(file)) {
      return onError("{} is a directory", file.string());
    }

    L->debug(
        "Checking  {} if it already has a TelemetryDataFile", file.string());
    dataFile = service->getByFile(file);

    // CHECK IF THE TIMESTAMP HAS CHANGED
    if (dataFile) {
      // COPY IT BEFORE MAKING CHANGES
      {
        auto dataFileCopy = std::make_shared<TelemetryDataFile>();
        dataFileCopy->CopyFrom(*dataFile);
        dataFile.swap(dataFileCopy);
      }
      // GET THE LATEST FILE TIMESTAMPS
      auto dataFileTimestampsRes = GetFileTimestamps(file);
      if (!dataFileTimestampsRes) {

        return onError(
            "Unable to get timestamps for ({}), failing the file: {}",
            file.string(),
            dataFileTimestampsRes.error().what());
      }

      // CHECK THE TIMESTAMPS
      auto &dataFileTimestamps = dataFileTimestampsRes.value();
      auto dataFileModifiedAtNow = ToSeconds(dataFileTimestamps.modifiedAt);
      auto dataFileModifiedAt = dataFile->file_info().modified_at();

      // IF NO CHANGE, MARK AS PROCESSED
      if (dataFileModifiedAtNow <= dataFileModifiedAt.seconds()) {
        L->debug("Ignoring telemetry file ({}) as it has already been "
                 "ingested");
        return nullptr;
      }

      // UPDATE WITH NEW `modifiedAt`
      L->debug(
          "File ({}) has been updated (currentModifiedAt={},modifiedAt={})",
          file.string(),
          dataFileModifiedAtNow,
          dataFileModifiedAt.seconds());
      dataFile->mutable_file_info()->mutable_modified_at()->set_seconds(dataFileModifiedAtNow);
    }

    // IF NO FILE EXISTS IN THE SERVICE
    if (!dataFile) {
      auto dataFileRes = CreateTelemetryDataFile(service.get(), file);
      if (!dataFileRes) {
        return std::unexpected(dataFileRes.error());
      }

      dataFile = dataFileRes.value();
    }

    dataFile->set_status(TelemetryDataFile::STATUS_AVAILABLE);

    return dataFile;
  }


} // namespace IRacingTools::Shared::Services
