#pragma once

#include <IRacingTools/Shared/SharedAppLibPCH.h>
#include <IRacingTools/Shared/Geometry2D.h>
#include <IRacingTools/SDK/Utils/EventEmitter.h>

#include <spdlog/spdlog.h>


namespace IRacingTools::Shared::UI {
    bool MakeWindowTransparent(HWND hWnd);

    class Window {
        public:
            Window() = default;
            virtual ~Window() = default;

            struct CreateOptions {
                PCWSTR name{L""};
                DWORD style{0};
                DWORD extendedStyle{0};
                int x{CW_USEDEFAULT};
                int y{CW_USEDEFAULT};
                int width{CW_USEDEFAULT};
                int height{CW_USEDEFAULT};
                HWND parent{nullptr};
                HMENU menu{nullptr};
            };


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
    };

    /**
     * Get native window handle from SDL2pp::Window
     * @param win SDL2pp window instance
     * @return hwnd
     */
    // HWND GetNativeHandleFromSDLWindow(const SDL2pp::Window* win);

    template <class WindowClazz>
    class BaseWindow : public Window {
        public:
            static LRESULT CALLBACK WindowProc(HWND windowHandle, UINT messageType, WPARAM wParam, LPARAM lParam) {
                BaseWindow* win;

                if (messageType == WM_NCCREATE) {
                    auto createProps = reinterpret_cast<CREATESTRUCT*>(lParam);
                    win = static_cast<WindowClazz*>(createProps->lpCreateParams);
                    SetWindowLongPtr(windowHandle, GWLP_USERDATA, reinterpret_cast<LONG_PTR>(win));

                    win->windowHandle_ = windowHandle;
                } else {
                    win = reinterpret_cast<BaseWindow*>(GetWindowLongPtr(windowHandle, GWLP_USERDATA));
                }
                if (win && win->isReady()) {
                    return win->handleMessage(messageType, wParam, lParam);
                }

                return DefWindowProc(windowHandle, messageType, wParam, lParam);
            }

            virtual ~BaseWindow() override = default;

            BaseWindow() = default;

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

            virtual CreateOptions getCreateOptions() {
                return CreateOptions{};
            }

            virtual WNDCLASSEX getWindowClassOptions() {
                WNDCLASSEX wc;
                ZeroMemory(&wc, sizeof(WNDCLASSEX));


                wc.lpfnWndProc = WindowClazz::WindowProc;
                wc.hInstance = GetModuleHandle(nullptr);
                wc.lpszClassName = WindowClazz::ClassName();
                return wc;
            }

            virtual bool create(const CreateOptions& options) {
                std::scoped_lock lock(stateMutex_);
                if (isCreated_) {
                    return isCreated_;
                }

                auto wc = getWindowClassOptions();

                RegisterClassEx(&wc);

                windowHandle_ = CreateWindowEx(
                    options.extendedStyle,
                    WindowClazz::ClassName(),
                    options.name,
                    options.style,
                    options.x,
                    options.y,
                    options.width,
                    options.height,
                    options.parent,
                    options.menu,
                    GetModuleHandle(nullptr),
                    this
                );

                isCreated_ = windowHandle_;

                return isCreated_;
            }

            virtual bool createResources() {
                if (!isCreated_)
                    return false;

                return true;
            }

            virtual void show() {
                ShowWindow(windowHandle_, SW_SHOW);
                UpdateWindow(windowHandle_);
            }

            virtual void hide() {
                ShowWindow(windowHandle_, SW_HIDE);
                UpdateWindow(windowHandle_);
            }


            HWND windowHandle() const {
                return windowHandle_;
            }

            virtual void initialize() {
                create(getCreateOptions());
                createResources();
                show();
            }

            struct {
                SDK::Utils::EventEmitter<WindowClazz*, PixelSize, PixelSize> onResize{};
            } events;

        protected:
            virtual void onResize(const PixelSize& newSize, const PixelSize& oldSize) {
                events.onResize.publish(reinterpret_cast<WindowClazz*>(this), newSize, oldSize);
            }

            virtual std::optional<LRESULT> defaultHandleMessage(UINT messageType, WPARAM wParam, LPARAM lParam) {
                switch (messageType) {
                case WM_SIZE: {
                    UINT width = LOWORD(lParam);
                    UINT height = HIWORD(lParam);

                    PixelSize newSize{width, height};
                    PixelSize oldSize = windowSize_;

                    windowSize_ = newSize;
                    onResize(newSize, oldSize);
                    return 0;
                }
                default:
                    return std::nullopt;
                }
            }


            virtual LRESULT handleMessage(UINT messageType, WPARAM wParam, LPARAM lParam) {
                auto defRes = defaultHandleMessage(messageType, wParam, lParam);
                return defRes.has_value() ? defRes.value() : DefWindowProc(windowHandle_, messageType, wParam, lParam);
            }


            HWND windowHandle_{nullptr};
            std::atomic_bool isCreated_{false};
            PixelSize windowSize_{};

        private:
            std::mutex stateMutex_{};
    };
}
