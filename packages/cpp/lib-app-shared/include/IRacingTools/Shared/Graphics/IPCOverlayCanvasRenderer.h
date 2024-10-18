//
// Created by jglanz on 5/1/2024.
//

#pragma once


#include <IRacingTools/SDK/Utils/RunnableThread.h>
#include <IRacingTools/Shared/SHM/SHM.h>
#include <IRacingTools/Shared/SharedAppLibPCH.h>


#include <IRacingTools/Shared/Graphics/DXResources.h>
#include <IRacingTools/Shared/Graphics/ImageDataBufferContainer.h>
#include <IRacingTools/Shared/Graphics/RenderTarget.h>
#include <IRacingTools/Shared/Graphics/Spriting.h>

namespace IRacingTools::Shared::Graphics {

  /**
   * @brief Produced overlay frame data
   * @tparam FormatChannels
   */
  template <ImageFormatChannels FormatChannels>
  class IPCOverlayFrameData {
    std::mutex mutex_{};


    PixelSize imageSize_{};
    /**
     * @brief VR Rect
     */
    ScreenRect screenRect_{};

    /**
     * @brief VR rectangle
     */
    VR::VRNativeLayout vrLayout_{};

    const std::shared_ptr<ImageDataBufferContainer<FormatChannels>> imageData_;

  public:

    ScreenRect screenRect() {
      return screenRect_;
    };

    VR::VRNativeLayout vrLayout() {
      return vrLayout_;
    };

    PixelSize imageSize() {
      return imageSize_;
    };

    std::shared_ptr<ImageDataBufferContainer<FormatChannels>> imageData() {
      return imageData_;
    };

    PixelSize getImageSize() const {
      return imageData_->getImageSize();
    }

    std::uint32_t getImageDataSize() const {
      return imageData_->getImageDataSize();
    }

    std::uint32_t getImageDataStride() const {
      return imageData_->getImageDataStride();
    }

    bool update(const PixelSize& imageSize, const ScreenRect& screenRect, const VR::VRNativeLayout& vrLayout) {
      LOCK(mutex_, lock);
      screenRect_ = screenRect;
      vrLayout_ = vrLayout;
      return imageData_->resize(imageSize.width(), imageSize.height());
    }

    IPCOverlayFrameData(const PixelSize& imageSize, const ScreenRect& screenRect = {}, const VR::VRNativeLayout& vrLayout = {}) :
      screenRect_(screenRect),
      vrLayout_(vrLayout),
      imageData_(std::make_shared<ImageDataBufferContainer<FormatChannels>>(imageSize.width(), imageSize.height())) {
      update(imageSize, screenRect, vrLayout);
    }
  };

  using BGRAIPCOverlayFrameData = IPCOverlayFrameData<ImageFormatChannels::RGBA>;

  /**
   * @brief Producer that provides & notifies the renderer of frame data
   *
   * @tparam FormatChannels channel config
   */
  template <ImageFormatChannels FormatChannels>
  struct IPCOverlayFrameProducer {
    using OnFrameData = std::function<void(
      // std::size_t idx,
      // const std::shared_ptr<IPCOverlayFrameData<FormatChannels>>& frameData
    )>;

    virtual ~IPCOverlayFrameProducer() = default;

    /**
     * @brief Get number of overlay's currently configured
     * @return
     */
    virtual std::size_t getOverlayCount() = 0;

    virtual std::shared_ptr<IPCOverlayFrameData<FormatChannels>> getOverlayData(std::size_t idx) = 0;

    virtual void onOverlayFrameData(OnFrameData fn) = 0;
  };


  template <ImageFormatChannels FormatChannels>
  class IPCOverlayCanvasRenderer : public std::enable_shared_from_this<IPCOverlayCanvasRenderer<FormatChannels>> {
  public:
    using Buffer = ImageDataBuffer<FormatChannels>;
    using BufferPtr = std::shared_ptr<Buffer>;
    using Producer = IPCOverlayFrameProducer<FormatChannels>;
    // using ProducerPtr = std::shared_ptr<Producer>;
    using ProducerPtr = Producer*;

    /**
     * Hold shared texture resources
     */
    struct TextureResources { // NOLINT(*-pro-type-member-init)
      winrt::com_ptr<ID3D11Texture2D> texture;
      winrt::com_ptr<ID3D11RenderTargetView> renderTargetView;

      winrt::handle textureHandle;
      PixelSize textureSize;

