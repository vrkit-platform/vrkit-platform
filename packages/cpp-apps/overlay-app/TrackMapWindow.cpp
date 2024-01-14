//
// Created by jglanz on 1/5/2024.
//

#include "TrackMapWindow.h"

#include <IRacingTools/Shared/Macros.h>
#include <cassert>

/******************************************************************
 *                                                                 *
 *  TrackMapWindow::TrackMapWindow                                   *
 *                                                                 *
 *  Constructor -- initialize member data                          *
 *                                                                 *
 ******************************************************************/

TrackMapWindow::TrackMapWindow() : windowHandle_(nullptr) {}

/******************************************************************
 *                                                                 *
 *  TrackMapWindow::~TrackMapWindow                                  *
 *                                                                 *
 *  Destructor -- tear down member data                            *
 *                                                                 *
 ******************************************************************/

TrackMapWindow::~TrackMapWindow() {}

/******************************************************************
 *                                                                 *
 *  TrackMapWindow::initialize                                      *
 *                                                                 *
 *  Create application window and device-independent resources     *
 *                                                                 *
 ******************************************************************/
HRESULT TrackMapWindow::initialize() {
    HRESULT hr;

    // Register the window class.
    WNDCLASSEX wcex = {sizeof(WNDCLASSEX)};
    wcex.style = CS_HREDRAW | CS_VREDRAW;
    wcex.lpfnWndProc = TrackMapWindow::WndProc;
    wcex.cbClsExtra = 0;
    wcex.cbWndExtra = sizeof(LONG_PTR);
    wcex.hInstance = HINST_THISCOMPONENT;
    wcex.hbrBackground = nullptr;
    wcex.lpszMenuName = nullptr;
    wcex.hCursor = LoadCursor(nullptr, IDC_ARROW);
    wcex.lpszClassName = L"D2DDXGISampleApp";

    RegisterClassEx(&wcex);

    // Create the application window.
    //
    // Because the CreateWindow function takes its size in pixels, we
    // obtain the system DPI and use it to scale the window size.
    FLOAT dpiX, dpiY;

    windowHandle_ = CreateWindow(
        L"D2DDXGISampleApp",
        L"Direct2D Demo App",
        WS_OVERLAPPEDWINDOW,
        CW_USEDEFAULT,
        CW_USEDEFAULT,
        static_cast<UINT>(ceil(640.f)),
        static_cast<UINT>(ceil(480.f)),
        NULL,
        NULL,
        HINST_THISCOMPONENT,
        this
    );

    hr = windowHandle_ ? S_OK : E_FAIL;
    AssertMsg(SUCCEEDED(hr), "Failed to create window");
    // Create a timer and receive WM_TIMER messages at a rough
    // granularity of 33msecs. If you need a more precise timer,
    // consider modifying the message loop and calling more precise
    // timing functions.
    SetTimer(
        windowHandle_,
        0,      // timerId
        33,     // msecs
        nullptr // lpTimerProc
    );

    ShowWindow(windowHandle_, SW_SHOWNORMAL);

    UpdateWindow(windowHandle_);

    return hr;
}

/******************************************************************
 *                                                                 *
 *  TrackMapWindow::CreateDeviceIndependentResources                *
 *                                                                 *
 *  This method is used to create resources which are not bound    *
 *  to any device. Their lifetime effectively extends for the      *
 *  duration of the app. These resources include the D2D,          *
 *  DWrite, and WIC factories; and a DWrite Text Format object     *
 *  (used for identifying particular font characteristics) and     *
 *  a D2D geometry.                                                *
 *                                                                 *
 ******************************************************************/

/******************************************************************
 *                                                                 *
 *  TrackMapWindow::eventLoop                                  *
 *                                                                 *
 *  This is the main message pump for the application              *
 *                                                                 *
 ******************************************************************/

void TrackMapWindow::eventLoop() {
    MSG msg;

    while (GetMessage(&msg, nullptr, 0, 0)) {
        TranslateMessage(&msg);
        DispatchMessage(&msg);
    }
}

