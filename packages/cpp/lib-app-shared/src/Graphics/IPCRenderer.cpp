#include <gsl/util>
#include <IRacingTools/Shared/Graphics/IPCRenderer.h>
#include <IRacingTools/Shared/Graphics/Spriting.h>

namespace IRacingTools::Shared::Graphics {
    IPCRenderer::IPCRenderer(const std::shared_ptr<DXResources>& dxr) : dxr_(dxr),
                                                                        writer_(
                                                                            std::make_shared<SHM::Writer>(
                                                                                dxr->getDXGIAdapterLUID()
                                                                            )
                                                                        ) {}

    std::shared_ptr<IPCRenderer> IPCRenderer::Create(const std::shared_ptr<DXResources>& dxr) {
        return std::shared_ptr<IPCRenderer>(new IPCRenderer(dxr));
    }

    IPCTextureResources* IPCRenderer::getIPCTextureResources(uint8_t textureIndex, const PixelSize& size) {
        auto& ret = ipcSwapchain_.at(textureIndex);
        if (ret.textureSize == size) [[likely]] {
            return &ret;
        }

        ret = {};


        auto device = dxr_->getDXDevice().get();

        D3D11_TEXTURE2D_DESC textureDesc{
            .Width = size.width(),
            .Height = size.height(),
            .MipLevels = 1,
            .ArraySize = 1,
            .Format = SHM::SHARED_TEXTURE_PIXEL_FORMAT,
            .SampleDesc = {1, 0},
            .BindFlags = D3D11_BIND_RENDER_TARGET | D3D11_BIND_SHADER_RESOURCE,
            .MiscFlags = D3D11_RESOURCE_MISC_SHARED_NTHANDLE | D3D11_RESOURCE_MISC_SHARED,
        };

        check_hresult(device->CreateTexture2D(&textureDesc, nullptr, ret.texture.put()));
        check_hresult(device->CreateRenderTargetView(ret.texture.get(), nullptr, ret.renderTargetView.put()));
        check_hresult(
            ret.texture.as<IDXGIResource1>()->CreateSharedHandle(
                nullptr,
                DXGI_SHARED_RESOURCE_READ,
                nullptr,
                ret.textureHandle.put()
            )
        );

        check_hresult(device->CreateFence(0, D3D11_FENCE_FLAG_SHARED, IID_PPV_ARGS(ret.fence.put())));
        check_hresult(ret.fence->CreateSharedHandle(nullptr, GENERIC_ALL, nullptr, ret.fenceHandle.put()));

        ret.viewport = {0, 0, static_cast<FLOAT>(size.width()), static_cast<FLOAT>(size.height()), 0.0f, 1.0f,};
        ret.textureSize = size;

        return &ret;
    }

    void IPCRenderer::initializeCanvas(const PixelSize& size) {
        if (canvasSize_ == size) {
            return;
        }

        // VRK_TraceLoggingScope("InterprocessRenderer::InitializeCanvas()");

        D3D11_TEXTURE2D_DESC desc{
            .Width = static_cast<UINT>(size.width()),
            .Height = static_cast<UINT>(size.height()),
            .MipLevels = 1,
            .ArraySize = 1,
            .Format = SHM::SHARED_TEXTURE_PIXEL_FORMAT,
            .SampleDesc = {1, 0},
            .BindFlags = D3D11_BIND_RENDER_TARGET | D3D11_BIND_SHADER_RESOURCE,
        };

        auto device = dxr_->getDXDevice().get();

        winrt::com_ptr<ID3D11Texture2D> texture;
        check_hresult(device->CreateTexture2D(&desc, nullptr, texture.put()));
        target_ = RenderTarget::Create(dxr_, texture); // MaxViewCount
        canvasSize_ = size;

        // Let's force a clean start on the clients, including resetting the session
        // ID
        ipcSwapchain_ = {};
        const std::unique_lock shmLock(*writer_.get());
        writer_->detach();
    }

