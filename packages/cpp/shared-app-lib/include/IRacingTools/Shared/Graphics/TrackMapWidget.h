//
// Created by jglanz on 1/7/2024.
//

#pragma once

#include <directxtk/CommonStates.h>
#include <directxtk/Effects.h>
#include <directxtk/GeometricPrimitive.h>
#include <directxtk/PrimitiveBatch.h>
#include <directxtk/VertexTypes.h>


#include "../SharedAppLibPCH.h"
#include "DX11Resources.h"
#include "RenderTarget.h"
#include "Renderable.h"

#include <IRacingTools/Models/TrackMapData.pb.h>
#include <IRacingTools/Shared/SessionDataEvent.h>

namespace IRacingTools::Shared::Graphics {
    using namespace IRacingTools::Models::Telemetry;
    using VertexType = DirectX::VertexPositionColor;


    class TrackMapWidget : public Renderable<std::shared_ptr<SessionDataUpdatedDataEvent>> {
    public:
        explicit TrackMapWidget(const TrackMap& trackMap, const std::shared_ptr<DXResources>& resources);
        virtual ~TrackMapWidget() override;

        void render(
            const std::shared_ptr<RenderTarget>& target,
            const std::shared_ptr<SessionDataUpdatedDataEvent>& data
        ) override;

    private:
        void resetTargetResources();
        void createTargetResources(const std::shared_ptr<RenderTarget>& target);
        void createResources();


        std::atomic_bool disposed_{false};
        std::atomic_bool targetResCreated_{false};
        Size<UINT> renderSize_{0, 0};

        TrackMap trackMap_;

        std::mutex trackMapMutex_{};
        std::mutex renderMutex_{};
        std::atomic_flag trackMapChanged_ = ATOMIC_FLAG_INIT;

        winrt::com_ptr<ID2D1SolidColorBrush> brushPath_{};
        winrt::com_ptr<ID2D1SolidColorBrush> brushCarOuter_{};

        winrt::com_ptr<ID2D1PathGeometry> pathGeometry_{nullptr};


        winrt::com_ptr<ID2D1EllipseGeometry> carBaseGeometry_{nullptr};

        double pathTotalDistance_{0.0f};
        std::map<double, TrackMap_Point> pathPointDistanceMap_{};


        std::unique_ptr<DirectX::CommonStates> states_{nullptr};
        std::unique_ptr<DirectX::BasicEffect> effect_{nullptr};
        std::unique_ptr<DirectX::PrimitiveBatch<VertexType>> batch_{nullptr};
        winrt::com_ptr<ID3D11InputLayout> inputLayout_{nullptr};

        // class CarWidget;
        // CarWidget* carWidget_{nullptr};


        //std::shared_ptr<DXResources> resources_;


        // D3DXMATRIX worldMatrix_{};
        // D3DXMATRIX viewMatrix_{};
        // D3DXMATRIX projectionMatrix_{};
    };
} // namespace IRacingTools::Shared::Graphics
