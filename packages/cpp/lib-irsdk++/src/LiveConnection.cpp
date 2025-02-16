/*
Copyright (c) 2013, iRacing.com Motorsport Simulations, LLC.
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:
    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.
    * Neither the name of iRacing.com Motorsport Simulations nor the
      names of its contributors may be used to endorse or promote products
      derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

// ReSharper disable CppCStyleCast
#define MIN_WIN_VER 0x0501

#ifndef WINVER
#define WINVER MIN_WIN_VER
#endif

#ifndef _WIN32_WINNT
#define _WIN32_WINNT MIN_WIN_VER
#endif

#include <atomic>
#include <climits>
#include <cstdio>
#include <ctime>
#include <stdexcept>

#include <yaml-cpp/yaml.h>

#ifdef _MSC_VER
#include <crtdbg.h>
#endif

#include <IRacingTools/SDK/DataHeader.h>
#include <IRacingTools/SDK/LiveConnection.h>
#include <IRacingTools/SDK/LogInstance.h>
#include <IRacingTools/SDK/SessionInfo/SessionInfoMessage.h>
#include <IRacingTools/SDK/Types.h>

namespace IRacingTools::SDK {

  // INTERNAL VARIABLES
  namespace {
    HANDLE gDataValidEventHandle{nullptr};
    HANDLE gMemMapFileHandle{nullptr};

    const char *gSharedMemPtr{nullptr};
    const DataHeader *gDataHeader{nullptr};

    std::atomic_int gLastTickCount{INT_MAX};
    std::atomic_bool gIsInitialized{false};

    constexpr double kCommTimeout = 30.0; // kCommTimeout after 30 seconds with no communication
    time_t gLastValidTime = 0;
  } // namespace

  /**
   * Initializes the live connection, setting up the required memory-mapped file
   * and synchronization event handles for interaction with shared data.
   *
   * > NOTE: This is usually called internally
   *
   * This method attempts to open the memory-mapped file and map it into the process's
   * address space. It also tries to open an event handle to synchronize access to the data.
   * If all necessary resources are successfully initialized, the connection is marked as initialized.
   * Otherwise, initialization fails, and the connection remains non-operational.
   *
   * @return True if the initialization is successful and the connection is ready for use,
   *         otherwise false.
   */
  bool LiveConnection::initialize() {
    static auto L = LogInstance::Get().getDefaultLogger();

    if (!gMemMapFileHandle) {
      gMemMapFileHandle = OpenFileMapping(FILE_MAP_READ, FALSE, Resources::MemMapFilename);
      gLastTickCount = INT_MAX;
    }

    if (gMemMapFileHandle) {
      if (!gSharedMemPtr) {
        gSharedMemPtr = static_cast<const char *>(MapViewOfFile(gMemMapFileHandle, FILE_MAP_READ, 0, 0, 0));
        gDataHeader = reinterpret_cast<const DataHeader *>(gSharedMemPtr);
        gLastTickCount = INT_MAX;
      }

      if (gSharedMemPtr) {
        if (!gDataValidEventHandle) {
          gDataValidEventHandle = OpenEventA(SYNCHRONIZE, false, Resources::IRSDK_DATAVALIDEVENTNAME);
          // if (!gDataValidEventHandle)
          //   gDataValidEventHandle = CreateEvent(NULL, true, false, Resources::IRSDK_DATAVALIDEVENTNAME);
          gLastTickCount = INT_MAX;
        }

        if (gDataValidEventHandle) {
          gIsInitialized = true;
          return gIsInitialized;
        }
        L->warn("Error opening event: {}", GetLastError());
      } else {
        L->warn("Error mapping file: {}", GetLastError());
      }
    } else {
      L->warn("Error opening file: {}", GetLastError());
    }

    gIsInitialized = false;
    return gIsInitialized;
  }

  void LiveConnection::cleanup() {
    if (gDataValidEventHandle)
      CloseHandle(gDataValidEventHandle);

    if (gSharedMemPtr)
      UnmapViewOfFile(gSharedMemPtr);

    if (gMemMapFileHandle)
      CloseHandle(gMemMapFileHandle);

    gDataValidEventHandle = nullptr;
    gSharedMemPtr = nullptr;
    gDataHeader = nullptr;
    gMemMapFileHandle = nullptr;

    gIsInitialized = false;
    gLastTickCount = INT_MAX;
  }

  bool LiveConnection::getNewData(char *data) {
    if (gIsInitialized || initialize()) {
#ifdef _MSC_VER
      _ASSERTE(nullptr != gDataHeader);
#endif

      // if sim is not active, then no new data
      if (!gDataHeader || gDataHeader->status != ConnectionStatus::Connected) {
        gLastTickCount = INT_MAX;
        return false;
      }

      int latest = 0;
      for (int i = 1; i < gDataHeader->numBuf; i++)
        if (gDataHeader->varBuf[latest].tickCount < gDataHeader->varBuf[i].tickCount)
          latest = i;

      // if newer than last recieved, than report new data
      if (gLastTickCount < gDataHeader->varBuf[latest].tickCount) {
        // if asked to retrieve the data
        if (data) {
          // try twice to get the data out
          for (int count = 0; count < 2; count++) {
            const int curTickCount = gDataHeader->varBuf[latest].tickCount;
            memcpy(data, gSharedMemPtr + gDataHeader->varBuf[latest].bufOffset, gDataHeader->bufLen);
            if (curTickCount == gDataHeader->varBuf[latest].tickCount) {
              gLastTickCount = curTickCount;
              gLastValidTime = time(nullptr);
              return true;
            }
          }
          // if here, the data changed out from under us.
          return false;
        } else {
          gLastTickCount = gDataHeader->varBuf[latest].tickCount;
          gLastValidTime = time(nullptr);
          return true;
        }
      }
      // if older than last received, than reset, we probably disconnected
      else if (gLastTickCount > gDataHeader->varBuf[latest].tickCount) {
        gLastTickCount = gDataHeader->varBuf[latest].tickCount;
        return false;
      }
      // else the same, and nothing changed this tick
    }

    return false;
  }

  /**
   * Retrieves the current session tick count, if it is within valid bounds.
   *
   * The session tick count is validated to ensure it is non-negative
   * and does not exceed the maximum value for a 32-bit integer. If the tick
   * count fails these checks, no value is returned.
   *
   * @return A 32-bit integer representing the session tick count if valid,
   *         otherwise an empty optional object.
   */
  std::optional<std::int32_t> LiveConnection::getSessionTickCount() {
    if (gLastTickCount < 0 || gLastTickCount >= INT_MAX)
      return std::nullopt;

    return gLastTickCount;
  }

  /**
   * Waits for data to become available or the specified timeout period to elapse.
   * The method checks if the connection is initialized, attempts to retrieve new data,
   * and waits for a signal indicating that new data is ready. If the data becomes
   * available during the wait, it is written to the provided buffer.
   *
   * @param timeOut The maximum time in milliseconds to wait for new data.
   *                A value of 0 will return immediately. A negative value is not valid.
   * @param data A pointer to a buffer that will be populated with the retrieved data,
   *             if successfully obtained.
   * @return True if new data is successfully retrieved within the timeout period,
   *         false otherwise.
   */
  bool LiveConnection::waitForDataReady(int timeOut, char *data) {
#ifdef _MSC_VER
    _ASSERTE(timeOut >= 0);
#endif

    if (gIsInitialized || initialize()) {
      // just to be sure, check before we sleep
      if (getNewData(data))
        return true;

      // sleep till signaled
      WaitForSingleObject(gDataValidEventHandle, timeOut);

      // we woke up, so check for data
      return getNewData(data);


    }

    // sleep if error
    if (timeOut > 0)
      Sleep(timeOut);

    return false;
  }

  /**
   * Checks whether the connection is currently active and operational.
   *
   * This method verifies that the connection has been initialized and maintains
   * its validity. It ensures that the connection status is marked as "Connected"
   * and that the time elapsed since the last valid operation does not exceed a
   * predefined timeout threshold.
   *
   * @return True if the connection is active and valid, otherwise false.
   */
  bool LiveConnection::isConnected() {
    if (gIsInitialized) {
      const int elapsed = static_cast<int>(std::difftime(std::time(nullptr), gLastValidTime));
      return gDataHeader->status == ConnectionStatus::Connected && elapsed < kCommTimeout;
    }

    return false;
  }

  /**
   * Retrieves the current data header if the live connection is initialized.
   *
   * This function provides access to the shared data header when the live connection
   * is operational and properly initialized. If the connection is not initialized,
   * this method returns a null pointer, indicating that the data header is unavailable.
   *
   * @return Pointer to the data header if the connection is initialized,
   *         or nullptr otherwise.
   */
  const DataHeader *LiveConnection::getHeader() {
    if (gIsInitialized) {
      return gDataHeader;
    }

    return nullptr;
  }

  /**
   * Retrieves the data from the shared memory at the specified index.
   *
   * This method fetches a pointer to the data located in the shared memory region
   * based on the provided index. The memory must be initialized and valid for the
   * operation to succeed; otherwise, the method will return a null pointer.
   *
   * @param index The index of the data buffer to retrieve.
   * @return A pointer to the data at the specified index if initialization is complete,
   *         otherwise a null pointer.
   */
  const char *LiveConnection::getData(int index) {
    if (gIsInitialized) {
      return gSharedMemPtr + gDataHeader->varBuf[index].bufOffset;
    }

    return nullptr;
  }

  /**
   * Retrieves the session information string from the shared memory.
   *
   * This method accesses the shared memory to obtain a pointer to the session information.
   * If the connection has not been initialized, the method returns a null pointer.
   *
   * @return A pointer to the session information string if the connection is initialized,
   *         otherwise a null pointer.
   */
  const char *LiveConnection::getSessionInfoStr() {
    if (gIsInitialized) {
      return gSharedMemPtr + gDataHeader->session.offset;
    }
    return nullptr;
  }

  /**
   * Retrieves session information as a shared pointer to a SessionInfoMessage object.
   *
   * This method checks if the session information message has been previously initialized.
   * If not, it fetches the session information string, deserializes it using YAML, and constructs
   * a new SessionInfoMessage object. The constructed object is then cached for future calls.
   * If the session information is successfully retrieved and parsed, it is returned as a shared pointer.
   * In case no session information is available or parsing fails, a null shared pointer is returned.
   *
   * @return A shared pointer to the SessionInfoMessage object containing the session details,
   *         or a null shared pointer if the session information is unavailable or cannot be parsed.
   */
  std::shared_ptr<SessionInfo::SessionInfoMessage> LiveConnection::getSessionInfo() {
    if (!sessionInfoMessage_) {
      auto sessionInfoData = getSessionInfoStr();
      std::shared_ptr<SessionInfo::SessionInfoMessage> sessionInfoMessage{nullptr};
      if (sessionInfoData) {
        auto rootNode = YAML::Load(sessionInfoData);
        sessionInfoMessage = std::make_shared<SessionInfo::SessionInfoMessage>();
        if (sessionInfoMessage) {
          *sessionInfoMessage = rootNode.as<SessionInfo::SessionInfoMessage>();
          sessionInfoMessage_ = sessionInfoMessage;
        }
      }
    }

    return sessionInfoMessage_;
  }

  /**
   * Retrieves the current count of session updates from the shared data, provided
   * the live connection is properly initialized.
   *
   * If the connection has not been initialized, the method will return a default
   * error value to indicate that the operation cannot be performed.
   *
   * @return The number of session updates if the connection is initialized,
   *         otherwise returns -1.
   */
  uint32_t LiveConnection::getSessionUpdateCount() {
    if (gIsInitialized) {
      return gDataHeader->session.count;
    }
    return -1;
  }

  /**
   * Provides a pointer to the variable data header within the shared memory.
   *
   * This method returns a pointer to the structure that represents the variable
   * data header. It verifies if the connection is initialized before attempting
   * to compute the pointer based on the offset provided in the shared data header.
   * If the connection is not initialized, the method returns a null pointer.
   *
   * @return Pointer to the variable data header if the connection is initialized,
   *         otherwise nullptr.
   */
  const VarDataHeader *LiveConnection::getVarHeaderPtr() {
    if (gIsInitialized) {
      return ((VarDataHeader *)(gSharedMemPtr + gDataHeader->varHeaderOffset));
    }
    return nullptr;
  }

  /**
   * Retrieves a pointer to the `VarDataHeader` entry corresponding to the given index.
   *
   * This method accesses shared memory to retrieve the variable header entry. It ensures
   * that the live connection is properly initialized and that the provided index is within
   * bounds. If initialization has not occurred or the index is out of range, this method
   * returns a null pointer.
   *
   * @param index The index of the variable header entry to retrieve.
   * @return A pointer to the `VarDataHeader` entry if successful,
   *         or nullptr if the connection is not initialized or the index is invalid.
   */
  const VarDataHeader *LiveConnection::getVarHeaderEntry(uint32_t index) {
    if (!gIsInitialized || index >= gDataHeader->numVars)
      return nullptr;

    return &((VarDataHeader *)(gSharedMemPtr + gDataHeader->varHeaderOffset))[index];
  }

  /**
   * Searches for the index of a variable within the shared data structure by its name.
   *
   * This method iterates through the variable headers to find a variable with a matching name.
   * The comparison is case-sensitive and limited to a predefined maximum string length.
   * If the variable is found, its index within the data structure is returned.
   * If the variable name is not found, or the name is empty, the function returns -1.
   *
   * > NOTE: This is a linear search. For optimal performance, consider caching results.
   *
   * @param name The name of the variable to search for, provided as a string view.
   * @return The index of the variable if found, or -1 if the variable is not present or the input is invalid.
   */
  int LiveConnection::varNameToIndex(const std::string_view &name) {
    if (!name.empty()) {
      for (int index = 0; index < gDataHeader->numVars; index++) {
        const VarDataHeader *varDataHeader = getVarHeaderEntry(index);
        if (varDataHeader && 0 == strncmp(name.data(), varDataHeader->name, Resources::MaxStringLength)) {
          return index;
        }
      }
    }

    return -1;
  }

  /**
   * Retrieves the memory offset of a variable with the specified name from the shared data.
   *
   * This function performs a linear search on the variable headers within the data structure
   * to find a matching variable name. If a match is found, its corresponding memory offset is returned.
   * The search is case-sensitive and utilizes a fixed maximum string length for comparison.
   *
   * The provided variable name must not be empty. If the variable name is not found or
   * any required resources are unavailable, the function returns -1.
   *
   * > NOTE: This is a linear search. For performance reasons, results should be cached
   * after retrieval to minimize repeated lookups.
   *
   * @param name The name of the variable to search for, as a string view.
   * @return Integer offset of the variable if found, or -1 if the variable is not found or invalid.
   */
  int LiveConnection::varNameToOffset(const std::string_view &name) {
    if (!name.empty()) {
      for (int index = 0; index < gDataHeader->numVars; index++) {
        const VarDataHeader *varDataHeader = getVarHeaderEntry(index);
        if (varDataHeader && 0 == strncmp(name.data(), varDataHeader->name, Resources::MaxStringLength)) {
          return varDataHeader->offset;
        }
      }
    }

    return -1;
  }


  /**
   * Retrieves the unique broadcast message ID used to communicate with the iRacing application.
   *
   * This function ensures the message ID is registered only once during the program's lifetime
   * by utilizing a static variable to store the result of the registration. The registered message
   * ID can then be used in broadcasting and sending messages to iRacing.
   *
   * @return An unsigned integer representing the unique broadcast message ID, or 0 if the registration fails.
   */
  unsigned int getBroadcastMessageId() {
    static unsigned int msgId = RegisterWindowMessage(Resources::BroadcastMessageName);

    return msgId;
  }

  /**
   * @brief Send Message/Command to send to iRacing
   *
   * @param msg Message/Command to send to iRacing
   * @param var1 Argument 1
   * @param var2 Argument 2
   * @param var2 Argument 3
   */
  void LiveConnection::broadcastMessage(BroadcastMessage msg, int var1, int var2, int var3) {
    LiveConnection::GetInstance().broadcastMessage(msg, var1, static_cast<int>(MAKELONG(var2, var3)));
  }

  /**
   * @brief Send Message/Command to send to iRacing
   *
   * @param msg Message/Command to send to iRacing
   * @param var1 Argument 1
   * @param var2 Argument 2
   */
  void LiveConnection::broadcastMessage(BroadcastMessage msg, int var1, float var2) {
    // multiply by 2^16-1 to move fractional part to the integer part
    const int real = static_cast<int>(var2 * 65536.0f);

    broadcastMessage(msg, var1, real);
  }

  /**
   * @brief Send Message/Command to send to iRacing
   *
   * @param msg Message/Command to send to iRacing
   * @param var1 Argument 1
   * @param var2 Argument 2
   */
  void LiveConnection::broadcastMessage(BroadcastMessage msg, int var1, int var2) {
    static unsigned int msgId = getBroadcastMessageId();
    auto msgType = magic_enum::enum_underlying(msg);
    if (msgId && msgType >= 0 && msgType < magic_enum::enum_underlying(BroadcastMessage::Last)) {
      SendNotifyMessage(HWND_BROADCAST, msgId, MAKELONG(msg, var1), var2);
    }
  }


} // namespace IRacingTools::SDK
