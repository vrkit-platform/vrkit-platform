//
// Created by jglanz on 5/1/2024.
//

#include <memory>

#include <IRacingTools/Shared/UI/TrackMapOverlayWindow.h>
#include <IRacingTools/Shared/SharedMemoryStorage.h>

#include <spdlog/spdlog.h>

namespace IRacingTools::Shared::UI
{

  void TrackMapOverlayWindow::render(const std::shared_ptr<Graphics::RenderTarget> &target)
  {

    if (!trackMapWidget_) {
      trackMapWidget_ = std::make_shared<Graphics::DX11TrackMapWidget>(dxr_);
    }
    trackMapWidget_->render(renderTarget_, state());

  }

  TrackMapOverlayWindow::TrackMapOverlayWindow() : OverlayWindow(), state_(new Graphics::TrackMapState())
  {

  }


}
