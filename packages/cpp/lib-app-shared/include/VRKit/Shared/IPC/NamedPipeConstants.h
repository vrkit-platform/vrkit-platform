/**
 * @file NamedPipeConstants.h
 * @brief Constants used for named pipe IPC communication
 * @author jglanz
 * @date 4/14/2025
 *
 * This file provides constants used by the named pipe server and client implementations.
 */

#pragma once

/**
 * @def NAMED_PIPE_SERVER_MAX_CONNECTIONS_DEFAULT
 * @brief Default maximum number of connections (0 means unlimited)
 */
#ifndef NAMED_PIPE_SERVER_MAX_CONNECTIONS_DEFAULT
#define NAMED_PIPE_SERVER_MAX_CONNECTIONS_DEFAULT 0
#endif

/**
 * @def NAMED_PIPE_SERVER_BUFFER_SIZE_DEFAULT
 * @brief Default buffer size for pipe communication (in bytes)
 */
#ifndef NAMED_PIPE_SERVER_BUFFER_SIZE_DEFAULT
#define NAMED_PIPE_SERVER_BUFFER_SIZE_DEFAULT 8192
// #define NAMED_PIPE_SERVER_BUFFER_SIZE_DEFAULT 20
#endif
