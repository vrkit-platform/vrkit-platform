
#include <IRacingTools/SDK/DiskClient.h>
#include <chrono>
#include <fstream>
#include <functional>
#include <iostream>
#include <magic_enum.hpp>

#include <google/protobuf/util/json_util.h>

#include <IRacingTools/SDK/Utils/Base64.h>
#include <IRacingTools/SDK/Utils/CollectionHelpers.h>
#include <IRacingTools/SDK/Utils/RunnableThread.h>

#include <IRacingTools/Shared/Chrono.h>
#include <IRacingTools/Shared/FileSystemHelpers.h>
#include <IRacingTools/Shared/Logging/LoggingManager.h>
#include <IRacingTools/Shared/ProtoHelpers.h>
#include <IRacingTools/Shared/Services/LapTrajectoryTool.h>
#include <IRacingTools/Shared/Services/Pipelines/PipelineExecutorRegistry.h>
#include <IRacingTools/Shared/Services/TelemetryDataService.h>
#include <IRacingTools/Shared/Services/TrackMapService.h>
#include <IRacingTools/Shared/Utils/SessionInfoHelpers.h>

#include "TrackMapGenerator.h"

namespace IRacingTools::Shared::Services {
  using namespace IRacingTools::SDK::Utils;
  using namespace IRacingTools::Shared::Logging;
  using namespace IRacingTools::Shared::Services::Pipelines;
  using namespace IRacingTools::Shared::Utils;
  namespace {
    auto L = GetCategoryWithType<TrackMapService>();

    std::string LapTrajectoryToFilename(const LapTrajectory *it) {
      return TrackLayoutIdToFilename(it->track_layout_metadata().id());
    }

    std::string LapTrajectoryToFilename(const LapTrajectory &it) {
      return LapTrajectoryToFilename(&it);
    }


  } // namespace


  TrackMapService::TrackMapService(
      const std::shared_ptr<ServiceContainer> &serviceContainer)
      : TrackMapService(serviceContainer, Options{}) {
  }

  TrackMapService::TrackMapService(
      const std::shared_ptr<ServiceContainer> &serviceContainer,
      const Options &options)
      : Service(serviceContainer, PrettyType<TrackMapService>{}.name()),
        options_(options) {


    dataFileTaskQueue_ = std::make_unique<TrackMapTaskQueue>(
        [&](const std::shared_ptr<TelemetryDataFile> &dataFile) -> std::string {
          return dataFileTaskQueueFn(dataFile);
        });
    reset();
  }

  void TrackMapService::enqueueDataFiles(
      const std::vector<std::shared_ptr<TelemetryDataFile>> &changedDataFiles) {

    std::scoped_lock lock(stateMutex_);


    for (auto &changedDataFile: changedDataFiles) {
      auto &file = changedDataFile->file_info().file();
      if (dataFilesTaskMap_.contains(changedDataFile->file_info().file())) {
        L->info("All ready enqueued ({})", file);
        continue;
      }
      dataFilesTaskMap_[file] =
          dataFileTaskQueue_->enqueue(std::shared_ptr(changedDataFile));
    }
  }

  std::string TrackMapService::dataFileTaskQueueFn(
      const std::shared_ptr<TelemetryDataFile> &dataFile) {
    auto &fileStr = dataFile->file_info().file();
    dataFilesTaskMap_.erase(fileStr);

    auto res = GenerateTrackMap(getContainer(), dataFile);
    if (!res) {
      L->error("Failed to generate trackmap: {}", res.error().what());
    } else {
      auto &tmFile = res.value();
      if (auto setRes = set(tmFile); !setRes) {
        L->error("Failed to set track map file >> {}", setRes.error().what());
      }
    }

    return fileStr;
  }


  void TrackMapService::reset(bool skipPrepare) {
    filePaths_.clear();

    // NOW PREPARE
    if (!skipPrepare) {
      filePaths_ = options_.paths.empty()
                       ? std::vector<fs::path>{GetTrackMapsPath()}
                       : options_.paths;
    }
  }


  void TrackMapService::setOptions(const Options &options) {
    std::scoped_lock lock(stateMutex_);
    options_ = options;
    reset();
  }

  std::expected<bool, SDK::GeneralError> TrackMapService::init() {
    auto onReadHandler =
        [&](const std::vector<
            std::shared_ptr<IRacingTools::Models::TrackMapFile>> &files) {
          std::scoped_lock lock(stateMutex_);
          dataFiles_.clear();
          files_.clear();
          for (auto &file: files) {
            files_[file->track_layout_metadata().id()] = file;
          }
        };
    {
      std::scoped_lock lock(stateMutex_);

      fileHandler_ =
          std::make_unique<Utils::JSONLinesMessageFileHandler<TrackMapFile>>(
              GetAppDataPath() / TrackMapFileJSONLFilename);

      fileHandler_->events.onRead.subscribe(onReadHandler);

      // READ THE UNDERLYING DATA FILE, THE RESULT (IF SUCCESSFUL) IS HANDLED BY
      // THE `onRead` EVENT HANDLER
      L->info(
          "Reading TrackMapFile jsonl file: {}", fileHandler_->file().string());

      auto loadError = load(true);

      // IF THERE WAS AN ERROR, THEN RETURN HERE
      if (loadError) {
        return std::unexpected(loadError.value());
      }

      // TODO: Add JSONLines data file loading here
      auto tds = getContainer()->getService<TelemetryDataService>();
      tds->events.onFilesChanged.subscribe([&](auto _, auto &changedDataFiles) {
        enqueueDataFiles(changedDataFiles);
      });
    }
    return true;
  }

