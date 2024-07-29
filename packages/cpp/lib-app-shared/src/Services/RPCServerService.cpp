
#include <chrono>
#include <magic_enum.hpp>
#include <regex>

#include <IRacingTools/Shared/Logging/LoggingManager.h>
#include <IRacingTools/Shared/Services/RPCServerService.h>

namespace IRacingTools::Shared::Services {
  using namespace IRacingTools::SDK::Utils;
  using namespace IRacingTools::Shared::Logging;
  namespace {
    auto L = GetCategoryWithType<RPCServerService>();
  } // namespace


  RPCServerService::Route::Route(const std::string &matchExpression)
      : matchExpression_(matchExpression), matcher_{matchExpression_} {
  }

  bool RPCServerService::Route::accepts(const std::string &path) {
    return matchExpression_.empty() || std::regex_match(path, matcher_);
  }

  RPCServerService::RPCServerService(
      const std::shared_ptr<ServiceContainer> &serviceContainer)
      : RPCServerService(serviceContainer, Options{}) {
  }

  RPCServerService::RPCServerService(
      const std::shared_ptr<ServiceContainer> &serviceContainer,
      const Options &options)
      : Service(serviceContainer, PrettyType<RPCServerService>{}.name()),
        options_(options) {
  }


  std::expected<bool, SDK::GeneralError> RPCServerService::init() {
    std::scoped_lock lock(stateMutex_);

    return true;
  }


  std::expected<bool, GeneralError> RPCServerService::start() {

    {
      std::scoped_lock lock(stateMutex_);

      if (state() >= State::Starting)
        return state() == State::Running;

      setState(State::Starting);

      return true;
    }

    setState(State::Running);

    return true;
  }

  std::optional<SDK::GeneralError> RPCServerService::destroy() {
    std::scoped_lock lock(stateMutex_);
    if (state() >= State::Destroying)
      return std::nullopt;

    setState(State::Destroying);

    setState(State::Destroyed);
    return std::nullopt;
  }
  RPCServerService::Envelope
  RPCServerService::execute(const Envelope &messageIn) {
    auto requestPath = messageIn->request_path();

    auto messageOut = std::make_shared<Models::RPC::RPCMessage>();
    messageOut->set_id(messageIn->id());
    messageOut->set_request_path(messageIn->request_path());
    messageOut->set_kind(RPC::RPCMessage::KIND_RESPONSE);
    messageOut->set_status(RPC::RPCMessage::STATUS_IN_PROGRESS);

    for (auto &route: routes_) {
      if (route->accepts(requestPath)) {
        auto result = route->execute(messageIn, messageOut);
        if (result) {
          messageOut = result.value();
          messageOut->set_status(Models::RPC::RPCMessage::STATUS_DONE);
        } else {
          auto &err = result.error();
          messageOut->set_status(Models::RPC::RPCMessage::STATUS_ERROR);
          messageOut->set_error_details(err.what());
        }
        return messageOut;
      }
    }
    messageOut->set_status(Models::RPC::RPCMessage::STATUS_ERROR);
    messageOut->set_error_details("No matching route found");
    return messageOut;

  }

  void
  RPCServerService::addRoute(const std::shared_ptr<Route> &route) {
    std::scoped_lock lock(routesMutex_);
    routes_.push_back(route);
  }


} // namespace IRacingTools::Shared::Services
