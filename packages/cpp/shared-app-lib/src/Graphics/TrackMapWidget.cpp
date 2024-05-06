//
// Created by jglanz on 1/7/2024.
//

// #include "../resource.h"
#include <DirectXHelpers.h>
#include <winrt/base.h>

#include <IRacingTools/Shared/Graphics/TrackMapWidget.h>
#include <IRacingTools/Shared/Macros.h>
#include <IRacingTools/Shared/SHM.h>
#include <IRacingTools/Shared/TrackMapGeometry.h>
#include <IRacingTools/Shared/Graphics/DXPlatformHelpers.h>


namespace IRacingTools::Shared::Graphics {
    using namespace DirectX;



    TrackMapWidget::TrackMapWidget(const TrackMap& trackMap, const std::shared_ptr<DXResources>& resources) :
        Renderable(resources),
        trackMap_(trackMap)

        //carWidget_(new CarWidget(resources))
        {
        createResources();
    }

    TrackMapWidget::~TrackMapWidget() {
        // delete carWidget_;
    }

    void TrackMapWidget::render(
        const std::shared_ptr<RenderTarget>& target,
        const std::shared_ptr<SessionDataUpdatedEvent>& data
    ) {
        // TODO: Check if DXResources->getSize() changed too
        auto targetSize = target->getDimensions();
        auto sizeChanged = renderSize_ != targetSize;
        if (!targetResCreated_ || sizeChanged) {
            renderSize_ = targetSize;
            createTargetResources(target);
        }

        // GET D2D TARGET
        auto d2dTarget = target->d2d();
        if (!d2dTarget) {
            IRT_LOG_AND_FATAL("d2dTarget is null");
        }

        // SET TRANSFORM TO DEFAULT
        d2dTarget->SetTransform(D2D1::Matrix3x2F::Identity());
        // d2dTarget->Clear(D2D1::ColorF(D2D1::ColorF::White));

        // DRAW THE GEOMETRY CONFIGURED ON GPU
        d2dTarget->DrawGeometry(pathGeometry_.get(), brushPath_.get(), 3);

        // TRACK IS DRAWN, NOW CARS
        // GET FROM LATEST DATA
        if (!data) {
            spdlog::warn("No data");
            return;
        }

        auto& cars = data->cars();
        auto carCount = cars.size();
        spdlog::trace("Rendering {} car positions", carCount);
        if (!carCount) {
            spdlog::warn("No car data received");
            return;
        }

        // DETERMINE THE SIZE OF EACH CAR WIDGET
        //  Find the minimum window dimension and `std::ceil(dim * 0.025f)`
        auto& winSize = renderSize_;
        auto winDimMin = static_cast<float>(std::max<UINT>(std::min<UINT>(winSize.width(), winSize.height()), 1));
        auto carRadius = std::max<float>(std::ceil(winDimMin * 0.025f), 3.0f);

        spdlog::trace("Rendering {} cars", cars.size());
        std::size_t idx = 0;
        for (auto& car : cars) {
            if (!car.driver || !car.index) {
                spdlog::warn("No car data received for {}", idx);
            }
            else {
                double carPercent = car.lapPercentComplete;
                auto carDistance = carPercent * pathTotalDistance_;
                auto carPointRes = ClosestValue(pathPointDistanceMap_, carDistance);
                if (!carPointRes.has_value()) {
                    spdlog::error(
                        "Unable to find point using percentage ({}).  totalDistance={}: {}",
                        carPercent,
                        pathTotalDistance_,
                        carPointRes.error().what()
                    );
                    continue;
                }

                auto carPoint = carPointRes.value();
                D2D1_ELLIPSE carEllipse{
                    .point = {carPoint.x(), carPoint.y()},
                    .radiusX = carRadius,
                    .radiusY = carRadius,
                };
                d2dTarget->FillEllipse(carEllipse, brushCarOuter_.get());
            }

            idx++;
        }
        // check_hresult(d2dTarget->EndDraw());
    }

