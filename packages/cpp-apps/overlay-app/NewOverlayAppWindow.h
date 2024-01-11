//
// Created by jglanz on 1/5/2024.
//

#pragma once
#include <IRacingTools/Shared/Graphics/DX11TrackMapResources.h>
#include <IRacingTools/Shared/Graphics/DXResources.h>
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



    HWND windowHandle_;
    std::unique_ptr<DX11WindowResources> windowResources_{nullptr};
    std::unique_ptr<DX11TrackMapResources> trackMapResources_{nullptr};

};

