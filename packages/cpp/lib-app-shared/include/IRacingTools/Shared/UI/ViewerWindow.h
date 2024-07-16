//
// Created by jglanz on 5/1/2024.
//

#pragma once

#include "../SharedAppLibPCH.h"

#include <IRacingTools/SDK/Utils/Literals.h>
#include <IRacingTools/Shared/Graphics/RenderTarget.h>
#include <IRacingTools/Shared/Graphics/DXResources.h>
#include <IRacingTools/Shared/Graphics/Types.h>
#include <IRacingTools/Shared/SHM/SHM.h>
#include <IRacingTools/Shared/SHM/SHMDX11.h>

#include <IRacingTools/Shared/UI/NormalWindow.h>
#include <IRacingTools/Shared/UI/ViewerSettings.h>
#include <IRacingTools/Shared/Logging/LoggingManager.h>

#include "ViewerWindowDX11Renderer.h"
#include "ViewerWindowRenderer.h"


namespace IRacingTools::Shared::UI {
    template <Graphics::GraphicsPlatform GP>
    class ViewerWindow : public NormalWindow<ViewerWindow<GP>> {
        inline static auto L = Logging::GetCategoryWithType<ViewerWindow>();
        using Base = BaseWindow<ViewerWindow>;
        using Normal = NormalWindow<ViewerWindow>;

        std::atomic_bool disposed_{false};
        std::atomic_bool targetResCreated_{false};
        Size<UINT> renderSize_{0, 0};
        std::size_t renderCacheKey_{0};

        winrt::com_ptr<ID3D11Texture2D> rendererTexture_{};
        winrt::handle rendererTextureHandle_{};
        PixelSize rendererTextureSize_{};
        winrt::com_ptr<ID3D11Fence> fence_{};
        winrt::handle fenceHandle_{};
        uint64_t fenceValue_{};


        std::shared_ptr<Renderer> renderer_{nullptr};
        std::mutex renderMutex_{};

        winrt::com_ptr<ID2D1SolidColorBrush> brushRed_{};

        ViewerSettings settings_{};

        std::optional<typename SDK::Utils::EventEmitter<ViewerWindow*, PixelSize, PixelSize>::UnsubscribeFn>
        onResizeUnsubscribe_{};

    public:
        static constexpr PCWSTR ClassName() {
            return L"SHM-Viewer Window";
        }

        void resetTargetResources() {
            {
                std::scoped_lock lock(renderMutex_);

                targetResCreated_ = false;
                renderSize_ = {};
                brushRed_ = {};
                rendererTexture_ = {};

                Normal::dxwr()->reset();
            }
        }

        virtual bool createResources() override {
            Normal::createResources();
            auto& dxr = Normal::dxr();
            auto dev = dxr->getDXDevice();

            check_hresult(dev->CreateFence(fenceValue_, D3D11_FENCE_FLAG_SHARED, IID_PPV_ARGS(fence_.put())));
            check_hresult(fence_->CreateSharedHandle(nullptr, GENERIC_ALL, nullptr, fenceHandle_.put()));

            if (!dxr) IRT_LOG_AND_FATAL("DXR is invalid");

            if (!renderer_) {
                if constexpr (GP == Graphics::GraphicsPlatform::D3D11) {
                    renderer_ = std::make_shared<D3D11Renderer>(dxr->getDXDevice());
                    //cachedReader_ = std::make_shared<SHM::DX11::SHMDX11CachedReader>(SHM::ConsumerKind::Viewer);
                }
                else {
                    IRT_LOG_AND_FATAL("Only D3D11 is currently supported");
                }
            }

            if constexpr (GP == Graphics::GraphicsPlatform::D3D11) {
                renderer_->initialize(SHMSwapchainLength);
                // dynamic_pointer_cast<SHM::DX11::SHMDX11CachedReader>(cachedReader_)->initializeCache(Normal::dxr_->getDXDevice().get(), SHMSwapchainLength);
            }
            else {
                IRT_LOG_AND_FATAL("Only D3D11 is currently supported");
            }

            onResizeUnsubscribe_ = Base::events.onResize.subscribe(
                [&](auto _win, auto _newSize, auto _oldSize) {
                    resetTargetResources();
                }
            );
            return !!renderer_;
        }

    protected:
        PixelRect getDestRect(const Size<uint32_t> imageSize, const float scale) {
            const auto clientSize = Base::getSize();

            const auto renderWidth = static_cast<uint32_t>(static_cast<float>(imageSize.width()) * scale);
            const auto renderHeight = static_cast<uint32_t>(static_cast<float>(imageSize.height()) * scale);

            unsigned int renderLeft = 0;
            unsigned int renderTop = 0;

            switch (settings_.alignment) {
            case ViewerAlignment::TopLeft:
                // Topleft is default
                break;
            case ViewerAlignment::Top:
                renderLeft = (clientSize.width() - renderWidth) / 2;
                break;
            case ViewerAlignment::TopRight:
                renderLeft = (clientSize.width() - renderWidth);
                break;
            case ViewerAlignment::Left:
                renderTop = (clientSize.height() - renderHeight) / 2;
                break;
            case ViewerAlignment::Center:
                renderTop = (clientSize.height() - renderHeight) / 2;
                renderLeft = (clientSize.width() - renderWidth) / 2;
                break;
            case ViewerAlignment::Right:
                renderTop = (clientSize.height() - renderHeight) / 2;
                renderLeft = (clientSize.width() - renderWidth);
                break;
            case ViewerAlignment::BottomLeft:
                renderTop = (clientSize.height() - renderHeight);
                break;
            case ViewerAlignment::Bottom:
                renderTop = (clientSize.height() - renderHeight);
                renderLeft = (clientSize.width() - renderWidth) / 2;
                break;
            case ViewerAlignment::BottomRight:
                renderTop = (clientSize.height() - renderHeight);
                renderLeft = (clientSize.width() - renderWidth);
                break;
            }

            return {{renderLeft, renderTop}, {renderWidth, renderHeight}};
        }