void TrackMapWindow::prepare() {
    if (!windowResources_) {
        windowResources_ = std::make_unique<DX11WindowResources>(windowHandle_);
    }

    if (!trackMapResources_) {
        trackMapResources_ = std::make_unique<DX11TrackMapResources>(windowResources_.get());
    }
}

/******************************************************************
 *                                                                 *
 *  TrackMapWindow::onRender                                        *
 *                                                                 *
 *  This method is called when the app needs to paint the window.  *
 *  It uses a D2D RT to draw a gradient background into the swap   *
 *  chain buffer. Then, it uses a separate D2D RT to draw a        *
 *  2D scene into a D3D texture. This texture is mapped onto a     *
 *  simple planar 3D model and displayed using D3D.                *
 *                                                                 *
 ******************************************************************/

HRESULT TrackMapWindow::onRender() {
    HRESULT hr = S_OK;

    static float t = 0.0f;
    static DWORD dwTimeStart = 0;

    prepare();

    trackMapResources_->render(GetTickCount());
    //auto ctx = windowResources_->getDeviceContext();
    // ctx->Cl
    // ID3D11DeviceContext *deviceContext = nullptr;
    // m_pDevice->GetImmediateContext(&deviceContext);
    //

    //   DWORD dwTimeCur = GetTickCount();
    //   if (dwTimeStart == 0) {
    //     dwTimeStart = dwTimeCur;
    //   }
    //   t = (dwTimeCur - dwTimeStart) / 3000.0f;
    //
    //   float a = (t * 360.0f) * ((float)D3DX_PI / 180.0f);
    //   D3DMatrixRotationY(&m_WorldMatrix, a);
    //
    //   // Swap chain will tell us how big the back buffer is
    //   DXGI_SWAP_CHAIN_DESC swapDesc;
    //   hr = m_pSwapChain->GetDesc(&swapDesc);
    //
    //   if (SUCCEEDED(hr)) {
    //     deviceContext->ClearDepthStencilView(m_pDepthStencilView, D3D11_CLEAR_DEPTH,
    //                                      1, 0);
    //
    //     // Draw a gradient background before we draw the cube
    //     if (m_pBackBufferRT) {
    //       m_pBackBufferRT->BeginDraw();
    //
    //       m_pBackBufferGradientBrush->SetTransform(
    //           D2D1::Matrix3x2F::Scale(m_pBackBufferRT->GetSize()));
    //
    //       D2D1_RECT_F rect =
    //           D2D1::RectF(0.0f, 0.0f, (float)swapDesc.BufferDesc.Width,
    //                       (float)swapDesc.BufferDesc.Height);
    //
    //       m_pBackBufferRT->FillRectangle(&rect, m_pBackBufferGradientBrush);
    //
    //       hr = m_pBackBufferRT->EndDraw();
    //     }
    //     if (SUCCEEDED(hr)) {
    //       m_pDiffuseVariableNoRef->SetResource(nullptr);
    //       m_pTechniqueNoRef->GetPassByIndex(0)->Apply(0,deviceContext);
    //
    //       // Draw the D2D content into a D3D surface.
    //       hr = RenderD2DContentIntoSurface();
    //     }
    //     if (SUCCEEDED(hr)) {
    //       m_pDiffuseVariableNoRef->SetResource(m_pTextureRV);
    //
    //       // Update variables that change once per frame.
    //       m_pWorldVariableNoRef->SetMatrix((float *)&m_WorldMatrix);
    //
    //       // Set the index buffer.
    //       deviceContext->IASetIndexBuffer(m_pFacesIndexBuffer, DXGI_FORMAT_R16_UINT,
    //                                   0);
    //
    //       // Render the scene
    //       m_pTechniqueNoRef->GetPassByIndex(0)->Apply(0,deviceContext);
    //
    //       deviceContext->DrawIndexed(ARRAYSIZE(s_FacesIndexArray), 0, 0);
    //
    //       // Draw some text using a red brush on top of everything
    //       if (m_pBackBufferRT) {
    //         m_pBackBufferRT->BeginDraw();
    //
    //         m_pBackBufferRT->SetTransform(D2D1::Matrix3x2F::Identity());
    //
    //         // Text format object will center the text in layout
    //         D2D1_SIZE_F rtSize = m_pBackBufferRT->GetSize();
    //         m_pBackBufferRT->DrawText(
    //             sc_helloWorld, ARRAYSIZE(sc_helloWorld) - 1, m_pTextFormat,
    //             D2D1::RectF(0.0f, 0.0f, rtSize.width, rtSize.height),
    //             m_pBackBufferTextBrush);
    //
    //         hr = m_pBackBufferRT->EndDraw();
    //       }
    //       if (SUCCEEDED(hr)) {
    //         hr = m_pSwapChain->Present(1, 0);
    //       }
    //     }
    //   }
    // }
    //
    // // DXSafeRelease(&deviceContext);
    // // If the device is lost for any reason, we need to recreate it
    // if (hr == DXGI_ERROR_DEVICE_RESET || hr == DXGI_ERROR_DEVICE_REMOVED ||
    //     hr == D2DERR_RECREATE_TARGET) {
    //   hr = S_OK;
    //
    //   DiscardDeviceResources();
    // }
    // DXSafeRelease(&deviceContext);
    return hr;
}