      winrt::com_ptr<ID3D11Fence> fence;
      winrt::handle fenceHandle;

      D3D11_VIEWPORT viewport{};
    };

  private:

    void consumerRunnable(SDK::Utils::FnIndefiniteThread* t) {
      if (isDestroyed_) {
        t->stop();
        return;
      }

      producer_->onOverlayFrameData(
        [&]() {
          if (isDestroyed_) return;
          render();
          // renderNow(idx, frameData);
        }
      );
    }

    std::array<TextureResources, SHMSwapchainLength> ipcSwapchain_{};

    SDK::Utils::FnIndefiniteThread consumerThread_;
    ProducerPtr producer_;
    std::shared_ptr<DXResources> dxr_;
    std::shared_ptr<SHM::Writer> writer_;

    std::shared_ptr<RenderTarget> target_{};
    PixelSize canvasSize_{};
    std::map<uint8_t, BufferPtr> overlayImageDataBuffers_{};
    std::mutex destroyMutex_{};
    std::atomic_bool isDestroyed_{false};
    std::atomic_flag isRendering_;
    std::atomic_int renderCount_{0};

  public:

    explicit IPCOverlayCanvasRenderer(const ProducerPtr& producer, const std::shared_ptr<DXResources>& dxr) :
      consumerThread_(
        [&](auto t) {
          consumerRunnable(t);
        }
      ),
      producer_(producer),
      dxr_(dxr),
      writer_(std::make_shared<SHM::Writer>(dxr->getDXGIAdapterLUID())) {

      consumerThread_.start();
    }

    static std::shared_ptr<IPCOverlayCanvasRenderer> Create(const ProducerPtr& producer) {

      return std::make_shared<IPCOverlayCanvasRenderer>(producer, std::make_shared<Graphics::DXResources>());
    }

    ~IPCOverlayCanvasRenderer() {
      destroy();
    }

    IPCOverlayCanvasRenderer() = delete;

    IPCOverlayCanvasRenderer(IPCOverlayCanvasRenderer&&) = delete;

    IPCOverlayCanvasRenderer(const IPCOverlayCanvasRenderer&) = delete;

    void destroy() {
      LOCK(destroyMutex_, lock);
      if (isDestroyed_.exchange(true)) {
        return;
      }

      consumerThread_.stop();
    }

