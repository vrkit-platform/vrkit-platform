// ReSharper disable once CppParameterMayBeConstPtrOrRef

#include <IRacingTools/Shared/FileSystemHelpers.h>

#include "NativeGlobal.h"

#include <IRacingTools/Shared/Utils/Win32ProcessTool.h>
#include <IRacingTools/Shared/Logging/LoggingManager.h>

using namespace IRacingTools::App::Node;
using namespace IRacingTools::Models::RPC;
using namespace Napi;


namespace IRacingTools::App::Node {
    namespace {
        auto L = GetCategoryWithType<IRacingTools::App::Node::NativeGlobal>();
    }

    void NativeGlobal::destroy() {
        manager_->destroy();
    }

    NativeGlobal::NativeGlobal(token) : manager_(std::make_shared<NativeSystemManager>()) {
        WindowsSetHighPriorityProcess();

        manager_->init();
        manager_->start();
#if 0
    // Testing only
    auto pingRouteExecutor = [&](
        const std::shared_ptr<Messages::Ping> &request,
        const std::shared_ptr<RPC::Envelope> &envelope) -> std::expected<
      std::shared_ptr<Messages::Pong>, GeneralError> {
      L->info("Processing request path for ping: {}", envelope->request_path());
      auto response = std::make_shared<Messages::Pong>();
      response->set_ping_count(request->count());
      return response;
    };

    auto pingRoute = RPCServerService::TypedRoute<
      Messages::Ping, Messages::Pong>::Create(pingRouteExecutor, "/ping");

    auto rpcService = serviceManager()->getService<RPCServerService>();
    rpcService->addRoute(pingRoute);
#endif
    }

    void VRKitShutdown() {
        L->info("Shutting down NativeGlobal");
        NativeGlobal::GetPtr()->destroy();
        L->info("Shutdown completed NativeGlobal");
    }

    /**
     * @brief per-context reference to global
     */
    NativeSystemAddon::NativeSystemAddon() : system_(NativeGlobal::GetPtr()) {
    }

    Napi::FunctionReference& NativeSystemAddon::clientCtor() {
        return clientCtor_;
    }

    Napi::FunctionReference& NativeSystemAddon::sessionPlayerCtor() {
        return sessionPlayerCtor_;
    }

    Napi::FunctionReference& NativeSystemAddon::overlayManagerCtor() {
        return overlayManagerCtor_;
    }

    Napi::FunctionReference& NativeSystemAddon::sessionDataVariableCtor() {
        return sessionDataVariableCtor_;
    }
}
