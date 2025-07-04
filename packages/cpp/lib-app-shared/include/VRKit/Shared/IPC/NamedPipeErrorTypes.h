
/**
 * @file NamedPipeServer.h
 * @brief Asynchronous named pipe server implementation for Windows IPC
 * @author jglanz
 * @date 4/14/2025
 *
 * This file provides classes and utilities for implementing an asynchronous
 * Windows named pipe server with support for multiple concurrent connections,
 * message-based communication, and non-blocking I/O operations.
 */

#pragma once

#include <functional>
#include <windows.h>

namespace VRKit::Shared::IPC {
  enum class NamedPipeErrorCode : std::uint32_t {
    Unknown = 0,
    Connection,
    Read,
    Write,
    Event
  };
}