//
// Created by jglanz on 5/1/2024.
//

#pragma once

#include <IRacingTools/SDK/Utils/EventEmitter.h>
#include <IRacingTools/Shared/SessionDataProvider.h>
#include <IRacingTools/Shared/Graphics/IPCRenderer.h>
#include <IRacingTools/Shared/UI/OverlayWindow.h>

namespace IRacingTools::Shared::UI {
    using namespace IRacingTools::Models::Telemetry;

    class TrackMapOverlayWindow : public OverlayWindow<TrackMapOverlayWindow> {
        std::mutex dataMutex_{};
        std::shared_ptr<Graphics::TrackMapWidget> trackMapWidget_{nullptr};
        std::shared_ptr<SessionDataProvider> dataProvider_;
        std::shared_ptr<Graphics::IPCRenderer> ipcRenderer_{nullptr};
        const TrackMap trackMap_;
        SessionDataProvider::UnsubscribeFn unsubscribeFn_;
        std::shared_ptr<SessionDataUpdatedDataEvent> dataEvent_{nullptr};
        std::atomic_bool dataChanged_{false};

    public:
        static constexpr PCWSTR ClassName() {
            return L"TrackMap Overlay";
        }

        TrackMapOverlayWindow() = delete;
        TrackMapOverlayWindow(const TrackMap& trackMap, const std::shared_ptr<SessionDataProvider>& dataProvider);
        TrackMapOverlayWindow(TrackMapOverlayWindow&&) = delete;
        TrackMapOverlayWindow(const TrackMapOverlayWindow&) = delete;

        virtual ~TrackMapOverlayWindow() override = default;

        virtual void render(const std::shared_ptr<Graphics::RenderTarget>& target) override;

        // void initialize();
    };
};
