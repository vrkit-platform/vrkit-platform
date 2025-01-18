#include <IRacingTools/Shared/Macros.h>
#include <IRacingTools/Shared/Graphics/DXWindowResources.h>

namespace IRacingTools::Shared::Graphics {

    DXWindowResources::DXWindowResources(HWND windowHandle, const std::shared_ptr<DXResources>& dxr) :
    windowHandle_(windowHandle),
    dxr_(dxr){
        check_hresult(DCompositionCreateDevice(dxr_->getDXGIDevice().get(), IID_PPV_ARGS(dComp_.put())));
        check_hresult(dComp_->CreateTargetForHwnd(windowHandle_, true, dCompTarget_.put()));
        check_hresult(dComp_->CreateVisual(dCompVisual_.put()));
    }

    winrt::com_ptr<IDCompositionDevice>& DXWindowResources::dComp() {
        return dComp_;
    }

    winrt::com_ptr<IDCompositionTarget>& DXWindowResources::dCompTarget() {
        return dCompTarget_;
    }

    winrt::com_ptr<IDCompositionVisual>& DXWindowResources::dCompVisual() {
        return dCompVisual_;
    }

    void DXWindowResources::reset() {
        resourceWindowSize_ = {0,0};
        renderTarget_= {};
        backBuffer_= {};
        swapChain_ = {};
    }

    bool DXWindowResources::prepare() {
        auto windowSize = currentWindowSize();
        if (areResourcesValid()) {
            spdlog::debug("Resources are already prepared & valid (width={},height={})", windowSize.width(), windowSize.height());
            return true;
        }

        resourceWindowSize_ = windowSize;
        renderTarget_= {};
        backBuffer_= {};
        swapChain_ = {};

        // Triple buffer solely for frame-pacing & fps variance between targets/consumers
        DXGI_SWAP_CHAIN_DESC1 swapChainDesc{
            .Width = windowSize.width(),
            .Height = windowSize.height(),
            .Format = DXGI_FORMAT_B8G8R8A8_UNORM,
            .SampleDesc = {1, 0},
            .BufferUsage = DXGI_USAGE_RENDER_TARGET_OUTPUT,
            .BufferCount = 3,
            .SwapEffect = DXGI_SWAP_EFFECT_FLIP_DISCARD,
            .AlphaMode = DXGI_ALPHA_MODE_PREMULTIPLIED,
            // .Flags = DXGI_SWAP_CHAIN_FLAG_FOREGROUND_LAYER,
        };

        DXGI_SWAP_CHAIN_FULLSCREEN_DESC swapChainFSDesc = {};
        swapChainFSDesc.Windowed = true;

        check_hresult(
            dxr_->getDXGIFactory()->CreateSwapChainForComposition(
                dxr_->getDXGIDevice().get(),
                &swapChainDesc,
                nullptr,
                swapChain_.put()
            )
        );
        check_hresult(dCompVisual_->SetContent(swapChain_.get()));
        check_hresult(dCompTarget_->SetRoot(dCompVisual_.get()));
        check_hresult(dComp_->Commit());

        check_hresult(swapChain_->GetBuffer(0, IID_PPV_ARGS(backBuffer_.put())));

        if (renderTarget_) {
            renderTarget_->setD3DTexture(backBuffer_);
        }
        else {
            renderTarget_ = RenderTarget::Create(dxr_, backBuffer_);
        }
        return true;
    }

    std::shared_ptr<RenderTarget> DXWindowResources::renderTarget() {
        return renderTarget_;
    }

    winrt::com_ptr<ID3D11Texture2D>& DXWindowResources::backBuffer() {
        return backBuffer_;
    }

    winrt::com_ptr<IDXGISwapChain1>& DXWindowResources::swapChain() {
        return swapChain_;
    }

    bool DXWindowResources::areResourcesValid() {
        return renderTarget_ && resourceWindowSize_ == currentWindowSize();
    }

    Size<UINT> DXWindowResources::resourceWindowSize() {
        return resourceWindowSize_;
    }

    Size<UINT> DXWindowResources::currentWindowSize() {
        RECT rect;

        if (!windowHandle_ || !GetWindowRect(windowHandle_, &rect))
            return {};
        return {static_cast<UINT>(rect.right - rect.left), static_cast<UINT>(rect.bottom - rect.top)};


    }
}
