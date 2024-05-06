#include <memory>

#include <IRacingTools/Shared/UI/BaseWindow.h>

#include <SDL2pp/Texture.hh>
#include <SDL2pp/Renderer.hh>
#include <SDL2pp/Window.hh>
#include <SDL2pp/SDL.hh>
#include <SDL_syswm.h>
#include <SDL.h>
#include <spdlog/spdlog.h>

#include <IRacingTools/Shared/SHM.h>

// #include "imgui.h"
// #include "imgui_impl_win32.h"
// #include "imgui_impl_dx11.h"

namespace IRacingTools::Shared::UI {
    using namespace SDL2pp;

    namespace {
        bool MakeWindowTransparent(HWND hWnd);

        int FindD3D11Driver(Window* window);

        /**
         * Configure layered window transparency
         *
         * @param windowHandle
         * @param colorKey
         * @return
         */
        bool MakeWindowTransparent(HWND windowHandle, COLORREF colorKey) {
            SetWindowLong(windowHandle, GWL_EXSTYLE, GetWindowLong(windowHandle, GWL_EXSTYLE) | WS_EX_LAYERED);

            // Set transparency color
            //return SetLayeredWindowAttributes(hWnd, colorKey, 255, LWA_ALPHA);
            return SetLayeredWindowAttributes(windowHandle, colorKey, 0, LWA_ALPHA);
        }

        /**
         * Find the D3D11 driver in SDL renderers
         *
         * @param window
         * @return
         */
        int FindD3D11Driver(Window* window) {
            SDL_Renderer* renderer = nullptr;
            for (auto i = 0; i < SDL_GetNumRenderDrivers(); ++i) {
                SDL_RendererInfo rendererInfo = {};
                SDL_GetRenderDriverInfo(i, &rendererInfo);
                if (rendererInfo.name != std::string("direct3d11")) {
                    continue;
                }

                //renderer = SDL_CreateRenderer(window->Get(), i, 0 );
                return i;
            }
            abort();
        }
    }

    /**
     * Get native window from SDL2pp window
     *
     * @param win
     * @return
     */
    HWND GetNativeHandleFromSDLWindow(const Window* win) {
        auto sdlWindow = win->Get();

        SDL_SysWMinfo sdlInfo;
        SDL_VERSION(&sdlInfo.version);
        if (!SDL_GetWindowWMInfo(sdlWindow, &sdlInfo)) {
            spdlog::error("Error getting window: {}", SDL_GetError());
            return nullptr;
        }
        return sdlInfo.info.win.window;
    }
}
