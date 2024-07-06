#pragma once

#include <IRacingTools/Shared/SharedAppLibPCH.h>

namespace IRacingTools::Shared::Graphics {
    enum class GraphicsPlatform : std::uint8_t {
        D3D11,
        D3D12,
        Vulkan,
    };
}
