//
// Created by jglanz on 1/5/2024.
//

#pragma once
#include "OverlayAppPCH.h"

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
*  OverlayApp                                                  *
*                                                                 *
******************************************************************/

class OverlayApp
{
public:
    OverlayApp();
    ~OverlayApp();

    HRESULT Initialize();

    void RunMessageLoop();

private:
    HRESULT CreateDeviceIndependentResources();
    HRESULT CreateDeviceResources();
    HRESULT RecreateSizedResources(UINT nWidth, UINT nHeight);
    HRESULT CreateD3DDeviceResources();
    HRESULT CreateD2DDeviceResources();

    HRESULT CreateGridPatternBrush(
        ID2D1RenderTarget *pRenderTarget,
        ID2D1BitmapBrush **ppBitmapBrush
        );

    void DiscardDeviceResources();

    HRESULT OnRender();

    void OnResize(UINT width, UINT height);
    void OnGetMinMaxInfo(MINMAXINFO *pMinMaxInfo);
    void OnTimer();

    HRESULT RenderD2DContentIntoSurface();

    HRESULT CreateD3DDevice(
        IDXGIAdapter *pAdapter,
        D3D_DRIVER_TYPE driverType,
        UINT flags,
        ID3D11Device **ppDevice
        );

    static LRESULT CALLBACK WndProc(
        HWND hWnd,
        UINT message,
        WPARAM wParam,
        LPARAM lParam
        );

    HRESULT LoadResourceBitmap(
        ID2D1RenderTarget *pRenderTarget,
        IWICImagingFactory *pIWICFactory,
        PCWSTR resourceName,
        PCWSTR resourceType,
        UINT destinationWidth,
        UINT destinationHeight,
        ID2D1Bitmap **ppBitmap
        );

    HRESULT LoadResourceShader(
        ID3D11Device *pDevice,
        PCWSTR pszResource,
        ID3DX11Effect **ppShader
        );

private:
    HWND m_hwnd;
    ID2D1Factory *m_pD2DFactory;
    IWICImagingFactory *m_pWICFactory;
    IDWriteFactory *m_pDWriteFactory;

    //Device-Dependent Resources
    ID3D11Device *m_pDevice;

    IDXGISwapChain *m_pSwapChain;
    ID3D11RenderTargetView *m_pRenderTargetView;
    ID3D11RasterizerState *m_pState;
    ID3D11Texture2D *m_pDepthStencil;
    ID3D11DepthStencilView *m_pDepthStencilView;
    ID3D11Texture2D *m_pOffscreenTexture;
    ID3DX11Effect *m_pShader;
    ID3D11Buffer *m_pVertexBuffer;
    ID3D11InputLayout *m_pVertexLayout;
    ID3D11Buffer *m_pFacesIndexBuffer;
    ID3D11ShaderResourceView *m_pTextureRV;

    ID2D1RenderTarget *m_pBackBufferRT;
    ID2D1SolidColorBrush *m_pBackBufferTextBrush;
    ID2D1LinearGradientBrush *m_pBackBufferGradientBrush;
    ID2D1BitmapBrush *m_pGridPatternBitmapBrush;

    ID2D1RenderTarget *m_pRenderTarget;
    ID2D1LinearGradientBrush *m_pLGBrush;
    ID2D1SolidColorBrush *m_pBlackBrush;
    ID2D1Bitmap *m_pBitmap;

    ID3DX11EffectTechnique *m_pTechniqueNoRef;
    ID3DX11EffectMatrixVariable *m_pWorldVariableNoRef;
    ID3DX11EffectMatrixVariable *m_pViewVariableNoRef;
    ID3DX11EffectMatrixVariable *m_pProjectionVariableNoRef;
    ID3DX11EffectShaderResourceVariable *m_pDiffuseVariableNoRef;

    // Device-Independent Resources
    IDWriteTextFormat *m_pTextFormat;
    ID2D1PathGeometry *m_pPathGeometry;

    D3DXMATRIX m_WorldMatrix;
    D3DXMATRIX m_ViewMatrix;
    D3DXMATRIX m_ProjectionMatrix;

    static const D3D11_INPUT_ELEMENT_DESC s_InputLayout[];
    static const SimpleVertex s_VertexArray[];
    static const SHORT s_FacesIndexArray[];
};

