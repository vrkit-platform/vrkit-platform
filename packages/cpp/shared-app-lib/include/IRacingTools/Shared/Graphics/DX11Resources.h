//
// Created by jglanz on 1/7/2024.
//

#pragma once

#include "DXResources.h"

#include <functional>
#include <optional>

namespace IRacingTools::Shared::Graphics {


using DX11DeviceResources = DXDeviceResources<DXVersion::DX11>;

class DX11WindowResources : public DX11DeviceResources {
public:
    explicit DX11WindowResources(HWND windowHandle);

    ~DX11WindowResources() override = default;

    HRESULT createDeviceIndependentResources();
    HRESULT createD3DResources();
    HRESULT createD3DSizedResources();
    HRESULT createD2DResources();

    Size updateSize(std::optional<Size> newSize = std::nullopt);
protected:
    using DXDisposer = std::function<void()>;
    HWND winHandle_;
};

} // namespace IRacingTools::Shared::Graphics
