
#include <VRKit/Shared/Services/Service.h>

namespace VRKit::Shared::Services {
  Service::~Service() {
    {
        std::scoped_lock lock(stateMutex_);
        destroy();
    }
    assert(state() != State::Running);
  }

  std::expected<bool, IRacingSDK::GeneralError> Service::init() {
    std::scoped_lock lock(stateMutex_);
    assert(state() == State::Created);
    spdlog::debug("Service::init default");

    return true;
  }

  std::expected<bool, IRacingSDK::GeneralError> Service::start() {
    std::scoped_lock lock(stateMutex_);
    spdlog::debug("Service::start default");
    setState(State::Running);

    return true;
  }


  std::optional<IRacingSDK::GeneralError> Service::destroy() {
    std::scoped_lock lock(stateMutex_);
    spdlog::debug("Service::destroy default");
    if (state() >= State::Destroyed)
        return std::nullopt;    

    setState(State::Destroyed);
    return std::nullopt;
  }

  Service::State Service::state() const {
    return state_.load();
  }

  bool Service::isRunning() {
    return state() == State::Running;
  }

  Service::State Service::setState(State newState) {
    std::scoped_lock lock(stateMutex_);
    auto oldState = state_.exchange(newState);
    ServiceStateTransitionCheck(newState, oldState);
    return oldState;
  }

  
  std::string Service::name() const {
    return name_;
  }

  std::shared_ptr<ServiceContainer> Service::getContainer() const {
    return serviceContainer_;
  }

  Service::Service(const std::shared_ptr<ServiceContainer>& serviceContainer, const std::string &name) :
    serviceContainer_(serviceContainer), name_(name) {
  }
}// namespace VRKit::Shared::Services
