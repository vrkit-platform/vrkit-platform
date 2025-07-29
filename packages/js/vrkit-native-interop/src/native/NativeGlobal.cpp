// ReSharper disable once CppParameterMayBeConstPtrOrRef

#include <VRKit/Shared/FileSystemHelpers.h>

#include "NativeGlobal.h"

#include <VRKit/Shared/Utils/Win32ProcessTool.h>
#include <VRKit/Shared/Logging/LoggingManager.h>

using namespace VRKit::App::Node;
using namespace VRKit::Models::RPC;
using namespace Napi;


namespace VRKit::App::Node {
    namespace {
        auto L = GetCategoryWithType<VRKit::App::Node::NativeGlobal>();
    }

    void NativeGlobal::destroy() {

    }

    NativeGlobal::NativeGlobal(token)  {
        WindowsSetHighPriorityProcess();
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