/******************************************************************
 *                                                                 *
 *  TrackMapWindow::RenderD2DContentIntoSurface                     *
 *                                                                 *
 *  This method renders a simple 2D scene into a D2D render target *
 *  that maps to a D3D texture. It's important that the return     *
 *  code from RT->EndDraw() is handed back to the caller, since    *
 *  it's possible for the render target device to be lost while    *
 *  the application is running, and the caller needs to handle     *
 *  that error condition.                                          *
 *                                                                 *
 ******************************************************************/

// HRESULT TrackMapWindow::RenderD2DContentIntoSurface() {
//   HRESULT hr;
//   D2D1_SIZE_F renderTargetSize = m_pRenderTarget->GetSize();
//
//   m_pRenderTarget->BeginDraw();
//
//   m_pRenderTarget->SetTransform(D2D1::Matrix3x2F::Identity());
//
//   m_pRenderTarget->Clear(D2D1::ColorF(D2D1::ColorF::White));
//
//   m_pRenderTarget->FillRectangle(
//       D2D1::RectF(0.0f, 0.0f, renderTargetSize.width, renderTargetSize.height),
//       m_pGridPatternBitmapBrush);
//
//   D2D1_SIZE_F size = m_pBitmap->GetSize();
//
//   m_pRenderTarget->DrawBitmap(m_pBitmap,
//                               D2D1::RectF(0.0f, 0.0f, size.width, size.height));
//
//   // Draw the bitmap at the bottom corner of the window
//   m_pRenderTarget->DrawBitmap(
//       m_pBitmap, D2D1::RectF(renderTargetSize.width - size.width,
//                              renderTargetSize.height - size.height,
//                              renderTargetSize.width, renderTargetSize.height));
//
//   // Set the world transform to a 45 degree rotation at the center of the render
//   // target and write "Hello, World"
//   m_pRenderTarget->SetTransform(D2D1::Matrix3x2F::Rotation(
//       45,
//       D2D1::Point2F(renderTargetSize.width / 2, renderTargetSize.height / 2)));
//
//   m_pRenderTarget->DrawText(
//       sc_helloWorld, ARRAYSIZE(sc_helloWorld) - 1, m_pTextFormat,
//       D2D1::RectF(0, 0, renderTargetSize.width, renderTargetSize.height),
//       m_pBlackBrush);
//
//   // Reset back to the identity transform
//   m_pRenderTarget->SetTransform(
//       D2D1::Matrix3x2F::Translation(0, renderTargetSize.height - 200));
//
//   m_pRenderTarget->FillGeometry(m_pPathGeometry, m_pLGBrush);
//
//   m_pRenderTarget->SetTransform(
//       D2D1::Matrix3x2F::Translation(renderTargetSize.width - 200, 0));
//
//   m_pRenderTarget->FillGeometry(m_pPathGeometry, m_pLGBrush);
//
//   hr = m_pRenderTarget->EndDraw();
//
//   return hr;
// }
//
// /******************************************************************
//  *                                                                 *
//  *  TrackMapWindow::onResize                                        *
//  *                                                                 *
//  *  This method is called in response to a WM_SIZE window message  *
//  *                                                                 *
//  *  When the window resizes, we need to resize the D3D swap chain  *
//  *  and remap the corresponding D2D render target                  *
//  *                                                                 *
//  ******************************************************************/

