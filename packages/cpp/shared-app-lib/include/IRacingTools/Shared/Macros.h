//
// Created by jglanz on 1/5/2024.
//

#pragma once


#include "SharedAppLibPCH.h"
#include <IRacingTools/SDK/Utils/Win32.h>
#include <cassert>
#include <iostream>
#include <ostream>
// #include <source_location>


#ifdef DEBUG
  #define IRT_BREAK __debugbreak()
#else
  #define IRT_BREAK
#endif

// template<class CharT>
// struct std::formatter<winrt::hresult, CharT> : std::formatter<std::basic_string_view<CharT>, CharT> {
//   template<class FormatContext> auto format(const winrt::hresult &hresult, FormatContext &fc) const {
//     char *message = nullptr;
//     FormatMessageA(
//         FORMAT_MESSAGE_ALLOCATE_BUFFER | FORMAT_MESSAGE_FROM_SYSTEM | FORMAT_MESSAGE_IGNORE_INSERTS,
//         nullptr,
//         hresult,
//         MAKELANGID(LANG_NEUTRAL, SUBLANG_DEFAULT),
//         reinterpret_cast<char *>(&message),
//         0,
//         nullptr
//     );
//     std::basic_string<CharT> converted;
//     if (!message) {
//       converted = std::format("{:#010x}", static_cast<uint32_t>(hresult.value));
//       IRT_BREAK;
//     } else {
//       converted = std::format(
//           "{:#010x} (\"{}\")", static_cast<uint32_t>(hresult.value), message
//       );
//     }
//
//     return std::formatter<std::basic_string_view<CharT>, CharT>::format(
//         std::basic_string_view<CharT>{converted}, fc
//     );
//   }
// };

namespace IRacingTools::Shared {

  inline void fatal [[noreturn]]() {
    // The FAST_FAIL_FATAL_APP_EXIT macro is defined in winnt.h, but we don't want
    // to pull that in here...
    constexpr unsigned int fast_fail_fatal_app_exit = 7;
    __fastfail(fast_fail_fatal_app_exit);
  }

#define IRT_FATAL \
  { fatal(); }

#define IRT_LOG_SOURCE_LOCATION_AND_FATAL(\
  message, ...) \
  { \
    std::cerr << std::format("FATAL: " message "\n", ##__VA_ARGS__); \
    IRT_FATAL; \
  }

  //spdlog::critical("FATAL: " message "\n", ##__VA_ARGS__);
  /** Use this if something is so wrong that we're almost certainly going to
   * crash.
   *
   * Crashing earlier is better than crashing later, as we get more usable
   * debugging information.
   *
   * @see `IRT_LOG_SOURCE_LOCATION_AND_FATAL` if you need to provide a
   * source location.
   */
#define IRT_LOG_AND_FATAL(message, ...) \
  IRT_LOG_SOURCE_LOCATION_AND_FATAL( \
    message, ##__VA_ARGS__)


  inline void check_hresult(
      HRESULT code) {
    //winrt::check_hresult(code);
    // if (FAILED(code)) [[unlikely]] {
    //   IRT_LOG_SOURCE_LOCATION_AND_FATAL("HRESULT {}", static_cast<int32_t>(code));
    // }
  }

  namespace Win32 = IRacingTools::SDK::Utils::Win32;

} // namespace IRacingTools::Shared

/******************************************************************
 *                                                                 *
 *  Macros                                                         *
 *                                                                 *
 ******************************************************************/

#define LOGD(s) \
{ \
auto c = s.c_str();\
OutputDebugStringA(c); \
}

#ifndef Assert
#if defined(DEBUG) ||defined(_DEBUG)
#define Assert(b) \
    if (!(b)) { \
        OutputDebugStringA("Assert: " #b "\n"); \
        IRT_LOG_AND_FATAL(#b);\
    }
#else
#define Assert(b)
#endif // DEBUG || _DEBUG
#endif

#ifndef AssertMsg
#if defined(DEBUG) ||defined(_DEBUG)
#define AssertMsg(b, msg) \
    if (!(b)) { \
        OutputDebugStringA("Assert: " #b " " msg "\n"); \
            __debugbreak();\
            IRT_LOG_AND_FATAL(#b);\
    }
#else
#define AssertMsg(b, msg)
#endif // DEBUG || _DEBUG
#endif


#define AssertOkMsg(result, msg) AssertMsg(SUCCEEDED(result), msg)
#define AssertOk(result) Assert(SUCCEEDED(result))
#define AOKMSG AssertOkMsg
#define AOK AssertOk


#ifndef HINST_THISCOMPONENT
EXTERN_C IMAGE_DOS_HEADER __ImageBase;
#define HINST_THISCOMPONENT ((HINSTANCE) & __ImageBase)
#endif