    void TrackMapWidget::resetTargetResources() {
        brushPath_ = {};
        brushCarOuter_ = {};
    }

    void TrackMapWidget::createTargetResources(const std::shared_ptr<RenderTarget>& target) {
        std::scoped_lock lock(renderMutex_);
        if (targetResCreated_)
            return;

        auto dxr = resources();
        auto d2dFactory = dxr->getD2DFactory();
        auto dxDevice = dxr->getDXDevice();
        auto d2dTarget = target->d2d();

        if (!brushPath_)
            winrt::check_hresult(d2dTarget->CreateSolidColorBrush(D2D1::ColorF(D2D1::ColorF::White), brushPath_.put()));
        if (!brushCarOuter_)
            winrt::check_hresult(
                d2dTarget->CreateSolidColorBrush(D2D1::ColorF(D2D1::ColorF::Aqua), brushCarOuter_.put())
            );

        auto& trackMap = trackMap_;
        auto winSize = renderSize_;

        // SCALE THE MAP TO FIT THE WINDOW SIZE
        auto scaledTrackMap = Geometry::ScaleTrackMapToFit(trackMap, winSize);

        // CREATE THE GEOMETRY
        winrt::check_hresult(d2dFactory->CreatePathGeometry(pathGeometry_.put()));

        // SETUP A GEOMETRY SINK, WHICH IS
        // BASICLY A SET OF INSTRUCTIONS TO
        // CACHE ON GPU
        winrt::com_ptr<ID2D1GeometrySink> sink{nullptr};
        winrt::check_hresult(pathGeometry_->Open(sink.put()));
        sink->SetFillMode(D2D1_FILL_MODE_ALTERNATE);

        // PLOT THE TRACK MAP & CALCULATE DISTANCE -> POINT ON MAP
        // FOR LIVE CAR RENDERING
        TrackMap_Point lastPoint{};
        pathTotalDistance_ = 0.0f;
        pathPointDistanceMap_.clear();
        for (auto idx = 0; idx < scaledTrackMap.points_size(); idx++) {
            auto& point = scaledTrackMap.points(idx);
            auto d2point = D2D1::Point2F(point.x(), point.y());
            if (idx == 0) {
                sink->BeginFigure(d2point, D2D1_FIGURE_BEGIN_FILLED);
            }
            else {
                pathTotalDistance_ += DistanceBetween<double>(lastPoint, point);
                sink->AddLine(d2point);
            }

            // IF THIS SEGMENT HAD A VALID DISTANCE FROM THE PREVIOUS
            // THEN ADD IT TO THE MAP WITH THE POINT IT REPRESENTS
            if (!pathPointDistanceMap_.contains(pathTotalDistance_)) {
                pathPointDistanceMap_[pathTotalDistance_] = point;
            }
            lastPoint = point;
        }

        sink->EndFigure(D2D1_FIGURE_END_CLOSED);

        winrt::check_hresult(sink->Close());


        targetResCreated_ = true;
    }

    void TrackMapWidget::createResources() {
        std::scoped_lock lock(trackMapMutex_);
        if (pathGeometry_)
            return;

        auto dxr = resources();
        auto d2dFactory = dxr->getD2DFactory();
        auto dxDevice = dxr->getDXDevice();

        states_ = std::make_unique<CommonStates>(dxDevice.get());
        effect_ = std::make_unique<BasicEffect>(dxDevice.get());
        effect_->SetVertexColorEnabled(true);

        Utils::ThrowIfFailed(
            CreateInputLayoutFromEffect<VertexType>(dxDevice.get(), effect_.get(), inputLayout_.put())
        );

        auto context = dxr->getDXImmediateContext(); // m_deviceResources->GetD3DDeviceContext();
        batch_ = std::make_unique<PrimitiveBatch<VertexType>>(context.get());
    }
} // namespace IRacingTools::Shared::Graphics
