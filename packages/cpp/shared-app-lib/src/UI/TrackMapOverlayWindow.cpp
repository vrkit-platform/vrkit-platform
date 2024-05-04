//
// Created by jglanz on 5/1/2024.
//

#include <memory>

#include <IRacingTools/Shared/SharedMemoryStorage.h>
#include <IRacingTools/Shared/UI/TrackMapOverlayWindow.h>

#include <spdlog/spdlog.h>

namespace IRacingTools::Shared::UI {

  void TrackMapOverlayWindow::render(const std::shared_ptr<Graphics::RenderTarget> &target) {

    std::scoped_lock lock(dataMutex_);
    if (!dataEvent_)
      return;

    if (!trackMapWidget_) {
      trackMapWidget_ = std::make_shared<Graphics::DX11TrackMapWidget>(trackMap_, dxr_);
      dataChanged_ = !!dataEvent_;
    }

    if (dataChanged_) {
      spdlog::info("Data changed");
      trackMapWidget_->render(renderTarget_, dataEvent_);
    }
  }

  TrackMapOverlayWindow::TrackMapOverlayWindow(const TrackMap &trackMap,
                                               const std::shared_ptr<SessionDataProvider> &dataProvider)
      : dataProvider_(dataProvider), trackMap_(trackMap),
        unsubscribeFn_(dataProvider->subscribe([&](std::shared_ptr<SessionDataEvent> event) {
          if (event->type() == SessionDataEventType::Updated) {
            if (auto dataEvent = std::dynamic_pointer_cast<SessionDataUpdatedEvent>(event)) {
              std::scoped_lock lock(dataMutex_);
              dataChanged_ = true;
              dataEvent_ = dataEvent;
            }
          }
        })) {
  }


}// namespace IRacingTools::Shared::UI
