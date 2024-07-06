#include <memory>

#include <IRacingTools/Shared/UI/BaseWindow.h>

#include <spdlog/spdlog.h>

#include <IRacingTools/Shared/SHM/SHM.h>

// #include "imgui.h"
// #include "imgui_impl_win32.h"
// #include "imgui_impl_dx11.h"

namespace IRacingTools::Shared::UI {



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


}
