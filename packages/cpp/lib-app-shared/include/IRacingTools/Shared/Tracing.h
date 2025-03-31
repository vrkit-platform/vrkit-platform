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
#include <windows.h>
// clang-format on

#include <exception>
#include <source_location>

#include <TraceLoggingActivity.h>
#include <TraceLoggingProvider.h>

#include <IRacingTools/Shared/Macros.h>

#define VRK_CONCAT1(x, y) x##y
#define VRK_CONCAT2(x, y) VRK_CONCAT1(x, y)

#define VRK_STRINGIFY1(x) #x
#define VRK_STRINGIFY2(x) VRK_STRINGIFY1(x)

// Helper for testing __VA_ARG__ behavior
#define VRK_THIRD_ARG(a, b, c, ...) c

#define VRK_VA_OPT_SUPPORTED_IMPL(...) \
VRK_THIRD_ARG(__VA_OPT__(, ), true, false, __VA_ARGS__)
#define VRK_VA_OPT_SUPPORTED VRK_VA_OPT_SUPPORTED_IMPL(JUNK)

#define VRK_HAVE_NONSTANDARD_VA_ARGS_COMMA_ELISION_HELPER(X, ...) \
X##__VA_ARGS__
#define VRK_HAVE_NONSTANDARD_VA_ARGS_COMMA_ELISION \
VRK_THIRD_ARG( \
VRK_HAVE_NONSTANDARD_VA_ARGS_COMMA_ELISION_HELPER(JUNK), \
false, \
true)

#if VRK_HAVE_NONSTANDARD_VA_ARGS_COMMA_ELISION
static_assert(
  VRK_HAVE_NONSTANDARD_VA_ARGS_COMMA_ELISION_HELPER(123) == 123);
#endif


namespace IRacingTools::Shared {

  TRACELOGGING_DECLARE_PROVIDER(gTraceProvider);

#define VRK_TraceLoggingSourceLocation(loc)     \
  TraceLoggingValue((loc).file_name(), "File"), \
    TraceLoggingValue((loc).line(), "Line"),    \
    TraceLoggingValue((loc).function_name(), "Function")

