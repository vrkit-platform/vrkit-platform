//
// Created by jglanz on 1/5/2024.
//

#pragma once

#include "SharedAppLibPCH.h"
#include <cassert>
/******************************************************************
 *                                                                 *
 *  Macros                                                         *
 *                                                                 *
 ******************************************************************/

template <class Interface>
inline void DXSafeRelease(Interface **ppInterfaceToRelease) {
  if (*ppInterfaceToRelease != nullptr) {
    (*ppInterfaceToRelease)->Release();
    *ppInterfaceToRelease = nullptr;
  }
}

#ifndef Assert
#if defined(DEBUG) || defined(_DEBUG)
#define Assert(b)                                                              \
  if (!(b)) {                                                                  \
    OutputDebugStringA("Assert: " #b "\n");                                    \
  }
#else
#define Assert(b, msg)
#endif // DEBUG || _DEBUG
#endif

#ifndef AssertMsg
#if defined(DEBUG) || defined(_DEBUG)
#define AssertMsg(b, msg)                                                              \
if (!(b)) {                                                                  \
OutputDebugStringA("Assert: " #b " " ##msg "\n");                                    \
assert(b);\
}
#else
#define AssertMsg(b, msg)
#endif // DEBUG || _DEBUG
#endif


#ifndef HINST_THISCOMPONENT
EXTERN_C IMAGE_DOS_HEADER __ImageBase;
#define HINST_THISCOMPONENT ((HINSTANCE) & __ImageBase)
#endif
