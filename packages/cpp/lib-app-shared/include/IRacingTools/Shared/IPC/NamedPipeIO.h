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

#include <windows.h>

#include <magic_enum/magic_enum.hpp>
#include <IRacingTools/Shared/IPC/ObjectPool.h>

namespace IRacingTools::Shared::IPC {


  /**
   * @brief Handles I/O operations for named pipes
   *
   * Manages the OVERLAPPED structure and I/O state for asynchronous operations.
   */
  struct NamedPipeIO {
    /**
     * @brief Defines the role of the I/O operation
     */
    enum class Role {
      Connect,
      ///< Connecting to a pipe
      Read,
      ///< Reading from a pipe
      Write ///< Writing to a pipe
    };

    /** @brief Connection identifier */
    std::uint32_t id;

    /** @brief Role of this I/O operation */
    Role role;

    /** @brief Windows OVERLAPPED structure for asynchronous I/O */
    OVERLAPPED overlapped{};

    /** @brief Flag indicating if an I/O operation is pending */
    bool hasPendingIO{false};

    /**
     * @brief Constructor for NamedPipeIO
     *
     * @param connectionId The connection identifier
     * @param role The role of this I/O operation
     */
    NamedPipeIO(std::uint32_t connectionId, Role role);

    /**
     * @brief Converts the I/O information to a string
     *
     * @return String representation of this I/O operation
     */
    std::string toString();
  };
}