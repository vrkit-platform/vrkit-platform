
#include <IRacingTools/Shared/Services/Service.h>

namespace IRacingTools::Shared::Services {
  Service::~Service() {
    {
        std::scoped_lock lock(stateMutex_);
        destroy();
    }
    assert(state() != State::Running);
  }

  std::expected<bool, SDK::GeneralError> Service::init() {
    std::scoped_lock lock(stateMutex_);
    assert(state() == State::Created);
    spdlog::debug("Service::init default");

    return true;
  }

  std::expected<bool, SDK::GeneralError> Service::start() {
    std::scoped_lock lock(stateMutex_);
    spdlog::debug("Service::start default");
    setState(State::Running);

    return true;
  }


  std::optional<SDK::GeneralError> Service::destroy() {
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

  const std::string_view &Service::name() const {
    return name_;
  }

  Service::Service(const std::string_view &name) : name_(name) {
  }
}// namespace IRacingTools::Shared::Services