        void createTargetResources(const std::shared_ptr<Graphics::RenderTarget>& target) {
            std::scoped_lock lock(renderMutex_);
            const auto clientSize = Base::getSize();

            if (clientSize == renderSize_ && targetResCreated_ && brushRed_)
                return;

            targetResCreated_ = false;
            renderSize_ = clientSize;
            brushRed_ = {};
            rendererTexture_ = {};

            auto& dxr = Normal::dxr_;
            auto d2dFactory = dxr->getD2DFactory();
            auto dxDevice = dxr->getDXDevice();
            auto d2dTarget = target->d2d();

            if (!brushRed_)
                winrt::check_hresult(
                    d2dTarget->CreateSolidColorBrush(D2D1::ColorF(D2D1::ColorF::Red), brushRed_.put())
                );

            // auto winSize = renderSize_;

            if (clientSize.width() > rendererTextureSize_.width() || clientSize.height() > rendererTextureSize_.
                height()) {
                rendererTexture_ = nullptr;
                D3D11_TEXTURE2D_DESC desc{
                    .Width = clientSize.width(),
                    .Height = clientSize.height(),
                    .MipLevels = 1,
                    .ArraySize = 1,
                    .Format = DXGI_FORMAT_B8G8R8A8_UNORM,
                    .SampleDesc = {1, 0},
                    .BindFlags = D3D11_BIND_SHADER_RESOURCE | D3D11_BIND_RENDER_TARGET,
                    .MiscFlags = D3D11_RESOURCE_MISC_SHARED | D3D11_RESOURCE_MISC_SHARED_NTHANDLE,
                };
                check_hresult(dxDevice->CreateTexture2D(&desc, nullptr, rendererTexture_.put()));
                rendererTextureHandle_ = {};
                check_hresult(
                    rendererTexture_.as<IDXGIResource1>()->CreateSharedHandle(
                        nullptr,
                        GENERIC_ALL,
                        nullptr,
                        rendererTextureHandle_.put()
                    )
                );
                rendererTextureSize_ = clientSize;
            }

            targetResCreated_ = true;
        }

        virtual void render(const std::shared_ptr<Graphics::RenderTarget>& target) override {
            auto targetSize = target->getDimensions();
            auto sizeChanged = renderSize_ != targetSize;
            if (!targetResCreated_ || sizeChanged) {
                createTargetResources(target);
                renderSize_ = targetSize;
            }

            std::scoped_lock lock(renderMutex_);
            auto& dxr = Normal::dxr_;
            auto d2dTarget = target->d2d();
            if (!d2dTarget) {
                IRT_LOG_AND_FATAL("d2dTarget is null");
            }

            auto windowTexture = target->d3dTexture().get();
            if (!windowTexture || !rendererTexture_) {
                return;
            }
            // SET TRANSFORM TO DEFAULT
            d2dTarget->SetTransform(D2D1::Matrix3x2F::Identity());
            //d2dTarget->Clear(D2D1::ColorF(D2D1::ColorF::White));

            const auto snapshot = renderer_->getSHM()->maybeGet();
            if (!snapshot.hasTexture()) {
                L->debug("No texture in SHM");
                return;
            }

            const auto config = snapshot.getConfig();
            const auto layerId = 0;
            const auto frameNumber = renderer_->getSHM()->getFrameCountForMetricsOnly();
            if (frameNumber % 60 == 0)
                L->info("Frame number ({})", frameNumber);

            const auto& layer = *snapshot.getLayerConfig(layerId);

            auto layerID = layer.layerID;

            const auto sourceRect = layer.vr.locationOnTexture;

            const auto& imageSize = sourceRect.size();
            const auto scalex = static_cast<float>(targetSize.width()) / static_cast<float>(imageSize.width());
            const auto scaley = static_cast<float>(targetSize.height()) / static_cast<float>(imageSize.height());
            const auto scale = std::min<float>(scalex, scaley);

            const PixelRect destRect = getDestRect(imageSize, scale);

            auto ctx = dxr->getDXImmediateContext().get();

            const D3D11_BOX box{0, 0, 0, targetSize.width(), targetSize.height(), 1,};

            // Forcing the renderer to render on top of the background to make sure it
            // preserves the existing content; clearing is fine for VR, but for non-VR
            // we need to preserve the original background.

            ctx->CopySubresourceRegion(rendererTexture_.get(), 0, 0, 0, 0, windowTexture, 0, &box);

            check_hresult(ctx->Signal(fence_.get(), ++fenceValue_));

            fenceValue_ = renderer_->render(
                snapshot.getTexture<SHM::IPCClientTexture>(),
                sourceRect,
                rendererTextureHandle_.get(),
                rendererTextureSize_,
                destRect,
                fenceHandle_.get(),
                fenceValue_
            );

            check_hresult(ctx->Wait(fence_.get(), fenceValue_));

            ctx->CopySubresourceRegion(windowTexture, 0, 0, 0, 0, rendererTexture_.get(), 0, &box);

            renderCacheKey_ = snapshot.getRenderCacheKey();
        }
    };
};
