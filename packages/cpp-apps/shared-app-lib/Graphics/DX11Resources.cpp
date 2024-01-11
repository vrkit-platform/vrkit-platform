//
// Created by jglanz on 1/7/2024.
//

#include <IRacingTools/Shared/Graphics/DX11Resources.h>
#include <IRacingTools/Shared/Macros.h>
#include <cassert>

namespace IRacingTools::Shared::Graphics {

DX11WindowResources::DX11WindowResources(HWND windowHandle) : winHandle_(windowHandle) {
    createD3DResources();
    createDeviceIndependentResources();
}
HRESULT DX11WindowResources::createDeviceIndependentResources() {
    createD2DFactory(D2D1_FACTORY_TYPE_SINGLE_THREADED);

    AOK(CoCreateInstance(CLSID_WICImagingFactory, nullptr, CLSCTX_INPROC_SERVER, IID_IWICImagingFactory, &wicFactory_));
    return S_OK;
}
HRESULT DX11WindowResources::createD3DResources() {
    HRESULT hr = S_OK;

    // create a struct to hold information about the swap chain
    DXGI_SWAP_CHAIN_DESC swapChainDesc;
    ZeroMemory(&swapChainDesc, sizeof(DXGI_SWAP_CHAIN_DESC));

    auto [width, height] = updateSize();

    swapChainDesc.OutputWindow = winHandle_; // the window to be used
    swapChainDesc.BufferDesc.Width = width;
    swapChainDesc.BufferDesc.Height = height;
    swapChainDesc.BufferDesc.Format = DXGI_FORMAT_B8G8R8A8_UNORM;
    swapChainDesc.SampleDesc.Count = 1;
    swapChainDesc.SampleDesc.Quality = 0;
    swapChainDesc.BufferDesc.RefreshRate.Numerator = 60;
    swapChainDesc.BufferDesc.RefreshRate.Denominator = 1;
    swapChainDesc.BufferCount = 1; // one back buffer

    swapChainDesc.BufferUsage = DXGI_USAGE_RENDER_TARGET_OUTPUT; // how swap chain is to be used

    // swapChainDesc.SampleDesc.Count = 4; // how many multisamples
    swapChainDesc.Windowed = TRUE; // windowed/full-screen mode

    // create a device, device context and swap chain using the information in the
    // scd struct
    UINT creationFlags = D3D11_CREATE_DEVICE_BGRA_SUPPORT;
#if defined(_DEBUG)
    // If the project is in a debug build, enable the debug layer.
    creationFlags |= D3D11_CREATE_DEVICE_DEBUG;
#endif

    hr = D3D11CreateDeviceAndSwapChain(
        nullptr,
        D3D_DRIVER_TYPE_HARDWARE,
        nullptr,
        creationFlags,
        nullptr,
        0,
        D3D11_SDK_VERSION,
        &swapChainDesc,
        &swapChain_,
        &dev_,
        nullptr,
        &devContext_
    );

    AssertMsg(SUCCEEDED(hr), "Failed to create device & swap chain");

    D3D11_RASTERIZER_DESC rsDesc;
    rsDesc.AntialiasedLineEnable = FALSE;
    rsDesc.CullMode = D3D11_CULL_NONE;
    rsDesc.DepthBias = 0;
    rsDesc.DepthBiasClamp = 0;
    rsDesc.DepthClipEnable = TRUE;
    rsDesc.FillMode = D3D11_FILL_SOLID;
    rsDesc.FrontCounterClockwise = FALSE; // Must be FALSE for 10on9
    rsDesc.MultisampleEnable = FALSE;
    rsDesc.ScissorEnable = FALSE;
    rsDesc.SlopeScaledDepthBias = 0;

    hr = dev_->CreateRasterizerState(&rsDesc, &rasterizerState_);
    AssertMsg(SUCCEEDED(hr), "Failed to create rasterizer state");

    devContext_->RSSetState(rasterizerState_.Get());
    devContext_->IASetPrimitiveTopology(D3D11_PRIMITIVE_TOPOLOGY_TRIANGLELIST);

    return hr;
}


Size DX11WindowResources::updateSize(std::optional<Size> newSize) {
    if (newSize) {
        size_ = newSize.value();

    } else {
        // fill the swap chain description struct
        RECT rcClient;
        GetClientRect(winHandle_, &rcClient);

        UINT width = abs(rcClient.right - rcClient.left);
        UINT height = abs(rcClient.bottom - rcClient.top);

        size_ = {width, height};
    }
    return size_;
}
HRESULT DX11WindowResources::createD3DSizedResources() {
    return S_OK;
}

HRESULT DX11WindowResources::createD2DResources() {
    return S_OK;
}

} // namespace IRacingTools::Shared::Graphics