    TextureResources*
    getTextureResources(uint8_t textureIndex, const PixelSize& size) {
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
        ret.texture.template as<IDXGIResource1>()->CreateSharedHandle(
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


    void initializeCanvas(const PixelSize& size) {
      if (canvasSize_ == size) {
        return;
      }

      D3D11_TEXTURE2D_DESC desc{
        .Width = size.width(),
        .Height = size.height(),
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

    /**
     * @brief Get or create an ImageDataBuffer for a specific overlay index
     *
     * @param idx overlay index
     * @param overlayData frame data wrapper
     * @return A valid buffer ptr
     */
    BufferPtr getOrCreateOverlayImageDataBuffer(std::uint8_t idx, std::shared_ptr<IPCOverlayFrameData<FormatChannels>> overlayData) {
      BufferPtr imageDataBuffer;
      if(overlayImageDataBuffers_.contains(idx)) {
        imageDataBuffer = overlayImageDataBuffers_[idx];
      }

      if (!imageDataBuffer) {
        imageDataBuffer =  overlayData->imageData()->newBuffer();
        overlayImageDataBuffers_[idx] = imageDataBuffer;
      }

      return imageDataBuffer;
    }

    /**
     * @brief Render all overlays and submit the frame
     */
    void render() noexcept {
      static auto L = Logging::GetCategoryWithName("IPCOverlayCanvasRenderer");
      if (isRendering_.test_and_set()) {
        L->debug("Two renders in the same instance");
        VRK_BREAK;
        return;
      }

      auto markDone = gsl::finally(
        [this] {
          isRendering_.clear();
        }
      );

      auto renderCount = ++renderCount_;

      const auto overlayCount = producer_->getOverlayCount();

      const auto canvasSize = Spriting::GetBufferSize(overlayCount);

      // TraceLoggingWriteTagged(activity, "AcquireDXLock/start");
      const std::unique_lock dxLock(*dxr_);
      // TraceLoggingWriteTagged(activity, "AcquireDXLock/stop");
      initializeCanvas(canvasSize);
      auto ctx = dxr_->getDXImmediateContext();
      ctx->ClearRenderTargetView(target_->d3d().rtv(), DirectX::Colors::Transparent);

      std::vector<SHM::SHMOverlayFrameConfig> shmOverlayFrames;
      shmOverlayFrames.reserve(overlayCount);

      for (uint8_t i = 0; i < overlayCount; ++i) {
        const auto bounds = Spriting::GetRect(i, overlayCount);
        auto overlayData = producer_->getOverlayData(i);
        if (!overlayData) {
          L->warn("producer returned null of overlay idx ({})", i);
          continue;
        }
        auto vrLayout = overlayData->vrLayout();
        // L->debug("Frame Pose idx={},x={}", i, vrLayout.pose.x);
        auto imageSize = overlayData->getImageSize();
        SHM::SHMOverlayFrameConfig overlayFrameConfig{
          .overlayIdx = i,
          .locationOnTexture{.offset_ = {bounds.left(), 0}, .size_ = imageSize, .origin_ = PixelRect::Origin::TopLeft},
          .vrEnabled = true,
          .vr = {
            .layout = vrLayout,
            .enableGazeZoom{false},
            .zoomScale{1.0f},
            .gazeTargetScale{},
            .opacity{},
          },
          .screen = {.rect = overlayData->screenRect()}
        };

        D3D11_BOX destRegion{
          bounds.left(),
          bounds.top(),
          0,
          bounds.left() + imageSize.width(),
          bounds.top() + imageSize.height(),
          1
        };

        // GET A BUFFER TO HOLD THE IMAGE DATA
        BufferPtr imageDataBuffer = getOrCreateOverlayImageDataBuffer(i, overlayData);
        if (!imageDataBuffer) {
          L->error("imageDataBuffer is invalid (idx={})", i);
          continue;
        }

        // CAPTURE/CONSUME AN AVAILABLE FRAME
        if (!overlayData->imageData()->consume(imageDataBuffer)) {
          auto invalidBuffer = !imageDataBuffer;
          auto hasData = imageDataBuffer && imageDataBuffer->hasData();
          if (invalidBuffer || !hasData) {
            L->warn("no frame buffer consumed/populated/filled (idx={},invalidBuffer={},hasData={})", i, invalidBuffer, hasData);
            continue;
          }

          L->debug("No new frame data, but using previous (idx={})", i);
        }

        // CONSUME THE DATA & UPDATING DX TEXTURE ON GPU
        imageDataBuffer->consume(
          [&](auto data, auto len, auto) -> std::uint32_t {
            ctx->UpdateSubresource(
              target_->d3dTexture().get(),
              0,
              &destRegion,
              data,
              overlayData->imageData()->getImageDataStride(),
              0
            );
            return len;
          }
        );

        // ADD CONFIG TO THE SHM FRAME DATA
        shmOverlayFrames.push_back(overlayFrameConfig);
      }

      if (renderCount % 100 == 0) {
        L->debug("Rendering frame ({}) overlay image data (overlayCount={})", renderCount, overlayCount);
      }

      submitFrame(shmOverlayFrames);
    }

    void submitFrame(
      const std::vector<SHM::SHMOverlayFrameConfig>& shmOverlayFrameConfigs
    ) noexcept {
      if (!writer_) {
        return;
      }

      auto ctx = dxr_->getDXImmediateContext().get();
      const D3D11_BOX srcBox{
        0,
        0,
        0,
        canvasSize_.width(),
        canvasSize_.height(),
        1,
      };

      auto srcTexture = target_->d3d().texture();

      // TraceLoggingWriteTagged(activity, "AcquireSHMLock/start");
      const std::unique_lock shmLock(*writer_);
      // TraceLoggingWriteTagged(activity, "AcquireSHMLock/stop");

      auto ipcTextureInfo = writer_->beginFrame();
      auto destResources = getTextureResources(ipcTextureInfo.textureIndex, canvasSize_);

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
          shmOverlayFrameConfigs,
          destResources->textureHandle.get(),
          destResources->fenceHandle.get()
        );
      }
    }
  };

  using BGRAIPCOverlayFrameProducer = IPCOverlayFrameProducer<ImageFormatChannels::RGBA>;
  using BGRAIPCOverlayCanvasRenderer = IPCOverlayCanvasRenderer<ImageFormatChannels::RGBA>;

} // namespace IRacingTools::Shared::Graphics
