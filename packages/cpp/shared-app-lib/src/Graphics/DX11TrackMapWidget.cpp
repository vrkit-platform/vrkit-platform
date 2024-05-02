//
// Created by jglanz on 1/7/2024.
//

// #include "../resource.h"

#include <IRacingTools/Shared/Graphics/DX11TrackMapWidget.h>
#include <IRacingTools/Shared/Macros.h>
#include <IRacingTools/Shared/SharedMemoryStorage.h>
#include <IRacingTools/Shared/TrackMapGeometry.h>
#include <winrt/base.h>

namespace IRacingTools::Shared::Graphics {

  namespace {

    // struct SimpleVertex {
    //     [[maybe_unused]] D3DXVECTOR3 Pos;
    //     [[maybe_unused]] D3DXVECTOR2 Tex;
    // };

    /******************************************************************
     *                                                                 *
     *  Static Data                                                    *
     *                                                                 *
     ******************************************************************/

    constexpr WCHAR kHelloWorld[] = L"Hello, World!";

    /*static*/
    constexpr D3D11_INPUT_ELEMENT_DESC kInputLayout[] = {{"POSITION", 0, DXGI_FORMAT_R32G32B32_FLOAT, 0, 0,  D3D11_INPUT_PER_VERTEX_DATA, 0},
                                                         {"TEXCOORD", 0, DXGI_FORMAT_R32G32_FLOAT,    0, 12, D3D11_INPUT_PER_VERTEX_DATA, 0},};

    // /*static*/ static const SimpleVertex kVertexArray[]
    //     = {{D3DXVECTOR3(-1.0f, -1.0f, 1.0f), D3DXVECTOR2(1.0f, 1.0f)},
    //        {D3DXVECTOR3(1.0f, -1.0f, 1.0f), D3DXVECTOR2(0.0f, 1.0f)},
    //        {D3DXVECTOR3(1.0f, 1.0f, 1.0f), D3DXVECTOR2(0.0f, 0.0f)},
    //        {D3DXVECTOR3(-1.0f, 1.0f, 1.0f), D3DXVECTOR2(1.0f, 0.0f)}};
    //
    /*static*/ constexpr SHORT kFacesIndexArray[] = {3, 1, 0, 2, 1, 3};

  } // namespace

  DX11TrackMapWidget::DX11TrackMapWidget(const std::shared_ptr<DXResources> &resources) : Renderable(resources) {
  }

  void DX11TrackMapWidget::render(const std::shared_ptr<RenderTarget> &target, const TrackMapState& data) {
    static float t = 0.0f;
    static DWORD dwTimeStart = 0;

    // TODO: Check if DXResources->getSize() changed too
    auto targetSize = target->getDimensions();
    auto sizeChanged = renderSize_ != targetSize;
    if (!ready_ || sizeChanged) {
      renderSize_ = targetSize;
      check_hresult(createResources(target));
      ready_ = true;
    }

    // Draw a gradient background before we draw the cube
    auto d2dTarget = target->d2d();//getD2DDeviceContext();
    if (d2dTarget) {
      if (!pathGeometry_) {
        IRT_LOG_AND_FATAL("Track map resources were not created yet");
      }
      // create a black brush
      winrt::com_ptr<ID2D1SolidColorBrush> blackBrush{};
      // winrt::check_hresult(d2dTarget->CreateSolidColorBrush(D2D1::ColorF(D2D1::ColorF::Black), blackBrush.put()));
      winrt::check_hresult(d2dTarget->CreateSolidColorBrush(D2D1::ColorF(D2D1::ColorF::White), blackBrush.put()));
      // d2dTarget->BeginDraw();


      d2dTarget->SetTransform(D2D1::Matrix3x2F::Identity());

      // d2dTarget->Clear(D2D1::ColorF(D2D1::ColorF::White));

      d2dTarget->DrawGeometry(pathGeometry_.get(), blackBrush.get(), 3);

      // check_hresult(d2dTarget->EndDraw());
    }

  }

  HRESULT DX11TrackMapWidget::createResources(const std::shared_ptr<RenderTarget> &target) {
    std::scoped_lock lock(trackMapMutex_);
    auto trackMapOpt = SharedMemoryStorage::GetInstance()->trackMap();
    if (pathGeometry_)
      pathGeometry_ = {};

    if (!trackMapOpt) {
      spdlog::warn("No track map loaded");
      return S_OK;
    }

    auto &trackMap = trackMapOpt.value();
    auto winSize = renderSize_;

    auto scaledTrackMap = Geometry::ScaleTrackMapToFit(trackMap, winSize);

    auto &d2dFactory = resources_->getD2DFactory();

    // Create the path geometry.
    winrt::check_hresult(d2dFactory->CreatePathGeometry(pathGeometry_.put()));

    winrt::com_ptr<ID2D1GeometrySink> sink{nullptr};

    // Write to the path geometry using the geometry sink. We are going to
    // create an hour glass.
    winrt::check_hresult(pathGeometry_->Open(sink.put()));

    sink->SetFillMode(D2D1_FILL_MODE_ALTERNATE);

    for (int idx = 0; idx < scaledTrackMap.points_size(); idx++) {
      auto &point = scaledTrackMap.points(idx);
      auto d2point = D2D1::Point2F(point.x(), point.y());
      if (idx == 0) {
        sink->BeginFigure(d2point, D2D1_FIGURE_BEGIN_FILLED);
      } else {
        sink->AddLine(d2point);
      }
    }

    sink->EndFigure(D2D1_FIGURE_END_CLOSED);

    winrt::check_hresult(sink->Close());
    return S_OK;
  }


} // namespace IRacingTools::Shared::Graphics
