#pragma once

#include <VRKit/Shared/SharedAppLibPCH.h>

namespace VRKit::Shared::Graphics {
    enum class GraphicsPlatform : std::uint8_t {
        D3D11,
        D3D12,
        Vulkan,
    };
}