  // TraceLoggingWriteStart() requires the legacy preprocessor :(
  static_assert(_MSVC_TRADITIONAL);
  // Rewrite these macros if this fails, as presumably the above was fixed :)
  //
  // - ##__VA_ARGS__             (common vendor extension)
  // + __VA_OPT__(,) __VA_ARGS__ (standard C++20)
  // static_assert(!VRK_VA_OPT_SUPPORTED);
  // ... but we currently depend on ##__VA_ARGS__
  // static_assert(VRK_HAVE_NONSTANDARD_VA_ARGS_COMMA_ELISION);

/** Create and automatically start and stop a named activity.
 *
 * @param VRKIT_APP_ACTIVITY the local variable to store the activity in
 * @param VRK_APP_NAME the name of the activity (C string literal)
 *
 * @see VRK_TraceLoggingScope if you don't need the local variable
 *
 * This avoids templates and `auto` and generally jumps through hoops so that it
 * is valid both inside an implementation, and in a class definition.
 */
#define VRK_TraceLoggingScopedActivity(                                                                 \
  VRKIT_APP_ACTIVITY, VRK_APP_NAME, ...)                                                                      \
  const std::function<void(TraceLoggingThreadActivity<gTraceProvider> &)>                               \
    VRK_CONCAT2(_StartImpl, VRKIT_APP_ACTIVITY) = [&, loc = std::source_location::current()](               \
                                                TraceLoggingThreadActivity<gTraceProvider> &activity) { \
      TraceLoggingWriteStart(                                                                           \
        activity,                                                                                       \
        VRK_APP_NAME,                                                                                     \
        VRK_TraceLoggingSourceLocation(loc),                                                            \
        ##__VA_ARGS__);                                                                                 \
    };                                                                                                  \
  class VRK_CONCAT2(_Impl, VRKIT_APP_ACTIVITY) final                                                        \
      : public TraceLoggingThreadActivity<gTraceProvider> {                                             \
  public:                                                                                               \
                                                                                                        \
    VRK_CONCAT2(_Impl, VRKIT_APP_ACTIVITY)                                                                  \
    (decltype(VRK_CONCAT2(_StartImpl, VRKIT_APP_ACTIVITY)) &startImpl) {                                    \
      startImpl(*this);                                                                                 \
    }                                                                                                   \
    VRK_CONCAT2(~_Impl, VRKIT_APP_ACTIVITY)() {                                                             \
      if (mAutoStop) {                                                                                  \
        this->Stop();                                                                                   \
      }                                                                                                 \
    }                                                                                                   \
    void Stop() {                                                                                       \
      if (mStopped) [[unlikely]] {                                                                      \
        OutputDebugStringW(L"Double-stopped in Stop()");                                                \
        VRK_BREAK;                                                                                      \
        return;                                                                                         \
      }                                                                                                 \
      mStopped = true;                                                                                  \
      mAutoStop = false;                                                                                \
      const auto exceptionCount = std::uncaught_exceptions();                                           \
      if (exceptionCount) [[unlikely]] {                                                                \
        TraceLoggingWriteStop(                                                                          \
          *this,                                                                                        \
          VRK_APP_NAME,                                                                                   \
          TraceLoggingValue(exceptionCount, "UncaughtExceptions"));                                     \
      } else {                                                                                          \
        TraceLoggingWriteStop(*this, VRK_APP_NAME);                                                       \
      }                                                                                                 \
    }                                                                                                   \
    void CancelAutoStop() {                                                                             \
      mAutoStop = false;                                                                                \
    }                                                                                                   \
    _VRK_TRACELOGGING_IMPL_StopWithResult(VRK_APP_NAME, int);                                             \
    _VRK_TRACELOGGING_IMPL_StopWithResult(VRK_APP_NAME, const char *);                                    \
                                                                                                        \
  private:                                                                                              \
                                                                                                        \
    bool mStopped{false};                                                                               \
    bool mAutoStop{true};                                                                               \
  };                                                                                                    \
  VRK_CONCAT2(_Impl, VRKIT_APP_ACTIVITY)                                                                    \
  VRKIT_APP_ACTIVITY{VRK_CONCAT2(_StartImpl, VRKIT_APP_ACTIVITY)};

// Not using templates as they're not permitted in local classes
#define _VRK_TRACELOGGING_IMPL_StopWithResult(                   \
  VRK_APP_NAME, VRKIT_APP_RESULT_TYPE)                                 \
  void StopWithResult(VRKIT_APP_RESULT_TYPE result) {                \
    if (mStopped) [[unlikely]] {                                 \
      OutputDebugStringW(L"Double-stopped in StopWithResult()"); \
      VRK_BREAK;                                                 \
      return;                                                    \
    }                                                            \
    this->CancelAutoStop();                                      \
    mStopped = true;                                             \
    TraceLoggingWriteStop(                                       \
      *this, VRK_APP_NAME, TraceLoggingValue(result, "Result"));   \
  }

/** Create and automatically start and stop a named activity.
 *
 * Convenience wrapper around VRK_TraceLoggingScopedActivity
 * that generates the local variable names.
 *
 * @param VRK_APP_NAME the name of the activity (C string literal)
 */
#define VRK_TraceLoggingScope(VRK_APP_NAME, ...) \
  VRK_TraceLoggingScopedActivity(              \
    VRK_CONCAT2(_vrklsa, __COUNTER__), VRK_APP_NAME, ##__VA_ARGS__)

#define VRK_TraceLoggingWrite(VRK_APP_NAME, ...)   \
  TraceLoggingWrite(                             \
    gTraceProvider,                              \
    VRK_APP_NAME,                                  \
    TraceLoggingValue(__FILE__, "File"),         \
    TraceLoggingValue(__LINE__, "Line"),         \
    TraceLoggingValue(__FUNCTION__, "Function"), \
    ##__VA_ARGS__)

} // namespace IRacingTools::Shared
