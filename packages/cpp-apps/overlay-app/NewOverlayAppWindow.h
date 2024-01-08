//
// Created by jglanz on 1/5/2024.
//

#pragma once
#include "IRacingTools/Shared/Graphics/DXResourceProvider.h"
#include "IRacingTools/Shared/Graphics/DXTrackMapRenderer.h"
#include "OverlayAppPCH.h"

using namespace IRacingTools::Shared::Graphics;

/******************************************************************
 *                                                                 *
 *  SimpleVertex                                                   *
 *                                                                 *
 ******************************************************************/

struct SimpleVertex
{
    D3DXVECTOR3 Pos;
    D3DXVECTOR2 Tex;
};

/******************************************************************
*                                                                 *
*  NewOverlayApp                                                  *
*                                                                 *
******************************************************************/

class NewOverlayApp
{
public:
    NewOverlayApp();
    ~NewOverlayApp();

    HRESULT Initialize();

    void RunMessageLoop();

private:

    HRESULT OnRender();

    void OnResize(UINT width, UINT height);
    void OnGetMinMaxInfo(MINMAXINFO *pMinMaxInfo);
    void OnTimer();

    static LRESULT CALLBACK WndProc(
        HWND hWnd,
        UINT message,
        WPARAM wParam,
        LPARAM lParam
        );



private:
    HWND m_hwnd;
    std::unique_ptr<DX11WindowResourcesProvider> windowResources_{nullptr};
    std::unique_ptr<DX11TrackMapRenderer> trackMapResources_{nullptr};

};

