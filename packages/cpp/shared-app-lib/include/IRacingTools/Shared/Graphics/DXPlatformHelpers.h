// Copied from DXTK
//--------------------------------------------------------------------------------------
// File: PlatformHelpers.h
//
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
//
// http://go.microsoft.com/fwlink/?LinkId=248929
// http://go.microsoft.com/fwlink/?LinkID=615561
//--------------------------------------------------------------------------------------

#pragma once

#pragma warning(disable : 4324)

#include <cstdarg>
#include <exception>
#include <memory>
#include <windows.h>

#ifndef MAKEFOURCC

#define MAKEFOURCC(ch0, ch1, ch2, ch3) \
    (static_cast<uint32_t>(static_cast<uint8_t>(ch0)) | (static_cast<uint32_t>(static_cast<uint8_t>(ch1)) << 8) \
     | (static_cast<uint32_t>(static_cast<uint8_t>(ch2)) << 16) \
     | (static_cast<uint32_t>(static_cast<uint8_t>(ch3)) << 24))
#endif /* defined(MAKEFOURCC) */

// See https://walbourn.github.io/modern-c++-bitmask-types/
#ifndef ENUM_FLAGS_CONSTEXPR

#ifdef NTDDI_WIN10_RS1

#define ENUM_FLAGS_CONSTEXPR constexpr

#else

#define ENUM_FLAGS_CONSTEXPR const

#endif
#endif

namespace IRacingTools::Shared::Utils {

  /**
   * @brief COM object error exception
   */
  class COMException : public std::exception {
  public:
    COMException(HRESULT hr) noexcept: result(hr) {
    }

    const char *what() const noexcept override {
      static char s_str[64] = {};
      sprintf_s(s_str, "Failure with HRESULT of %08X", static_cast<unsigned int>(result));
      return s_str;
    }

    HRESULT getResult() const noexcept {
      return result;
    }

  private:
    HRESULT result;
  };

  /**
   * @brief  Helper utility converts D3D API failures into exceptions.
   * @param hr
   */
  inline void ThrowIfFailed(HRESULT hr) noexcept(false) {
    if (FAILED(hr)) {
      throw COMException(hr);
    }
  }

  /**
   * @brief  Helper for output debug tracing
   * @param format
   * @param ...
   */
  inline void DebugTrace(_In_z_ _Printf_format_string_ const char *format, ...) noexcept {
#ifdef _DEBUG
    va_list args;
        va_start(args, format);

    char buff[1024] = {};
    vsprintf_s(buff, format, args);
    OutputDebugStringA(buff);
        va_end(args);

#else
    UNREFERENCED_PARAMETER(format);

#endif
  }

  // Helper smart-pointers
#if (_WIN32_WINNT >= _WIN32_WINNT_WIN10) || (defined(_XBOX_ONE) && defined(_TITLE)) || !defined(WINAPI_FAMILY) \
 || (WINAPI_FAMILY == WINAPI_FAMILY_DESKTOP_APP)

  struct VirtualDeleter {
    void operator()(void *p) noexcept {
      if (p)
        VirtualFree(p, 0, MEM_RELEASE);
    }
  };

#endif

  struct HandleCloser {
    void operator()(HANDLE h) noexcept {
      if (h)
        CloseHandle(h);
    }
  };

  using ScopedHandle = std::unique_ptr<void, HandleCloser>;

  inline HANDLE SafeHandle(HANDLE h) noexcept {
    return (h == INVALID_HANDLE_VALUE) ? nullptr : h;
  }

  template<class Interface> void DXSafeRelease(Interface **ppInterfaceToRelease) {
    if (*ppInterfaceToRelease != nullptr) {
      (*ppInterfaceToRelease)->Release();
      *ppInterfaceToRelease = nullptr;
    }
  }

} // namespace DirectX