//
// Created by jglanz on 1/7/2024.
//

#pragma once

#include "../SharedAppLibPCH.h"
#include "DX11Resources.h"
#include "Renderable.h"
#include "RenderTarget.h"
#include <IRacingTools/Models/TrackMapData.pb.h>

namespace IRacingTools::Shared::Graphics {


  struct TrackMapState {
    struct Car {
      /**
       * @brief Index in data set
       *
       * -1 == unknown
       */
      std::int32_t dataIndex{-1};

      /**
       * @brief Is the primary (focused) car
       */
      bool isPrimary{false};

      /**
       * @brief Position in session (Race/Quali/Practice)
       */
      std::uint32_t position{0};

      /**
       * @brief  ID is car #
       */
      std::uint32_t id{0};
    };

    /**
     * @brief the primary (focused) car
     */
    Car primaryCar{};

    /**
     * @brief All driver/car data
     */
    std::vector<Car> cars{};

    /**
     * @brief is data valid & available
     * @return
     */
    bool isAvailable() {
      return primaryCar.position > 0 || cars.size();
    }

    /**
     * @see `isAvailable()`
     */
    bool isValid() {
      return isAvailable();
    }
  };


  class DX11TrackMapWidget : public Renderable<TrackMapState> {
  public:

    explicit DX11TrackMapWidget(const std::shared_ptr<DXResources>& resources);

    void render(const std::shared_ptr<RenderTarget>& target, const TrackMapState& data) override;

  private:
    HRESULT createResources(const std::shared_ptr<RenderTarget> &target);

    std::atomic_bool ready_{false};
    std::atomic_bool disposed_{false};
    Size<UINT> renderSize_{0,0};
    std::optional<TrackMapState> trackMapStateOpt_{std::nullopt};
    std::optional<TrackMap> trackMapOpt_{std::nullopt};

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
