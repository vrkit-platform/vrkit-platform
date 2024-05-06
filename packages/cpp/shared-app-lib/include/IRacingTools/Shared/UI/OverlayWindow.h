//
// Created by jglanz on 5/1/2024.
//

#pragma once

#include "../SharedAppLibPCH.h"

#include <IRacingTools/Shared/UI/BaseWindow.h>
#include <IRacingTools/Shared/Graphics/RenderTarget.h>
#include <IRacingTools/Shared/Graphics/TrackMapWidget.h>
#include <IRacingTools/Shared/Graphics/DXResources.h>

namespace IRacingTools::Shared::UI {
    template <typename WindowClazz>
    class OverlayWindow : public BaseWindow<WindowClazz> {
using Base = BaseWindow<WindowClazz>;

        std::mutex resourceMutex_{};

    protected:
        winrt::com_ptr<IDCompositionDevice> dComp_{};
        winrt::com_ptr<IDCompositionTarget> dCompTarget_{};
        winrt::com_ptr<IDCompositionVisual> dCompVisual_{};

        std::shared_ptr<Graphics::DXResources> dxr_{nullptr};
        std::shared_ptr<Graphics::RenderTarget> renderTarget_{nullptr};

        winrt::com_ptr<ID3D11Texture2D> backBuffer_{nullptr};
        winrt::com_ptr<IDXGISwapChain1> swapChain_{nullptr};
        Size<UINT> swapChainDim_{0, 0};

    public:
        virtual void configureWindowClass(WNDCLASSEX& wc) override {
            // fill in the struct with the needed information
            wc.cbSize = sizeof(WNDCLASSEX);
            wc.style = CS_HREDRAW | CS_VREDRAW | CS_OWNDC;
            wc.hCursor = LoadCursor(nullptr, IDC_CROSS);
            wc.hbrBackground = nullptr; //(HBRUSH) COLOR_WINDOW;
        }

        virtual WindowClazz* create(
            PCWSTR name,
            DWORD style = 0,
            DWORD extendedStyle = 0,
            int x = CW_USEDEFAULT,
            int y = CW_USEDEFAULT,
            int width = 400,
            int height = 400,
            HWND parent = nullptr,
            HMENU menu = nullptr
        ) override {
            std::scoped_lock lock(resourceMutex_);
            auto win = Base::create(
                name,
                style | WS_POPUP,
                // | WS_EX_TRANSPARENT  - when added to WS_EX makes mouse events pass-through
                extendedStyle | WS_EX_TOPMOST | WS_EX_LAYERED,
                x,
                y,
                width,
                height,
                parent,
                menu
            );

            if (!win) {
                return win;
            }

            Base::show();

            dxr_ = std::make_shared<Graphics::DXResources>();
            initializeResources();
            initializeSwapChain();

            return win;
        }

        OverlayWindow(OverlayWindow&&) = delete;

        OverlayWindow(const OverlayWindow&) = delete;

        OverlayWindow() : BaseWindow<WindowClazz>() {


            // MARGINS Margin = {-1, -1, -1, -1};
            // DwmExtendFrameIntoClientArea(window_, &Margin);


        }


        virtual ~OverlayWindow() {

        }

        virtual bool isReady() override {
            // std::scoped_lock lock(resourceMutex_);
            return Base::isCreated() && dxr_ && renderTarget_;
        }


        virtual LRESULT handleMessage(UINT messageType, WPARAM wParam, LPARAM lParam) override {
            switch (messageType)
            {
            case WM_DESTROY:
                PostQuitMessage(0);
                return 0;

            // case WM_PAINT:
            // {
            //     render();
            //     //PAINTSTRUCT ps;
            //     // render();
            //     // HDC hdc = BeginPaint(Base::windowHandle(), &ps);
            //     //FillRect(hdc, &ps.rcPaint, (HBRUSH) (COLOR_WINDOW+1));
            //     // EndPaint(m_hwnd, &ps);
            // }
                //return 0;

            default:
                renderWindow();
                //return DefWindowProc(Base::windowHandle(), messageType, wParam, lParam);
            }
            return TRUE;
        }

        virtual void renderWindow() {
            {
                std::scoped_lock lock(resourceMutex_);
                if (!dxr_ || !renderTarget_)
                    return;
            }

            auto dim = Base::getSize();

            D3D11_VIEWPORT viewport = {};
            viewport.TopLeftX = 0;
            viewport.TopLeftY = 0;
            viewport.Width = static_cast<float>(dim.width());
            viewport.Height = static_cast<float>(dim.height());
            viewport.MinDepth = 0.0f;
            viewport.MaxDepth = 1.0f;


            // constexpr float clearColor[] = {1.0f, 1.0f, 1.0f, 1.0f};
            constexpr float clearColor[] = {1.0f, 1.0f, 1.0f, 1.0f};

            auto ctx = dxr_->getDXImmediateContext();
            auto rtv = renderTarget_->d3d().rtv();


            ctx->ClearRenderTargetView(rtv, DirectX::Colors::Transparent);

            // float color[4] = {0.0f, 0.0f, 0.0f, 0.0f};
            // ctx->ClearRenderTargetView(rtv, color);
            // ctx->ClearRenderTargetView(
            //     rtv, clearColor
            // );

            ctx->RSSetViewports(1, &viewport);

            ctx->OMSetRenderTargets(1, &rtv, nullptr);

            render(renderTarget_);

            swapChain_->Present(1, 0);
        }

    protected:
        virtual void render(const std::shared_ptr<Graphics::RenderTarget>& target) = 0;

        void initializeResources() {
            check_hresult(DCompositionCreateDevice(dxr_->getDXGIDevice().get(), IID_PPV_ARGS(dComp_.put())));
            check_hresult(dComp_->CreateTargetForHwnd(Base::windowHandle(), true, dCompTarget_.put()));
            check_hresult(dComp_->CreateVisual(dCompVisual_.put()));
        }

        void initializeSwapChain() {
            auto dim = Base::getSize();
            if (dim == swapChainDim_) {
                spdlog::debug("Dimensions unchanged {},{}", dim.width(), dim.height());
                return;
            }

            swapChainDim_ = dim;

            // BufferCount = 3: triple-buffer to avoid stalls
            //
            // If the previous frame is still being Present()ed and we
            // only have two frames in the buffer, Present()ing the new
            // frame will stall until that has completed.
            //
            // We could avoid this by using frame pacing, but we want to decouple the
            // frame rates - if you're on a 30hz or 60hz monitor, OpenKneeboard should
            // still be able to push VR frames at 90hz
            //
            // So, triple-buffer
            DXGI_SWAP_CHAIN_DESC1 swapChainDesc{
                .Width = dim.width(),
                .Height = dim.height(),
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
                renderTarget_ = Graphics::RenderTarget::Create(dxr_, backBuffer_);
            }
            //winrt::check_hresult(dxr_->getDXDevice()->CreateRenderTargetView(backBuffer_.get(),nullptr, renderTargetView_.put()));
        }

    };
};