  std::expected<bool, SDK::GeneralError> TrackMapService::start() {
    std::scoped_lock lock(stateMutex_);

    if (state() >= State::Starting)
      return state() == State::Running;

    setState(State::Starting);


    setState(State::Running);


    return true;
  }

  std::optional<SDK::GeneralError> TrackMapService::destroy() {
    std::scoped_lock lock(stateMutex_);
    if (state() >= State::Destroying)
      return std::nullopt;

    setState(State::Destroying);
    reset(true);
    setState(State::Destroyed);
    return std::nullopt;
  }

  /**
   * @brief Remove underlying data file & clear the map
   *
   * @return std::optional<SDK::GeneralError>
   */
  std::optional<SDK::GeneralError> TrackMapService::clearTrackMapCache() {
    dataFiles_.clear();

    return std::nullopt;
  }
  fs::path TrackMapService::getFilePath() {
    assert((!filePaths_.empty() && "Track map path not set"));
    return filePaths_[0];
  }

  std::vector<fs::path> TrackMapService::listTrackMaps() {
    return ListAllFiles(filePaths_, false, Extensions::TRACK_MAP);
  }

  std::size_t TrackMapService::cacheSize() {
    std::scoped_lock lock(stateMutex_);
    return dataFiles_.size();
  }

  bool TrackMapService::exists(const std::string &trackLayoutId) {
    std::scoped_lock lock(stateMutex_);
    return dataFiles_.contains(trackLayoutId) ||
           findFile(trackLayoutId).has_value();
  }
  std::optional<fs::path>
  TrackMapService::findFile(const std::shared_ptr<LapTrajectory> &lt) {
    return findFile(lt->track_layout_metadata().id());
  }

  std::optional<fs::path>
  TrackMapService::findFile(const std::string &trackLayoutId) {
    auto ltFilename = TrackLayoutIdToFilename(trackLayoutId);
    for (auto &filePath: filePaths_) {
      auto file = filePath / ltFilename;
      if (fs::exists(file)) {
        return file;
      }
    }

    return std::nullopt;
  }


  bool TrackMapService::isAvailable(const std::string &trackLayoutId) {
    std::scoped_lock lock(stateMutex_);
    auto filename = TrackLayoutIdToFilename(trackLayoutId);
    return dataFiles_.contains(filename) || findFile(trackLayoutId).has_value();
  }

  std::shared_ptr<LapTrajectory>
  TrackMapService::getData(const std::string &trackLayoutId) {
    std::scoped_lock lock(stateMutex_);
    auto res = findFile(trackLayoutId);
    if (!res)
      return nullptr;

    auto dataRes = ReadMessageFromFile<LapTrajectory>(res.value());
    if (!dataRes)
      return nullptr;

    return std::make_shared<LapTrajectory>(dataRes.value());
  }

  std::shared_ptr<TrackMapFile>
  TrackMapService::get(const std::string &trackLayoutId) {
    std::scoped_lock lock(stateMutex_);
    return files_[trackLayoutId];
  }

  std::expected<const std::shared_ptr<TrackMapFile>, SDK::GeneralError>
  TrackMapService::set(const std::shared_ptr<TrackMapFile> &tmFile) {
    return set(tmFile->track_layout_metadata().id(), tmFile);
  }

  std::expected<const std::shared_ptr<TrackMapFile>, SDK::GeneralError>
  TrackMapService::set(
      const std::string &trackLayoutId,
      const std::shared_ptr<TrackMapFile> &tmFile) {
    {
      std::scoped_lock lock(stateMutex_);

      // COPY CURRENT MAP
      auto newFiles = files_;

      // SET MAPPING TO DATA FILE

      newFiles[trackLayoutId] = tmFile;

      // WRITE CHANGES TO DISK
      auto res = fileHandler_->write(SDK::Utils::ValuesOf(newFiles));

      // CHECK ERROR
      if (!res.has_value()) {
        return std::unexpected(res.error());
      }

      // MOVE NEW DATA FILES WITH CHANGES ON TO `dataFiles_` member
      files_ = std::move(newFiles);
    }

    events.onFilesChanged.publish(this, {tmFile});

    return tmFile;
  }

  std::optional<SDK::GeneralError>
  TrackMapService::load(bool reload) {
    std::scoped_lock lock(stateMutex_);
    if (!reload && !files_.empty())
      return std::nullopt;

    auto res = fileHandler_->read();
    if (!res && res.error().code() != SDK::ErrorCode::NotFound) {
      return res.error();
    }

    return std::nullopt;
  }

  bool TrackMapService::hasPendingTasks() {
    return dataFileTaskQueue_->hasPendingTasks();
  }

  std::size_t TrackMapService::pendingTaskCount() {
    return dataFileTaskQueue_->pendingTaskCount();
  }

  std::expected<std::shared_ptr<TrackMapService>, SDK::GeneralError>
  TrackMapService::save() {

    auto res = fileHandler_->write(toFileList());

    if (!res) {
      return std::unexpected(
          SDK::GeneralError(SDK::ErrorCode::General, "Unknown"));
    }

    return shared_from_this();
  }

  std::vector<std::shared_ptr<TrackMapFile>> TrackMapService::toFileList() {
    std::scoped_lock lock(stateMutex_);

    return SDK::Utils::ValuesOf(files_);
  }

} // namespace IRacingTools::Shared::Services
