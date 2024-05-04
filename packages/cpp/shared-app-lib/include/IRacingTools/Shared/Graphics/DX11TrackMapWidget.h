//
// Created by jglanz on 1/7/2024.
//

#pragma once

#include "../SharedAppLibPCH.h"
#include "DX11Resources.h"
#include "RenderTarget.h"
#include "Renderable.h"

#include <IRacingTools/Models/TrackMapData.pb.h>
#include <IRacingTools/Shared/SessionDataEvent.h>

namespace IRacingTools::Shared::Graphics {





  class DX11TrackMapWidget : public Renderable<std::shared_ptr<SessionDataUpdatedEvent>> {
  public:


    explicit DX11TrackMapWidget(const TrackMap& trackMap, const std::shared_ptr<DXResources>& resources);

    void render(const std::shared_ptr<RenderTarget>& target, const std::shared_ptr<SessionDataUpdatedEvent>& data) override;

  private:
    HRESULT createResources(const std::shared_ptr<RenderTarget> &target);

    std::atomic_bool ready_{false};
    std::atomic_bool disposed_{false};
    Size<UINT> renderSize_{0,0};

    TrackMap trackMap_;

    std::mutex trackMapMutex_{};
    std::mutex renderMutex_{};
    std::atomic_flag trackMapChanged_ = ATOMIC_FLAG_INIT;

    winrt::com_ptr<ID2D1PathGeometry> pathGeometry_{nullptr};

    std::shared_ptr<DXResources> resources_;



    // D3DXMATRIX worldMatrix_{};
    // D3DXMATRIX viewMatrix_{};
    // D3DXMATRIX projectionMatrix_{};

  };

} // namespace IRacingTools::Shared::Graphics
