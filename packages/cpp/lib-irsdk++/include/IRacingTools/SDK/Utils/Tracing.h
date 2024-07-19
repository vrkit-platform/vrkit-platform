/*
 * OpenKneeboard
 *
 * Copyright (C) 2022 Fred Emmott <fred@fredemmott.com>
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; version 2.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301,
 * USA.
 */
#pragma once

// clang-format off
#include <Windows.h>
// clang-format on

#include <exception>
#include <source_location>

#include <TraceLoggingActivity.h>
#include <TraceLoggingProvider.h>

#include "SDKMacros.h"

namespace IRacingTools {

TRACELOGGING_DECLARE_PROVIDER(gTraceProvider);

#define VRK_TraceLoggingSourceLocation(loc) \
  TraceLoggingValue((loc).file_name(), "File"), \
    TraceLoggingValue((loc).line(), "Line"), \
    TraceLoggingValue((loc).function_name(), "Function")

// TraceLoggingWriteStart() requires the legacy preprocessor :(
static_assert(_MSVC_TRADITIONAL);
// Rewrite these macros if this fails, as presumably the above was fixed :)
//
// - ##__VA_ARGS__             (common vendor extension)
// + __VA_OPT__(,) __VA_ARGS__ (standard C++20)
static_assert(!VRK_VA_OPT_SUPPORTED);
// ... but we currently depend on ##__VA_ARGS__
static_assert(VRK_HAVE_NONSTANDARD_VA_ARGS_COMMA_ELISION);

/** Create and automatically start and stop a named activity.
 *
 * @param OKBTL_ACTIVITY the local variable to store the activity in
 * @param OKBTL_NAME the name of the activity (C string literal)
 *
 * @see VRK_TraceLoggingScope if you don't need the local variable
 *
 * This avoids templates and `auto` and generally jumps through hoops so that it
 * is valid both inside an implementation, and in a class definition.
 */
#define VRK_TraceLoggingScopedActivity( \
  OKBTL_ACTIVITY, OKBTL_NAME, ...) \
  const std::function<void(TraceLoggingThreadActivity<gTraceProvider>&)> \
    VRK_CONCAT2(_StartImpl, OKBTL_ACTIVITY) \
    = [&, loc = std::source_location::current()]( \
        TraceLoggingThreadActivity<gTraceProvider>& activity) { \
        TraceLoggingWriteStart( \
          activity, \
          OKBTL_NAME, \
          VRK_TraceLoggingSourceLocation(loc), \
          ##__VA_ARGS__); \
      }; \
  class VRK_CONCAT2(_Impl, OKBTL_ACTIVITY) final \
    : public TraceLoggingThreadActivity<gTraceProvider> { \
   public: \
    VRK_CONCAT2(_Impl, OKBTL_ACTIVITY) \
    (decltype(VRK_CONCAT2(_StartImpl, OKBTL_ACTIVITY))& startImpl) { \
      startImpl(*this); \
    } \
    VRK_CONCAT2(~_Impl, OKBTL_ACTIVITY)() { \
      if (mAutoStop) { \
        this->Stop(); \
      } \
    } \
    void Stop() { \
      if (mStopped) [[unlikely]] { \
        OutputDebugStringW(L"Double-stopped in Stop()"); \
        VRK_BREAK; \
        return; \
      } \
      mStopped = true; \
      mAutoStop = false; \
      const auto exceptionCount = std::uncaught_exceptions(); \
      if (exceptionCount) [[unlikely]] { \
        TraceLoggingWriteStop( \
          *this, \
          OKBTL_NAME, \
          TraceLoggingValue(exceptionCount, "UncaughtExceptions")); \
      } else { \
        TraceLoggingWriteStop(*this, OKBTL_NAME); \
      } \
    } \
    void CancelAutoStop() { \
      mAutoStop = false; \
    } \
    _VRK_TRACELOGGING_IMPL_StopWithResult(OKBTL_NAME, int); \
    _VRK_TRACELOGGING_IMPL_StopWithResult(OKBTL_NAME, const char*); \
\
   private: \
    bool mStopped {false}; \
    bool mAutoStop {true}; \
  }; \
  VRK_CONCAT2(_Impl, OKBTL_ACTIVITY) \
  OKBTL_ACTIVITY {VRK_CONCAT2(_StartImpl, OKBTL_ACTIVITY)};

// Not using templates as they're not permitted in local classes
#define _VRK_TRACELOGGING_IMPL_StopWithResult( \
  OKBTL_NAME, OKBTL_RESULT_TYPE) \
  void StopWithResult(OKBTL_RESULT_TYPE result) { \
    if (mStopped) [[unlikely]] { \
      OutputDebugStringW(L"Double-stopped in StopWithResult()"); \
      VRK_BREAK; \
      return; \
    } \
    this->CancelAutoStop(); \
    mStopped = true; \
    TraceLoggingWriteStop( \
      *this, OKBTL_NAME, TraceLoggingValue(result, "Result")); \
  }

/** Create and automatically start and stop a named activity.
 *
 * Convenience wrapper around VRK_TraceLoggingScopedActivity
 * that generates the local variable names.
 *
 * @param OKBTL_NAME the name of the activity (C string literal)
 */
#define VRK_TraceLoggingScope(OKBTL_NAME, ...) \
  VRK_TraceLoggingScopedActivity( \
    VRK_CONCAT2(_okbtlsa, __COUNTER__), OKBTL_NAME, ##__VA_ARGS__)

#define VRK_TraceLoggingWrite(OKBTL_NAME, ...) \
  TraceLoggingWrite( \
    gTraceProvider, \
    OKBTL_NAME, \
    TraceLoggingValue(__FILE__, "File"), \
    TraceLoggingValue(__LINE__, "Line"), \
    TraceLoggingValue(__FUNCTION__, "Function"), \
    ##__VA_ARGS__)

}// namespace OpenKneeboard
