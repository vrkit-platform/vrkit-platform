// Copyright (c) 2018-2022, The Khronos Group Inc.
//
// SPDX-License-Identifier: Apache-2.0 OR MIT
//
// This file includes headers with types which openxr.h depends on in order
// to compile when platforms, graphics apis, and the like are enabled.

#pragma once

// Adapted from OpenXR-SDK on github:
// https://github.com/KhronosGroup/OpenXR-SDK/blob/master/src/common/xr_dependencies.h

#ifdef XR_USE_PLATFORM_ANDROID
#include <android/native_window.h>
#include <android/window.h>
#include <android/native_window_jni.h>
#endif  // XR_USE_PLATFORM_ANDROID

#ifdef XR_USE_PLATFORM_WIN32

// OLE desktop APIs cannot be overridden with the following desktop parition flag.
#include <ocidl.h>

#include <winapifamily.h>
#if !(WINAPI_FAMILY_PARTITION(WINAPI_PARTITION_DESKTOP | WINAPI_PARTITION_SYSTEM))
// Enable desktop partition APIs, such as RegOpenKeyEx, LoadLibraryEx, PathFileExists etc.
#undef WINAPI_PARTITION_DESKTOP
#define WINAPI_PARTITION_DESKTOP 1
#endif

#ifndef NOMINMAX
#define NOMINMAX
#endif  // !NOMINMAX

#ifndef WIN32_LEAN_AND_MEAN
#define WIN32_LEAN_AND_MEAN
#endif  // !WIN32_LEAN_AND_MEAN

#include <windows.h>
#include <unknwn.h>

#endif  // XR_USE_PLATFORM_WIN32

#ifdef XR_USE_GRAPHICS_API_D3D11
#include <d3d11.h>
#endif  // XR_USE_GRAPHICS_API_D3D11

#ifdef XR_USE_GRAPHICS_API_D3D12
#include <d3d12.h>
#endif  // XR_USE_GRAPHICS_API_D3D12

#ifdef XR_USE_PLATFORM_XLIB
#include <X11/Xlib.h>
#include <X11/Xutil.h>

#ifdef Success
#undef Success
#endif  // Success

#ifdef Always
#undef Always
#endif  // Always

#ifdef None
#undef None
#endif  // None
#endif  // XR_USE_PLATFORM_XLIB

#ifdef XR_USE_PLATFORM_XCB
#include <xcb/xcb.h>
#endif  // XR_USE_PLATFORM_XCB

#ifdef XR_USE_GRAPHICS_API_OPENGL
#if defined(XR_USE_PLATFORM_XLIB) || defined(XR_USE_PLATFORM_XCB)
#include <GL/glx.h>
#endif  // (XR_USE_PLATFORM_XLIB || XR_USE_PLATFORM_XCB)
#ifdef XR_USE_PLATFORM_XCB
#include <xcb/glx.h>
#endif  // XR_USE_PLATFORM_XCB
#ifdef XR_USE_PLATFORM_MACOS
#include <CL/cl_gl_ext.h>
#endif  // XR_USE_PLATFORM_MACOS
#endif  // XR_USE_GRAPHICS_API_OPENGL

#ifdef XR_USE_GRAPHICS_API_OPENGL_ES
#include <EGL/egl.h>
#endif  // XR_USE_GRAPHICS_API_OPENGL_ES

#ifdef XR_USE_GRAPHICS_API_VULKAN
#include <vulkan/vulkan.h>
#endif  // XR_USE_GRAPHICS_API_VULKAN

#ifdef XR_USE_PLATFORM_WAYLAND
#include "wayland-client.h"
#endif  // XR_USE_PLATFORM_WAYLAND
