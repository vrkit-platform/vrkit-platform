//
// Created by jglanz on 5/6/2024.
//

#pragma once

#include "windows.h"
#include <string>
#include <thread>


namespace IRacingTools::SDK::Utils {
    constexpr DWORD MS_VC_EXCEPTION = 0x406D1388;

#pragma pack(push,8)
    struct THREAD_NAME_INFO {
        DWORD dwType; // Must be 0x1000.
        LPCSTR szName; // Pointer to name (in user addr space).
        DWORD dwThreadID; // Thread ID (-1=caller thread).
        DWORD dwFlags; // Reserved for future use, must be zero.
    };
#pragma pack(pop)
    inline void SetThreadName(DWORD threadId, const std::string& threadName) {
        THREAD_NAME_INFO info {
            .dwType = 0x1000,
            .szName = threadName.c_str(),
            .dwThreadID = threadId,
            .dwFlags = 0
        };

#pragma warning(push)
#pragma warning(disable: 6320 6322)
        __try {
            RaiseException(MS_VC_EXCEPTION, 0, sizeof(info) / sizeof(ULONG_PTR), reinterpret_cast<ULONG_PTR*>(&info));
        } __except (EXCEPTION_EXECUTE_HANDLER) {
        }
#pragma warning(pop)
    }

    inline void SetThreadName(std::thread* thread, const std::string& threadName) {
        SetThreadName(GetThreadId(thread->native_handle()), threadName);
    }
}
