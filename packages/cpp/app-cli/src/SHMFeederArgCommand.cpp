//
// Created by jglanz on 4/19/2024.
//

#include "SHMFeederArgCommand.h"

#include <IRacingTools/SDK/Types.h>
#include <IRacingTools/Shared/Graphics/IPCOverlayCanvasRenderer.h>
#include <IRacingTools/Shared/SHM/SHM.h>
#include <IRacingTools/Shared/UI/ViewerWindow.h>
#include <IRacingTools/Shared/Logging/LoggingManager.h>

namespace IRacingTools::App::Commands {
  using namespace IRacingTools::Shared;
  using namespace IRacingTools::Shared::UI;

  using namespace IRacingTools::Shared::SHM;

  using namespace IRacingTools::SDK::Utils;
  using namespace IRacingTools::SDK;

  namespace {
    auto L = Logging::GetCategoryWithType<SHMFeederArgCommand>();
    using BGRAPixel = std::array<std::uint8_t, 4>;


    struct SHMFeedBGRAImageDataSourceConfig {
      BGRAPixel pixel;
      PixelSize imageSize;
      VR::VRNativeLayout vrLayout;
    };

    struct SHMFeedRGBAImageDataSource {
      std::shared_ptr<Graphics::BGRAIPCOverlayFrameData> frameData;
      std::vector<std::uint8_t> sourceFrameData{};
      VR::VRNativeLayout vrLayout;

      void produce() {
        if (auto res = frameData->imageData()->produce(sourceFrameData.data(), sourceFrameData.size()); !res) {
          L->error("Failed to produce frame: {}", res.error().what());
        }
      }

      SHMFeedRGBAImageDataSource(
        const BGRAPixel& pixel,
        const std::uint32_t& width,
        const std::uint32_t& height,
        const VR::VRNativeLayout& vrLayout
      ) : frameData(
            std::make_shared<Graphics::BGRAIPCOverlayFrameData>(PixelSize{width, height}, ScreenRect{}, vrLayout)
          ),
          vrLayout(vrLayout) {
        sourceFrameData.resize(width * height * 4);
        for (int i = 0; i < sourceFrameData.size(); i += 4) {
          sourceFrameData[i] = pixel[0];
          sourceFrameData[i + 1] = pixel[1];
          sourceFrameData[i + 2] = pixel[2];
          sourceFrameData[i + 3] = pixel[3];
        }

      };
    };

    class SHMFeedImageDataProducer : public Graphics::BGRAIPCOverlayFrameProducer {
      std::size_t fps_;
      std::vector<SHMFeedBGRAImageDataSourceConfig> configs_;
      std::vector<std::shared_ptr<SHMFeedRGBAImageDataSource>> imageDatas_{};

      FnIndefiniteThread producerThread_;
      // FnIndefiniteThread notifyThread_;

      std::mutex notifyMutex_{};
      std::condition_variable notifyCondition_{};

    public:

      void waitForDone() {
        producerThread_.join();
      }

      void producerRunnable(FnIndefiniteThread* t) {
        using namespace std::chrono;
        using namespace std::chrono_literals;
        t->setThreadName("producerRunnable");

        std::int64_t intervalMsNumber = std::ceil(1000 / fps_);
        auto intervalTime = milliseconds(intervalMsNumber);
        while (t->isRunning()) {
          auto frameStartTime = system_clock::now();
          for (auto& imageData : imageDatas_) {
            imageData->produce();
          }
          auto frameEndTime = system_clock::now();
          auto frameDuration = duration_cast<milliseconds>(frameEndTime - frameStartTime);

          {
            std::scoped_lock lock(notifyMutex_);
            notifyCondition_.notify_all();
          }

          auto framePaddingTime = intervalTime - frameDuration;
          L->info(
            "Frame duration {}ms, paddingTime={}ms, interval={}ms",
            frameDuration.count(),
            framePaddingTime.count(),
            intervalTime.count()
          );

          if (framePaddingTime.count()) std::this_thread::sleep_for(framePaddingTime);
        }
      }

      // void notifyRunnable(FnIndefiniteThread * t) {
      //     while (t->isRunning()) {
      //         {
      //             std::unique_lock lock(notifyMutex_);
      //             notifyCondition_.wait(lock);
      //         }
      //
      //         if (t->isRunning()) {
      //
      //         }
      //     }
      // }
      //, notifyThread_([&] (auto t) { notifyRunnable(t); })
      explicit SHMFeedImageDataProducer(std::size_t fps, const std::vector<SHMFeedBGRAImageDataSourceConfig>& configs) :
        fps_(fps),
        configs_(configs),
        producerThread_(
          [&](auto t) {
            producerRunnable(t);
          }
        ) {
        for (auto& config : configs_) {
          imageDatas_.push_back(
            std::make_shared<SHMFeedRGBAImageDataSource>(
              config.pixel,
              config.imageSize.width(),
              config.imageSize.height(),
              config.vrLayout
            )
          );
        }

        producerThread_.start();
      }

      virtual std::size_t getOverlayCount() override {
        return imageDatas_.size();
      };

      virtual std::shared_ptr<Graphics::IPCOverlayFrameData<Graphics::ImageFormatChannels::BGRA>> getOverlayData(
        std::size_t idx
      ) override {
        if (imageDatas_.size() > idx) return imageDatas_[idx]->frameData;
        return nullptr;
      }

      virtual void onOverlayFrameData(OnFrameData fn) override {
        {
          std::unique_lock lock(notifyMutex_);
          notifyCondition_.wait(lock);
        }

        fn();
      }
    };

    std::shared_ptr<Graphics::BGRAIPCOverlayCanvasRenderer> gIPCRenderer{nullptr};
  }

  CLI::App* SHMFeederArgCommand::createCommand(CLI::App* app) {
    auto cmd = app->add_subcommand("shm-feeder", "SHM Feeder (for testing)");

    return cmd;
  }

  int SHMFeederArgCommand::execute() {
    L->info("SHM-Feeder");

    std::vector<SHMFeedBGRAImageDataSourceConfig> imageConfigs = {
      {
        BGRAPixel{0, 0, 0, 255},
        PixelSize{400, 400},
        VR::VRNativeLayout{VR::VRNativePose{-0.25f, 0.0f, -1.0f}, VRSize{0.6f, 0.6f}}
      },
      {
        BGRAPixel{0, 0, 255, 255},
        PixelSize{200, 200},
        VR::VRNativeLayout{VR::VRNativePose{0.25f, 0.0f, -1.0f}, VRSize{0.4f, 0.4f}}
      }
    };
    auto producer = std::make_shared<SHMFeedImageDataProducer>(10, imageConfigs);
    gIPCRenderer = Graphics::BGRAIPCOverlayCanvasRenderer::Create(producer.get());

    producer->waitForDone();
    return 0;
  }
}
