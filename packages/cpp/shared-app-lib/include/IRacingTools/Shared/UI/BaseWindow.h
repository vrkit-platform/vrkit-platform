#pragma once

#include "../SharedAppLibPCH.h"

#include <IRacingTools/Shared/Geometry2D.h>

#include <SDL2pp/Texture.hh>
#include <SDL2pp/Renderer.hh>
#include <SDL2pp/Window.hh>
#include <SDL2pp/SDL.hh>
#include <SDL_syswm.h>
#include <SDL.h>

#include <spdlog/spdlog.h>


namespace IRacingTools::Shared::UI {
    /**
     * Get native window handle from SDL2pp::Window
     * @param win SDL2pp window instance
     * @return hwnd
     */
    HWND GetNativeHandleFromSDLWindow(const SDL2pp::Window* win);

    template <class WindowClazz>
    class BaseWindow {
        std::atomic_bool isCreated_{false};
    public:
        static LRESULT CALLBACK WindowProc(HWND windowHandle, UINT messageType, WPARAM wParam, LPARAM lParam) {
            WindowClazz* win{nullptr};

            if (messageType == WM_NCCREATE) {
                CREATESTRUCT* createProps = reinterpret_cast<CREATESTRUCT*>(lParam);
                win = static_cast<WindowClazz*>(createProps->lpCreateParams);
                SetWindowLongPtr(windowHandle, GWLP_USERDATA, reinterpret_cast<LONG_PTR>(win));

                win->windowHandle_ = windowHandle;
            } else {
                win = reinterpret_cast<WindowClazz*>(GetWindowLongPtr(windowHandle, GWLP_USERDATA));
            }
            if (win && win->isReady()) {
                return win->handleMessage(messageType, wParam, lParam);
            }

            return DefWindowProc(windowHandle, messageType, wParam, lParam);

        }

        static void DefaultWindowMessageLoop() {
            MSG msg{};
            while (GetMessage(&msg, nullptr, 0, 0)) {
                TranslateMessage(&msg);
                DispatchMessage(&msg);
            }
        }

        /**
         * Peek callback
         */
        using PeekWindowMessageCallback = std::function<void(MSG&)>;
        static void PeekWindowMessageLoop(const PeekWindowMessageCallback& callback) {
            MSG msg{};
            while (true) {
                if (PeekMessage(&msg, nullptr, 0, 0, PM_REMOVE)) {
                    TranslateMessage(&msg);
                    DispatchMessage(&msg);

                    if (msg.message == WM_QUIT)
                        break;
                }

                callback(msg);
            }
        }

        BaseWindow() {}

        bool isCreated() {
            return isCreated_;
        }

        virtual bool isReady() {
            return isCreated();
        }

        Size<UINT> getSize() {
            RECT rect;

            if (!windowHandle_ || !GetWindowRect(windowHandle_, &rect))
                return {};
            return {static_cast<UINT>(rect.right - rect.left), static_cast<UINT>(rect.bottom - rect.top)};
        }

        virtual void configureWindowClass(WNDCLASSEX& wc) {
            // by default don't do anything
        }

        virtual WindowClazz* create(
            PCWSTR name,
            DWORD style = 0,
            DWORD extendedStyle = 0,
            int x = CW_USEDEFAULT,
            int y = CW_USEDEFAULT,
            int width = CW_USEDEFAULT,
            int height = CW_USEDEFAULT,
            HWND parent = nullptr,
            HMENU menu = nullptr
        ) {
            WNDCLASSEX wc;
            ZeroMemory(&wc, sizeof(WNDCLASSEX));


            wc.lpfnWndProc = WindowClazz::WindowProc;
            wc.hInstance = GetModuleHandle(nullptr);
            wc.lpszClassName = WindowClazz::ClassName();

            configureWindowClass(wc);

            RegisterClassEx(&wc);

            windowHandle_ = CreateWindowEx(
                extendedStyle,
                WindowClazz::ClassName(),
                name,
                style,
                x,
                y,
                width,
                height,
                parent,
                menu,
                GetModuleHandle(nullptr),
                this
            );

            isCreated_ = true;

            return windowHandle_ ? static_cast<WindowClazz*>(this) : nullptr;
        }

        virtual void show() {
            ShowWindow(windowHandle_, SW_SHOW);
            UpdateWindow(windowHandle_);
        }

        virtual void hide() {
            ShowWindow(windowHandle_, SW_HIDE);
            UpdateWindow(windowHandle_);
        }


        HWND windowHandle() const { return windowHandle_; }

    protected:
        virtual LRESULT handleMessage(UINT messageType, WPARAM wParam, LPARAM lParam) = 0;

        HWND windowHandle_{nullptr};


    };
}
