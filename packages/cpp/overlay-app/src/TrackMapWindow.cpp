//
// Created by jglanz on 1/5/2024.
//

#include "TrackMapWindow.h"

#include <cassert>
#include <winrt/base.h>

#include <IRacingTools/Shared/Macros.h>

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

TrackMapWindow::~TrackMapWindow() = default;

/******************************************************************
 *                                                                 *
 *  TrackMapWindow::initialize                                      *
 *                                                                 *
 *  Create application window and device-independent resources     *
 *                                                                 *
 ******************************************************************/
HRESULT TrackMapWindow::initialize() {
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
    wcex.lpszClassName = kWindowClass;

    RegisterClassEx(&wcex);

    // Create the application window.
    //
    // Because the CreateWindow function takes its size in pixels, we
    // obtain the system DPI and use it to scale the window size.
    FLOAT dpiX, dpiY;

    windowHandle_ = CreateWindow(
        kWindowClass,
        kWindowClass,
        WS_OVERLAPPEDWINDOW,
        CW_USEDEFAULT,
        CW_USEDEFAULT,
        static_cast<UINT>(ceil(640.f)),
        static_cast<UINT>(ceil(480.f)),
        nullptr,
        nullptr,
        HINST_THISCOMPONENT,
        this
    );

    HRESULT hr = windowHandle_ ? S_OK : E_FAIL;
    winrt::check_hresult(hr);

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
    prepare();

    winrt::check_hresult(trackMapResources_->render(GetTickCount()));

    return S_OK;
}


/******************************************************************
 *                                                                 *
 *  TrackMapWindow::onResize                                        *
 *                                                                 *
 *  This method is called in response to a WM_SIZE window message  *
 *                                                                 *
 *  When the window resizes, we need to resize the D3D swap chain  *
 *  and remap the corresponding D2D render target                  *
 *                                                                 *
 ******************************************************************/

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
