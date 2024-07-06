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

// Helper macros when joining or stringifying other macros, e.g.:
//
// `FOO##__COUNTER__` becomes `FOO__COUNTER__`
// IRT_CONCAT2(FOO, __COUNTER__) might become `FOO1`, for example

#define IRT_CONCAT1(x, y) x##y
#define IRT_CONCAT2(x, y) IRT_CONCAT1(x, y)

#define IRT_STRINGIFY1(x) #x
#define IRT_STRINGIFY2(x) IRT_STRINGIFY1(x)

// Helper for testing __VA_ARG__ behavior
#define IRT_THIRD_ARG(a, b, c, ...) c

#define IRT_VA_OPT_SUPPORTED_IMPL(...) \
  IRT_THIRD_ARG(__VA_OPT__(, ), true, false, __VA_ARGS__)
#define IRT_VA_OPT_SUPPORTED IRT_VA_OPT_SUPPORTED_IMPL(JUNK)

#define IRT_HAVE_NONSTANDARD_VA_ARGS_COMMA_ELISION_HELPER(X, ...) \
  X##__VA_ARGS__
#define IRT_HAVE_NONSTANDARD_VA_ARGS_COMMA_ELISION \
  IRT_THIRD_ARG( \
    IRT_HAVE_NONSTANDARD_VA_ARGS_COMMA_ELISION_HELPER(JUNK), \
    false, \
    true)

#if IRT_HAVE_NONSTANDARD_VA_ARGS_COMMA_ELISION
static_assert(
  IRT_HAVE_NONSTANDARD_VA_ARGS_COMMA_ELISION_HELPER(123) == 123);
#endif

#ifdef __cplusplus
    #define INITIALIZER(f) \
        static void f(void); \
        struct f##_t_ { f##_t_(void) { f(); } }; static f##_t_ f##_; \
        static void f(void)
#elif defined(_MSC_VER)
    #pragma section(".CRT$XCU",read)
    #define INITIALIZER2_(f,p) \
        static void f(void); \
        __declspec(allocate(".CRT$XCU")) void (*f##_)(void) = f; \
        __pragma(comment(linker,"/include:" p #f "_")) \
        static void f(void)
    #ifdef _WIN64
        #define INITIALIZER(f) INITIALIZER2_(f,"")
    #else
        #define INITIALIZER(f) INITIALIZER2_(f,"_")
    #endif
#else
    #define INITIALIZER(f) \
        static void f(void) __attribute__((constructor)); \
        static void f(void)
#endif