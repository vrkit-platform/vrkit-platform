#pragma once

#include "DXResources.h"
#include "RenderTarget.h"

namespace VRKit::Shared::Graphics {
    class DXWindowResources {
    public:
        DXWindowResources() = delete;
        DXWindowResources(DXWindowResources&&) = delete;
        DXWindowResources(const DXWindowResources&) = delete;

        DXWindowResources(HWND windowHandle, const std::shared_ptr<DXResources>& dxr);

        winrt::com_ptr<IDCompositionDevice>& dComp();
        winrt::com_ptr<IDCompositionTarget>& dCompTarget();
        winrt::com_ptr<IDCompositionVisual>& dCompVisual();

        void reset();
        bool prepare();

        std::shared_ptr<RenderTarget> renderTarget();

        winrt::com_ptr<ID3D11Texture2D>& backBuffer();
        winrt::com_ptr<IDXGISwapChain1>& swapChain();

        bool areResourcesValid();

        Size<UINT> resourceWindowSize();

        Size<UINT> currentWindowSize();

    private:
        winrt::com_ptr<IDCompositionDevice> dComp_;
        winrt::com_ptr<IDCompositionTarget> dCompTarget_;
        winrt::com_ptr<IDCompositionVisual> dCompVisual_;

        HWND windowHandle_;
        std::shared_ptr<DXResources> dxr_;

        std::shared_ptr<RenderTarget> renderTarget_{nullptr};
        winrt::com_ptr<ID3D11Texture2D> backBuffer_{nullptr};
        winrt::com_ptr<IDXGISwapChain1> swapChain_{nullptr};
        Size<UINT> resourceWindowSize_{0, 0};
    };
}
