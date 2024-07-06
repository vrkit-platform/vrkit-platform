//
// Created by jglanz on 1/7/2024.
//

// #include "../resource.h"
#include <DirectXHelpers.h>
#include <winrt/base.h>

#include <IRacingTools/Shared/TrackMapGeometry.h>
#include <IRacingTools/Shared/Graphics/Renderable.h>

namespace IRacingTools::Shared::UI {
    using namespace DirectX;

    struct MarkerWidgetState {
        
    };

    //
    // class MarkerWidget : public Graphics::Renderable<MarkerWidgetState&> {
    // public:
    //     MarkerWidget() = delete;
    //
    //     explicit MarkerWidget(const std::shared_ptr<Graphics::DXResources>& resources) : Renderable(resources) {}
    //
    //     MarkerWidget(MarkerWidget&&) = delete;
    //     MarkerWidget(const MarkerWidget&) = delete;
    //     virtual ~MarkerWidget() = default;
    //
    //     virtual void render(const std::shared_ptr<Graphics::RenderTarget>& target, MarkerWidgetState& data) override {}
    // };
}
