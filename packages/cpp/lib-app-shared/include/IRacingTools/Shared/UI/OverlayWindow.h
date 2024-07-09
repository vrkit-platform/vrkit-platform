//
// Created by jglanz on 5/1/2024.
//

#pragma once

#include "../SharedAppLibPCH.h"

#include <IRacingTools/SDK/Utils/Literals.h>
#include <IRacingTools/Shared/UI/BaseWindow.h>
#include <IRacingTools/Shared/Graphics/RenderTarget.h>
#include <IRacingTools/Shared/Graphics/TrackMapWidget.h>
#include <IRacingTools/Shared/Graphics/DXResources.h>
#include <IRacingTools/Shared/Graphics/DXWindowResources.h>

namespace IRacingTools::Shared::UI {
    template <typename WindowClazz>
    class OverlayWindow : public BaseWindow<WindowClazz> {
        using Base = BaseWindow<WindowClazz>;

        std::mutex resourceMutex_{};
        static constexpr UINT RenderTimerId = 1;
        static constexpr UINT FPS_60 = 1000 / 60;

        std::optional<typename SDK::Utils::EventEmitter<WindowClazz*, PixelSize, PixelSize>::UnsubscribeFn>
        onResizeUnsubscribe_{};

    protected:
        std::shared_ptr<Graphics::DXResources> dxr_{nullptr};
        std::shared_ptr<Graphics::DXWindowResources> dxwr_{nullptr};

    public:
        virtual WNDCLASSEXW getWindowClassOptions() override {
            auto wc = Base::getWindowClassOptions();
            // fill in the struct with the needed information
            wc.cbSize = sizeof(WNDCLASSEXW);
            wc.style = CS_HREDRAW | CS_VREDRAW | CS_OWNDC;
            wc.hCursor = LoadCursor(nullptr, IDC_CROSS);
            wc.hbrBackground = nullptr; //(HBRUSH) COLOR_WINDOW;

            return wc;
        }

        virtual Window::CreateOptions getCreateOptions() override {
            auto options = Base::getCreateOptions();
            options.name = L"OverlayWindow";
            options.width = 400;
            options.height = 400;

            // | WS_POPUP removes the border
            options.style |= WS_POPUP;

            // | WS_EX_TRANSPARENT  - when added to WS_EX makes mouse events pass-through
            options.extendedStyle |= WS_EX_TOPMOST | WS_EX_LAYERED;
            return options;
        }

        OverlayWindow(OverlayWindow&&) = delete;

        OverlayWindow(const OverlayWindow&) = delete;

        OverlayWindow() : BaseWindow<WindowClazz>() {}


        virtual ~OverlayWindow() override {
            if (onResizeUnsubscribe_) {
                onResizeUnsubscribe_.value()();
            }
        }

        virtual bool isReady() override {
            // std::scoped_lock lock(resourceMutex_);
            return Base::isCreated() && dxr_;
        }

        virtual void renderWindow() {
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

            dxwr_->swapChain()->Present(1, 0);
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
                    renderWindow();
                    break;
                default:
                    break;
                }
                return 0;
            }
            default:
                return Base::handleMessage(messageType, wParam, lParam);
            }
        }

        virtual void render(const std::shared_ptr<Graphics::RenderTarget>& target) = 0;

    public:
        virtual bool createResources() override {
            Base::show();

            dxr_ = std::make_shared<Graphics::DXResources>();
            dxwr_ = std::make_shared<Graphics::DXWindowResources>(Base::windowHandle(), dxr_);
            onResizeUnsubscribe_ = Base::events.onResize.subscribe(
                [&](auto _win, auto _newSize, auto _oldSize) {
                    dxwr_->reset();
                }
            );

            check_hresult(
                SetTimer(
                    Base::windowHandle(),
                    RenderTimerId,
                    // timer identifier
                    FPS_60,
                    nullptr
                )
            );

            return Base::createResources();
        }
    };
};
