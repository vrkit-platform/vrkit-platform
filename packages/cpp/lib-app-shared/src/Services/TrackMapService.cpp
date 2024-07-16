
#include <chrono>
#include <fstream>
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
#include <IRacingTools/Shared/Services/Pipelines/PipelineExecutorRegistry.h>
#include <IRacingTools/Shared/Services/TrackMapService.h>


namespace IRacingTools::Shared::Services {
  using namespace IRacingTools::SDK::Utils;
  using namespace IRacingTools::Shared::Logging;
  using namespace IRacingTools::Shared::Services::Pipelines;
  using namespace IRacingTools::Shared::Utils;
  namespace {
    auto L = GetCategoryWithType<TrackMapService>();
    std::mutex gProcessorMutex{};

    std::string LapTrajectoryToFilename(const LapTrajectory* it) {
      return std::format("{}{}", it->track_config_id(),Extensions::TRACK_MAP);
    }
    std::string LapTrajectoryToFilename(const LapTrajectory& it) {
      return LapTrajectoryToFilename(&it);
    }
    
  }
    

  TrackMapService::TrackMapService(const std::shared_ptr<ServiceContainer>& serviceContainer) : TrackMapService(serviceContainer, Options{}) {
  }

  TrackMapService::TrackMapService(const std::shared_ptr<ServiceContainer>& serviceContainer, const Options &options)
      : Service(serviceContainer, PrettyType<TrackMapService>{}.name()), options_(options) {
    reset();
  }

  void TrackMapService::reset(bool skipPrepare) {
    
      filePaths_.clear();

      // NOW PREPARE
      if (!skipPrepare) {
        
        filePaths_ = options_.paths.empty() ? std::vector<fs::path>{GetTrackMapsPath()} : options_.paths;

      }
    }
  

  void TrackMapService::setOptions(const Options &options) {
    std::scoped_lock lock(stateMutex_);
    options_ = options;
    reset();
  }

  std::expected<bool, SDK::GeneralError> TrackMapService::init() {
    std::scoped_lock lock(stateMutex_);

    // READ THE UNDERLYING DATA FILE, THE RESULT (IF SUCCESSFUL) IS HANDLED BY
    // THE `onRead` EVENT HANDLER
    
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

  std::vector<fs::path> TrackMapService::listTrackMaps() {
    return ListAllFiles(filePaths_, false, Extensions::TRACK_MAP);
  }
  std::expected<std::shared_ptr<TrackMapService>, SDK::GeneralError> TrackMapService::load(bool reload) {
    

    return shared_from_this();
  }

  std::expected<std::shared_ptr<TrackMapService>, SDK::GeneralError> TrackMapService::save() {


    return shared_from_this();
  }

  std::size_t TrackMapService::size() {
    std::scoped_lock lock(stateMutex_);
    return dataFiles_.size();
  }

  TrackMapService::DataFileMap &TrackMapService::getDataFileMapRef() {
    return dataFiles_;
  }

  std::vector<std::shared_ptr<LapTrajectory>> TrackMapService::toDataFileList() {
    std::scoped_lock lock(stateMutex_);

    return SDK::Utils::ValuesOf(dataFiles_);
  }

  bool TrackMapService::exists(const std::string &nameOrAlias) {
    std::scoped_lock lock(stateMutex_);
    return dataFiles_.contains(nameOrAlias);
  }

  std::optional<fs::path> TrackMapService::findFile(const std::shared_ptr<LapTrajectory> &dataFile) {
    for (auto &filePath: filePaths_) {
      auto file = filePath / LapTrajectoryToFilename(dataFile.get());
      if (fs::exists(file)) {
        return file;
      }
    }

    return std::nullopt;
  }


  bool TrackMapService::isAvailable(const std::string &nameOrAlias) {
    std::scoped_lock lock(stateMutex_);
    if (dataFiles_.contains(nameOrAlias)) {
      return findFile(dataFiles_[nameOrAlias]).has_value();
    }

    return false;
  }

  std::shared_ptr<LapTrajectory> TrackMapService::get(const std::string &nameOrAlias) {
    std::scoped_lock lock(stateMutex_);
    if (dataFiles_.contains(nameOrAlias)) {
      return dataFiles_[nameOrAlias];
    }
    return std::shared_ptr<LapTrajectory>();
  }

  std::expected<const std::shared_ptr<LapTrajectory>, SDK::GeneralError>
  TrackMapService::set(const std::shared_ptr<LapTrajectory> &trajectory) {
    return set(trajectory->track_config_id(), trajectory);
  }

  std::expected<const std::shared_ptr<LapTrajectory>, SDK::GeneralError>
  TrackMapService::set(const std::string &id, const std::shared_ptr<LapTrajectory> &trajectory) {
    std::scoped_lock lock(stateMutex_);
    assert((!filePaths_.empty() && "Track map path not set"));
    auto path = filePaths_[0];
    auto filename = LapTrajectoryToFilename(trajectory.get());
    auto file = path / filename;

    if (!WriteMessageToFile(*trajectory.get(), file)) {
      L->error("Failed to write {}", file.string());
      return std::unexpected(SDK::GeneralError(SDK::ErrorCode::General, "Unknown error occured"));
    }
    
    return trajectory;
  }


}// namespace IRacingTools::Shared::Services
