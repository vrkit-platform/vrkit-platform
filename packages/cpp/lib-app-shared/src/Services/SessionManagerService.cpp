
#include <chrono>
#include <magic_enum.hpp>

#include <IRacingTools/SDK/Utils/Base64.h>
#include <IRacingTools/SDK/Utils/CollectionHelpers.h>

#include <IRacingTools/Shared/Logging/LoggingManager.h>
#include <IRacingTools/Shared/Services/Pipelines/PipelineExecutorRegistry.h>
#include <IRacingTools/Shared/Services/SessionManagerService.h>

#include "TelemetryDataFileProcessor.h"

#include <IRacingTools/Shared/Utils/SessionInfoHelpers.h>

namespace IRacingTools::Shared::Services {
  using namespace IRacingTools::SDK::Utils;
  using namespace IRacingTools::Shared::Logging;
  using namespace IRacingTools::Shared::Services::Pipelines;
  namespace {
    auto L = GetCategoryWithType<SessionManagerService>();
  } // namespace


  SessionManagerService::~SessionManagerService() {
    destroy();
  }

  SessionManagerService::SessionManagerService(
      const std::shared_ptr<ServiceContainer> &serviceContainer) : Service(serviceContainer, PrettyType<SessionManagerService>{}.name()) {
  }


  std::expected<bool, SDK::GeneralError> SessionManagerService::init() {
    std::scoped_lock lock(stateMutex_);

    return true;
  }

  std::expected<bool, GeneralError> SessionManagerService::start() {

    {
      std::scoped_lock lock(stateMutex_);

      if (state() >= State::Starting)
        return state() == State::Running;

      setState(State::Starting);
    }

    setState(State::Running);
    return true;
  }

  std::optional<SDK::GeneralError> SessionManagerService::destroy() {
    std::scoped_lock lock(stateMutex_);
    if (state() >= State::Destroying)
      return std::nullopt;

    setState(State::Destroying);

    setState(State::Destroyed);
    return std::nullopt;
  }

  bool SessionManagerService::exists(const std::string& sessionId) {
    return dataProviders_.contains(sessionId);
  }
  //
  // std::shared_ptr<SessionDataProvider> SessionManagerService::get(const std::string& sessionId) {
  //   return dataProviders_[sessionId];
  // }
  //
  // std::shared_ptr<SessionDataProvider> SessionManagerService::set(
  //   const std::string& sessionId,
  //   const std::shared_ptr<SessionDataProvider>& dataProvider
  // ) {
  //   auto currentDataProvider = dataProviders_[sessionId];
  //   dataProviders_[sessionId] = dataProvider;
  //   return currentDataProvider;
  // }
  //
  // std::shared_ptr<SessionDataProvider> SessionManagerService::remove(const std::string& sessionId) {
  //   return {};
  // }
  //
  // std::vector<std::shared_ptr<SessionDataProvider>> SessionManagerService::all() {
  //   return ValuesOf(dataProviders_);
  // }

  std::size_t SessionManagerService::size() {
    return dataProviders_.size();
  }
} // namespace IRacingTools::Shared::Services
