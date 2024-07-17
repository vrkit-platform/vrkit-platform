
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

    std::string TrackLayoutIdToFilename(const std::string &trackLayoutId) {
      std::string rawFilename = std::format("{}{}", trackLayoutId, Extensions::TRACK_MAP);
      std::regex invalidCharsExp{"[\\s:]"};
      std::string filename = std::regex_replace(rawFilename, invalidCharsExp, "_");
      return filename;
    }

    std::string LapTrajectoryToFilename(const LapTrajectory *it) {
      return TrackLayoutIdToFilename(it->track_layout_id());
    }
    std::string LapTrajectoryToFilename(const LapTrajectory &it) {
      return LapTrajectoryToFilename(&it);
    }
  } // namespace


  TrackMapService::TrackMapService(const std::shared_ptr<ServiceContainer> &serviceContainer)
      : TrackMapService(serviceContainer, Options{}) {
  }

  TrackMapService::TrackMapService(const std::shared_ptr<ServiceContainer> &serviceContainer, const Options &options)
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

  std::size_t TrackMapService::cacheSize() {
    std::scoped_lock lock(stateMutex_);
    return dataFiles_.size();
  }

  bool TrackMapService::exists(const std::string &trackLayoutId) {
    std::scoped_lock lock(stateMutex_);
    return dataFiles_.contains(trackLayoutId) || findFile(trackLayoutId).has_value();
  }
  std::optional<fs::path> TrackMapService::findFile(const std::shared_ptr<LapTrajectory> &lt) {
    return findFile(lt->track_layout_id());
  }

  std::optional<fs::path> TrackMapService::findFile(const std::string &trackLayoutId) {
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

  std::shared_ptr<LapTrajectory> TrackMapService::get(const std::string &trackLayoutId) {
    std::scoped_lock lock(stateMutex_);
    auto res = findFile(trackLayoutId);
    if (!res)
      return nullptr;
    
    auto dataRes = ReadMessageFromFile<LapTrajectory>(res.value());
    if (!dataRes)
      return nullptr;

    return std::make_shared<LapTrajectory>(dataRes.value());
  }

  std::expected<const std::shared_ptr<LapTrajectory>, SDK::GeneralError>
  TrackMapService::set(const std::shared_ptr<LapTrajectory> &trajectory) {
    return set(trajectory->track_layout_id(), trajectory);
  }

  std::expected<const std::shared_ptr<LapTrajectory>, SDK::GeneralError>
  TrackMapService::set(const std::string &id, const std::shared_ptr<LapTrajectory> &trajectory) {
    std::scoped_lock lock(stateMutex_);
    assert((!filePaths_.empty() && "Track map path not set"));
    auto path = filePaths_[0];
    auto filename = LapTrajectoryToFilename(trajectory.get());
    auto file = path / filename;
    L->info("Writing lap trajectory ({}) to: {}", trajectory->track_layout_id(), file.string());

    if (!WriteMessageToFile(*trajectory.get(), file)) {
      L->error("Failed to write {}", file.string());
      return std::unexpected(SDK::GeneralError(SDK::ErrorCode::General, "Unknown error occured"));
    }

    return trajectory;
  }


} // namespace IRacingTools::Shared::Services
