//
// Created by jglanz on 1/5/2024.
//

#pragma once
#include "OverlayAppPCH.h"
#include <IRacingTools/Shared/Graphics/TrackMapWidget.h>
#include <IRacingTools/Shared/Graphics/DXResources.h>

using namespace IRacingTools::Shared::Graphics;

/******************************************************************
 *                                                                 *
 *  SimpleVertex                                                   *
 *                                                                 *
 ******************************************************************/

struct SimpleVertex {
    D3DXVECTOR3 Pos;
    D3DXVECTOR2 Tex;
};

/******************************************************************
*                                                                 *
*  TrackMapWindow                                                  *
*                                                                 *
******************************************************************/

class TrackMapWindow {
public:
    static constexpr auto kWindowClass = L"TrackMapWindow";

    TrackMapWindow();
    ~TrackMapWindow();

    HRESULT initialize();

    void eventLoop();

private:
    void prepare();
    HRESULT onRender();

    void onResize(UINT width, UINT height);
    void onGetMinMaxInfo(MINMAXINFO *pMinMaxInfo);
    void onTimer();

    static LRESULT CALLBACK WndProc(HWND hWnd, UINT message, WPARAM wParam, LPARAM lParam);

    HWND windowHandle_;
    std::unique_ptr<DX11WindowResources> windowResources_{nullptr};
    std::unique_ptr<TrackMapWidget> trackMapResources_{nullptr};
};