void TrackMapWindow::onResize(UINT width, UINT height) {
    prepare();

    Size newWindowSize(width, height);
    windowResources_->updateSize(newWindowSize);
    trackMapResources_->createD3DSizedResources();
    // if (!m_pDevice) {
    //   CreateDeviceResources();
    // } else {
    //   RecreateSizedResources(width, height);
    // }
}

/******************************************************************
 *                                                                 *
 *  TrackMapWindow::onGetMinMaxInfo                                 *
 *                                                                 *
 *  This method is called in response to a WM_GETMINMAXINFO window *
 *  message. We use it to set the minimum size of the window.      *
 *                                                                 *
 ******************************************************************/

void TrackMapWindow::onGetMinMaxInfo(MINMAXINFO *pMinMaxInfo) {
    // FLOAT dpiX, dpiY;
    // m_pD2DFactory->GetDesktopDpi(&dpiX, &dpiY);
    //
    // pMinMaxInfo->ptMinTrackSize.x = static_cast<UINT>(ceil(200.f * dpiX / 96.f));
    // pMinMaxInfo->ptMinTrackSize.y = static_cast<UINT>(ceil(200.f * dpiY / 96.f));
}

/******************************************************************
 *                                                                 *
 *  TrackMapWindow::onTimer                                         *
 *                                                                 *
 *                                                                 *
 ******************************************************************/

void TrackMapWindow::onTimer() {
    InvalidateRect(windowHandle_, nullptr, FALSE);
}

/******************************************************************
 *                                                                 *
 *  TrackMapWindow::WndProc                                         *
 *                                                                 *
 *  This static method handles our app's window messages           *
 *                                                                 *
 ******************************************************************/

LRESULT CALLBACK TrackMapWindow::WndProc(HWND hWnd, UINT message, WPARAM wParam, LPARAM lParam) {
    LRESULT result = 0;

    if (message == WM_CREATE) {
        auto pcs = reinterpret_cast<LPCREATESTRUCT>(lParam);
        auto scene = static_cast<TrackMapWindow *>(pcs->lpCreateParams);

        ::SetWindowLongPtrW(hWnd, GWLP_USERDATA, reinterpret_cast<LONG_PTR>(scene));

        result = 1;
    } else {
        auto scene = reinterpret_cast<TrackMapWindow *>(::GetWindowLongPtrW(hWnd, GWLP_USERDATA));
        bool wasHandled = false;

        if (scene) {
            switch (message) {
                case WM_SIZE: {
                    UINT width = LOWORD(lParam);
                    UINT height = HIWORD(lParam);
                    scene->onResize(width, height);
                }
                    result = 0;
                    wasHandled = true;
                    break;

                case WM_GETMINMAXINFO: {
                    auto pMinMaxInfo = reinterpret_cast<MINMAXINFO *>(lParam);
                    scene->onGetMinMaxInfo(pMinMaxInfo);
                }
                    result = 0;
                    wasHandled = true;
                    break;

                case WM_PAINT:
                case WM_DISPLAYCHANGE: {
                    PAINTSTRUCT ps;
                    BeginPaint(hWnd, &ps);
                    scene->onRender();
                    EndPaint(hWnd, &ps);
                }
                    result = 0;
                    wasHandled = true;
                    break;

                case WM_TIMER: {
                    scene->onTimer();
                }
                    result = 0;
                    wasHandled = true;
                    break;

                case WM_DESTROY: {
                    PostQuitMessage(0);
                }
                    result = 1;
                    wasHandled = true;
                    break;
            }
        }

        if (!wasHandled) {
            result = DefWindowProc(hWnd, message, wParam, lParam);
        }
    }

    return result;
}