    void IPCRenderer::renderNow(const std::shared_ptr<RenderTarget>& sourceTarget) noexcept {
        if (isRendering_.test_and_set()) {
            spdlog::debug("Two renders in the same instance");
            VRK_BREAK;
            return;
        }

        auto markDone = gsl::finally([this] { isRendering_.clear(); });

        //
        //
        // const auto renderInfos = mKneeboard->GetViewRenderInfo();
        const auto layerCount = 1; //renderInfos.size();

        const auto canvasSize = Spriting::GetBufferSize(layerCount);

        // TraceLoggingWriteTagged(activity, "AcquireDXLock/start");
        const std::unique_lock dxlock(*dxr_);
        // TraceLoggingWriteTagged(activity, "AcquireDXLock/stop");
        this->initializeCanvas(canvasSize);
        auto ctx = dxr_->getDXImmediateContext();
        ctx->ClearRenderTargetView(target_->d3d().rtv(), DirectX::Colors::Transparent);

        std::vector<SHM::LayerConfig> shmLayers;
        shmLayers.reserve(layerCount);
        uint64_t inputLayerID = 0;

        for (uint8_t i = 0; i < layerCount; ++i) {
            const auto bounds = Spriting::GetRect(i, layerCount);
            // const auto& renderInfo = renderInfos.at(i);
            // if (renderInfo.mIsActiveForInput) {
            //     inputLayerID = renderInfo.mView->GetRuntimeID().GetTemporaryValue();
            // }
            //
            // mCanvas->SetActiveIdentity(i);
            auto srcDim = sourceTarget->getDimensions();
            SHM::LayerConfig layerConfig{
                .layerID = i,
                .vrEnabled = true,
                .vr = {
                    .pose {},
                    .physicalSize {0.15f, 0.25f},
                    .enableGazeZoom {false},
                    .zoomScale {1.0f},
                    .gazeTargetScale {},
                    .opacity {},
                    .locationOnTexture {.offset_ = {0, 0},.size_ = srcDim,  .origin_ = PixelRect::Origin::TopLeft}
                }
            };

            D3D11_BOX srcBox{0, 0, 0, srcDim.width(), srcDim.height(), 1};
            ctx->CopySubresourceRegion(target_->d3d().texture(), 0, 0, 0, 0, sourceTarget->d3d().texture(), 0, &srcBox);
            shmLayers.push_back(layerConfig);

            //this->RenderLayer(renderInfo, bounds)
        }

        this->submitFrame(shmLayers, inputLayerID);
    }

    void IPCRenderer::submitFrame(const std::vector<SHM::LayerConfig>& shmLayers, std::uint64_t inputLayerID) noexcept {
        if (!writer_) {
            return;
        }


        const auto layerCount = shmLayers.size();

        auto ctx = dxr_->getDXImmediateContext().get();
        const D3D11_BOX srcBox{
            0,
            0,
            0,
            static_cast<UINT>(canvasSize_.width()),
            static_cast<UINT>(canvasSize_.height()),
            1,
        };

        auto srcTexture = target_->d3d().texture();

        // TraceLoggingWriteTagged(activity, "AcquireSHMLock/start");
        const std::unique_lock shmLock(*writer_.get());
        //TraceLoggingWriteTagged(activity, "AcquireSHMLock/stop");

        auto ipcTextureInfo = writer_->beginFrame();
        auto destResources = this->getIPCTextureResources(ipcTextureInfo.textureIndex, canvasSize_);

        auto fence = destResources->fence.get();
        {
            // VRK_TraceLoggingScope(
            //   "CopyFromCanvas",
            //   TraceLoggingValue(ipcTextureInfo.mTextureIndex, "TextureIndex"),
            //   TraceLoggingValue(ipcTextureInfo.mFenceOut, "FenceOut"));
            // {
            //   OPENKNEEBOARD_TraceLoggingScope("CopyFromCanvas/CopySubresourceRegion");
            ctx->CopySubresourceRegion(destResources->texture.get(), 0, 0, 0, 0, srcTexture, 0, &srcBox);
            //}
            //{
            // VRK_TraceLoggingScope("CopyFromCanvas/FenceOut");
            check_hresult(ctx->Signal(fence, ipcTextureInfo.fenceOut));
            //}
        }

        SHM::SHMConfig config{
            .globalInputLayerId = 0,
            .vr = {},
            //.mTarget = GetConsumerPatternForGame(mCurrentGame),
            .textureSize = destResources->textureSize,
        };
        // const auto tint = mKneeboard->GetAppSettings().mTint;
        // if (tint.mEnabled) {
        //   config.mTint = {
        //     tint.mRed * tint.mBrightness,
        //     tint.mGreen * tint.mBrightness,
        //     tint.mBlue * tint.mBrightness,
        //     /* alpha = */ 1.0f,
        //   };
        // }

        {
            writer_->submitFrame(
                config,
                shmLayers,
                destResources->textureHandle.get(),
                destResources->fenceHandle.get()
            );
        }
    }
}
