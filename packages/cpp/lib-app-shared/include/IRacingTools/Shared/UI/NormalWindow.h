//
// Created by jglanz on 5/1/2024.
//

#pragma once

#include "../SharedAppLibPCH.h"

#include <IRacingTools/SDK/Utils/Literals.h>
#include <IRacingTools/Shared/UI/BaseWindow.h>
#include <IRacingTools/Shared/Graphics/RenderTarget.h>
#include <IRacingTools/Shared/Graphics/DXResources.h>
#include <IRacingTools/Shared/Graphics/DXWindowResources.h>

namespace IRacingTools::Shared::UI {
    template <typename WindowClazz>
    class NormalWindow : public BaseWindow<WindowClazz> {
        using Base = BaseWindow<WindowClazz>;

        std::mutex resourceMutex_{};
        static constexpr UINT RenderTimerId = 1;
        static constexpr UINT FPS_60 = 1000 / 60;

    protected:
        winrt::com_ptr<IDCompositionDevice> dComp_{};
        winrt::com_ptr<IDCompositionTarget> dCompTarget_{};
        winrt::com_ptr<IDCompositionVisual> dCompVisual_{};

        std::shared_ptr<Graphics::DXResources> dxr_{nullptr};
        std::shared_ptr<Graphics::DXWindowResources> dxwr_{nullptr};

        std::optional<typename  SDK::Utils::EventEmitter<WindowClazz*,PixelSize, PixelSize>::UnsubscribeFn> onResizeUnsubscribe_{};

        std::shared_ptr<Graphics::DXResources>& dxr() {
            return dxr_;
        }

        std::shared_ptr<Graphics::DXWindowResources>& dxwr() {
            return dxwr_;
        }
    public:

        virtual WNDCLASSEX getWindowClassOptions() override {
            auto wc = Base::getWindowClassOptions();

            wc.cbSize = sizeof(WNDCLASSEX);
            wc.style = CS_HREDRAW | CS_VREDRAW;
            wc.hCursor = LoadCursor(nullptr, IDC_ARROW);
            wc.hbrBackground = reinterpret_cast<HBRUSH>(COLOR_WINDOW);

            return wc;
        }



        virtual Window::CreateOptions getCreateOptions() override {
            auto options = Base::getCreateOptions();
            options.name = L"NormalWindow";
            options.width = 400;
            options.height = 400;

            // | WS_POPUP removes the border
            options.style |= WS_OVERLAPPEDWINDOW;

            return options;
        }



        NormalWindow(NormalWindow&&) = delete;

        NormalWindow(const NormalWindow&) = delete;

        NormalWindow() : BaseWindow<WindowClazz>() {
            // MARGINS Margin = {-1, -1, -1, -1};
            // DwmExtendFrameIntoClientArea(window_, &Margin);
        }


        virtual ~NormalWindow() {}

        virtual bool createResources() override {
            Base::show();

            dxr_ = std::make_shared<Graphics::DXResources>();
            dxwr_ = std::make_shared<Graphics::DXWindowResources>(Base::windowHandle(), dxr_);
            onResizeUnsubscribe_ = Base::events.onResize.subscribe([&] (auto _win, auto _newSize, auto _oldSize) {
                dxwr_->reset();
            });

            check_hresult(
            SetTimer(
                Base::windowHandle(),
                RenderTimerId,
                // timer identifier
                FPS_60,
                nullptr
            )
        );
            return true;
        }


        virtual bool isReady() override {
            return Base::isCreated() && dxr_ && dxwr_;
        }


        virtual void paint() {
            {
                std::scoped_lock lock(resourceMutex_);
                if (!dxr_ || !dxwr_ || !dxwr_->prepare())
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

            auto renderTarget = dxwr_->renderTarget();
            auto swapChain = dxwr_->swapChain();
            auto ctx = dxr_->getDXImmediateContext();
            auto rtv = renderTarget->d3d().rtv();


            ctx->ClearRenderTargetView(rtv, DirectX::Colors::Transparent);

            // float color[4] = {0.0f, 0.0f, 0.0f, 0.0f};
            // ctx->ClearRenderTargetView(rtv, color);
            // ctx->ClearRenderTargetView(
            //     rtv, clearColor
            // );

            ctx->RSSetViewports(1, &viewport);

            ctx->OMSetRenderTargets(1, &rtv, nullptr);

            render(renderTarget);

            swapChain->Present(1, 0);
        }

    protected:

        virtual LRESULT handleMessage(UINT messageType, WPARAM wParam, LPARAM lParam) override {
            switch (messageType) {
            case WM_DESTROY:
                KillTimer(Base::windowHandle(), RenderTimerId);
                PostQuitMessage(0);

                return 0;
            case WM_TIMER: {
                switch (wParam) {
                case RenderTimerId:
                    paint();
                    break;
                }
                return 0;
            }

            case WM_PAINT:
                PAINTSTRUCT ps;
                BeginPaint(Base::windowHandle(), &ps);
                paint();
                EndPaint(Base::windowHandle(), &ps);
                return 0;
            default:
                return DefWindowProc(Base::windowHandle(), messageType, wParam, lParam);
            }
        }

        virtual void render(const std::shared_ptr<Graphics::RenderTarget>& target) = 0;

    };
};
