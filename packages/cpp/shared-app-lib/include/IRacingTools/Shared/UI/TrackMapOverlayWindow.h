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
#include <IRacingTools/Shared/SessionDataProvider.h>
#include <IRacingTools/Shared/UI/OverlayWindow.h>

namespace IRacingTools::Shared::UI {

class TrackMapOverlayWindow : public OverlayWindow
{
  std::mutex dataMutex_{};
  std::shared_ptr<Graphics::DX11TrackMapWidget> trackMapWidget_{nullptr};
  std::shared_ptr<SessionDataProvider> dataProvider_;
  const TrackMap trackMap_;
  SessionDataProvider::UnsubscribeFn unsubscribeFn_;
  std::shared_ptr<SessionDataUpdatedEvent> dataEvent_{nullptr};
  std::atomic_bool dataChanged_{false};

public:

  TrackMapOverlayWindow() = delete;
  TrackMapOverlayWindow(const TrackMap& trackMap, const std::shared_ptr<SessionDataProvider>& dataProvider);
  TrackMapOverlayWindow(TrackMapOverlayWindow &&) = delete;
  TrackMapOverlayWindow(const TrackMapOverlayWindow &) = delete;

  virtual ~TrackMapOverlayWindow() = default;


  virtual void render(const std::shared_ptr<Graphics::RenderTarget>& target) override;



};


};
