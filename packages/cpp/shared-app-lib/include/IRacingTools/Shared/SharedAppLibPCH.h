//
// Created by jglanz on 1/5/2024.
//

#pragma once


// Modify the following defines if you have to target a platform prior to the ones specified below.
// Refer to MSDN for the latest info on corresponding values for different platforms.
#ifndef WINVER              // Allow use of features specific to Windows 7 or later.
#define WINVER 0x0A00       // Change this to the appropriate value to target other versions of Windows.
#endif

#ifndef _WIN32_WINNT        // Allow use of features specific to Windows 7 or later.
#define _WIN32_WINNT 0x0A00 // Change this to the appropriate value to target other versions of Windows.
#endif

#ifndef UNICODE
#define UNICODE
#endif

#define WIN32_LEAN_AND_MEAN     // Exclude rarely-used stuff from Windows headers
// Windows Header Files:
#include <windows.h>
#include <winternl.h>
#include <windowsx.h>

#include <dxgi1_6.h>

#include <d2d1.h>
#include <d2d1_3.h>
#include <d2d1helper.h>

#include <d3d11.h>
#include <d3d11_4.h>
#include <d3dx11effect.h>

#include <DirectXColors.h>
#include <DirectXMath.h>

#include <d3dkmthk.h>

// C RunTime Header Files
#include <minwinbase.h>
#include <cstdlib>

#include <dcomp.h>
#include <dwrite.h>
#include <wincodec.h>
#include <wrl/client.h>

// Desktop window manager API
#include <Dwmapi.h>

// fmt::core lib with wide char support
#include <fmt/xchar.h>
#include <fmt/core.h>

// logging
#include <spdlog/spdlog.h>

#include <winrt/Windows.Foundation.h>
#include <winrt/base.h>

// IRT Headers
#include <IRacingTools/Shared/Constants.h>