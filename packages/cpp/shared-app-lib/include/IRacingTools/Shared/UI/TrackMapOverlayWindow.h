//
// Created by jglanz on 5/1/2024.
//

#pragma once


#include <Dwmapi.h>

#include <SDL2pp/Texture.hh>
#include <SDL2pp/Renderer.hh>
#include <SDL2pp/Window.hh>
#include <SDL2pp/SDL.hh>
#include <SDL_syswm.h>
#include <SDL.h>

#include <spdlog/spdlog.h>

#include <IRacingTools/SDK/Utils/EventEmitter.h>
#include <IRacingTools/Shared/UI/OverlayWindow.h>

namespace IRacingTools::Shared::UI {

class TrackMapOverlayWindow : public OverlayWindow
{
public:
  using State = Graphics::TrackMapState;
  using StatePtr = std::shared_ptr<State>;

private:
  std::shared_ptr<Graphics::DX11TrackMapWidget> trackMapWidget_{nullptr};
  StatePtr state_{};

public:
  struct {
    SDK::Utils::EventEmitter<const StatePtr&> StateChange{};
  } events;

  TrackMapOverlayWindow();
  TrackMapOverlayWindow(TrackMapOverlayWindow &&) = delete;
  TrackMapOverlayWindow(const TrackMapOverlayWindow &) = delete;

  virtual ~TrackMapOverlayWindow() = default;

  /**
   * @brief Returns the state prior to invocation.  If a newState is provided,
   * the before instance is returned & the internal value is updated.
   *
   * NOTE: The state changed event will fire before return on the calling thread
   *
   * @param newState
   * @return
   */
  StatePtr state(const StatePtr& newState = nullptr) {
    auto state = state_;
    if (newState) {
      state_ = newState;
      events.StateChange.publish(state_);
    }
    return state;
  }

  virtual void render(const std::shared_ptr<Graphics::RenderTarget>& target) override;



};


};
