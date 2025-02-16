// ReSharper disable CppEvaluationInternalFailure

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


/**
 The IRSDK is a simple api that lets clients access telemetry data from the
 iRacing simulator. It is broken down into several parts:

 - Live data
   Live data is output from the sim into a shared memory mapped file.  Any
   application can open this memory mapped file and read the telemetry data
   out.  The format of this data was laid out in such a way that it should be
   possible to access from any language that can open a windows memory mapped
   file, without needing an external api.

   There are two different types of data that the telemetry outputs,
   sessionInfo and variables:

   Session info is for data that only needs to be updated every once in a
   while.  This data is output as a YAML formatted string.

   Variables, on the other hand, are output at a rate of 60 times a second.
   The varHeader struct defines each variable that the sim will output, while
   the varData struct gives details about the current line buffer that the vars
   are being written into.  Each variable is packed into a binary array with
   an offset and length stored in the varHeader.  The number of variables
   available can change depending on the car or session loaded.  But once the
   sim is running the variable list is locked down and will not change during a
   session.

   The sim writes a new line of variables every 16 ms, and then signals any
   listeners in order to wake them up to read the data.  Because the sim has no
   way of knowing when a listener is done reading the data, we triple buffer
   it in order to give all the clients enough time to read the data out.  This
   gives you a minimum of 16 ms to read the data out and process it.  So it is
   best to copy the data out before processing it.  You can use the function
   irsdk_waitForDataReady() to both wait for new data and copy the data to a
   local buffer.

 - Logged data
   Detailed information about the local drivers car can be logged to disk in
   the form of an ibt binary file.  This logging is enabled in the sim by
   typing alt-L at any time.  The ibt file format directly mirrors the format
   of the live data.

   It is stored as an DataHeader followed immediately by an DiskSubHeader.
   After that the offsets in the DataHeader point to the sessionInfo string,
   the varHeader, and the varBuffer.

 - Remote Control
   You can control the camera selections and playback of a replay tape, from
   any external application by sending a windows message with the
   irsdk_broadcastMsg() function.
*/
#pragma once

#include <chrono>
#include <regex>

#include <magic_enum.hpp>

#include <IRacingTools/SDK/Types.h>
#include <IRacingTools/SDK/Utils/LUT.h>

namespace IRacingTools::SDK {

  /**
   * Defines the identifier used to
   * represent a client implementation instance
   */
  using ClientId = std::string_view;

  /**
   * Alias to `std::optional`
   */
  template <typename T>
  using Opt = std::optional<T>;

  /**
   * Unit of measure for `SessionTime` instances,
   * internally.
   *
   * The actual `data` is processed as
   * a double representing seconds, but this SDK
   * uses the opinion that milliseconds have a lower-overhead
   * as an integral number compared to `seconds` stored as a `double`
   * where 6 digits of precision is available
   */
  using SessionTime = std::chrono::milliseconds;

  /**
   * Status of the `LiveConnection` singleton, which
   * encapsulates the connection to `iRacing`
   */
  enum class ConnectionStatus : int {
    NotConnected = 0,
    Connected = 1
  };

  /**
   * Variable data types accessible
   * through the memory-mapped data
   * accessible in each data frame
   *
   * - 1 Byte = 8 bits
   *   Char
   *   Bool
   *
   * - 4 bytes = 32 bits
   *   Int32
   *   Bitmask
   *   Float
   *
   * - 8 bytes = 64 bits
   *   Double
   */
  enum class VarDataType : int {
    // 1 byte
    Char = 0,
    Bool,

    // 4 bytes
    Int32,
    Bitmask,
    Float,

    // 8 bytes
    Double,
  };

  /**
   * The number of `VarDataType` values in the enumeration
   */
  constexpr std::size_t VarDataTypeCount = magic_enum::enum_count<VarDataType>();

  /**
   * Lookup table mapping each `VarDataType`
   * to the number of bytes it represents
   */
  constexpr Utils::LUT<VarDataType, std::size_t, VarDataTypeCount> VarDataTypeSizeTable = {
    {
      {VarDataType::Char, 1},
      {VarDataType::Bool, 1},
      {VarDataType::Int32, 4},
      {VarDataType::Bitmask, 4},
      {VarDataType::Float, 4},
      {VarDataType::Double, 8},
    },
  };

  /**
   * Array of the values in `VarDataTypeSizeTable`
   */
  constexpr std::array<std::size_t, VarDataTypeCount> VarDataTypeBytes = VarDataTypeSizeTable.values();

  /**
   * Types of possible engine warnings
   * with bitmask bitwise-and matching values
   */
  enum class EngineWarning {
    WaterTemp = 0x01,
    FuelPressure = 0x02,
    OilPressure = 0x04,
    EngineStalled = 0x08,
    PitSpeedLimiter = 0x10,
    RevLimiterActive = 0x20,
    OilTemp = 0x40,
  };

  /**
   * Types of possible flags
   * with bitmask bitwise-and matching values
   */
  enum class FlagType : uint32_t {
    // global flags
    Checkered = 0x00000001,
    White = 0x00000002,
    Green = 0x00000004,
    Yellow = 0x00000008,
    Red = 0x00000010,
    Blue = 0x00000020,
    Debris = 0x00000040,
    Crossed = 0x00000080,
    YellowWaving = 0x00000100,
    OneLapToGreen = 0x00000200,
    GreenHeld = 0x00000400,
    TenToGo = 0x00000800,
    FiveToGo = 0x00001000,
    RandomWaving = 0x00002000,
    Caution = 0x00004000,
    CautionWaving = 0x00008000,

    // drivers black flags
    Black = 0x00010000,
    Disqualify = 0x00020000,
    Serviceable = 0x00040000,
    // car is allowed service (not a flag)
    Furled = 0x00080000,
    Repair = 0x00100000,

    // start lights
    StartHidden = 0x10000000,
    StartReady = 0x20000000,
    StartSet = 0x40000000,
    StartGo = 0x80000000,
  };

  /**
   * Determines whether a specified flag is set within a given bitmask.
   *
   * @param bitmask The bitmask to check for the presence of the flag.
   * @return True if the specified flag is set in the bitmask; otherwise, false.
   */
  template <FlagType FT>
  bool IsFlagSet(uint32_t bitmask) {
    return magic_enum::enum_underlying(FT) & bitmask > 0;
  }


  /**
   * Checks if a specific flag is set in a given bitmask.
   *
   * @param bitmask The bitmask in which the flag will be checked.
   * @param flag The flag to check within the bitmask.
   * @return True if the flag is present and set in the bitmask; otherwise, false.
   */
  inline bool IsFlagSet(uint32_t bitmask, FlagType flag) {
    return magic_enum::enum_underlying(flag) & bitmask > 0;
  }

  /**
   * Current car[index] location on track
   */
  enum class TrackLocation {
    /**
     * Basically this means a car is not yet, or no longer connected
     */
    NotInWorld = -1,

    /**
     * Off track (grass, gravel, etc)
     */
    OffTrack,

    /**
     * In pits
     */
    InPitStall,

    /**
     * Approaching the pits (useful for warnings like "Watch your speed")
     */
    ApproachingPits,

    /**
     * On track and running
     */
    OnTrack
  };

  /**
   * Enum representing different types of track surfaces that can be encountered.
   * Each surface type corresponds to specific physical or visual characteristics
   * that influence car behavior and track conditions.
   */
  enum class TrackSurface {
    SurfaceNotInWorld = -1,
    Undefined = 0,
    Asphalt1,
    Asphalt2,
    Asphalt3,
    Asphalt4,
    Concrete1,
    Concrete2,
    RacingDirt1,
    RacingDirt2,
    Paint1,
    Paint2,
    Rumble1,
    Rumble2,
    Rumble3,
    Rumble4,
    Grass1,
    Grass2,
    Grass3,
    Grass4,
    Dirt1,
    Dirt2,
    Dirt3,
    Dirt4,
    Sand,
    Gravel1,
    Gravel2,
    Grasscrete,
    Astroturf,
  };

  /**
   * Represents the various states a racing session can progress through.
   * Each state corresponds to a specific phase of a session's lifecycle,
   * allowing for tracking and operational decisions based on the current state.
   */
  enum class SessionState {
    Invalid,
    GetInCar,
    Warmup,
    ParadeLaps,
    Racing,
    Checkered,
    CoolDown
  };

  /**
   * Represents the positional relationship between the player's car
   * and other cars on the track. Indicates whether other cars are
   * present and their relative positions.
   */
  enum class CarLeftRight {
    /**
     * Disabled/Off
     */
    LROff,

    /**
     * no cars around us.
     */
    LRClear,

    /**
     * there is a car to our left.
     */
    LRCarLeft,

    /**
     * there is a car to our right.
     */
    LRCarRight,

    /**
     * there are cars on each side.
     */
    LRCarLeftRight,

    /**
     * there are two cars to our left.
     */
    LR2CarsLeft,

    /**
     * there are two cars to our right.
     */
    LR2CarsRight
  };

  /**
   * Represents the state of the camera system, with each state
   * defined as a unique bitmask. Multiple states can be combined
   * using bitwise operations to describe the current camera configuration
   * or behavior during a session.
   */
  enum class CameraState {
    // the camera tool can only be activated if viewing the session screen (out of car)
    IsSessionScreen = 0x0001,

    // the scenic camera is active (no focus car)
    IsScenicActive = 0x0002,

    // these can be changed with a broadcast message
    CamToolActive = 0x0004,
    UIHidden = 0x0008,
    UseAutoShotSelection = 0x0010,
    UseTemporaryEdits = 0x0020,
    UseKeyAcceleration = 0x0040,
    UseKey10xAcceleration = 0x0080,
    UseMouseAimMode = 0x0100
  };

  enum class PitServiceTask {
    LFTireChange = 0x0001,
    RFTireChange = 0x0002,
    LRTireChange = 0x0004,
    RRTireChange = 0x0008,
    FuelFill = 0x0010,
    WindshieldTearoff = 0x0020,
    FastRepair = 0x0040
  };

  /**
   * Represents the status of pit service operations and errors during a race session.
   * Provides states for ongoing pit service processes as well as specific
   * errors indicating incorrect car positioning or serviceability issues.
   */
  enum class PitServiceStatus {
    // STATUS
    None = 0,
    InProgress,
    Complete,

    // ERRORS
    TooFarLeft = 100,
    TooFarRight,
    TooFarForward,
    TooFarBack,
    BadAngle,
    CantFixThat,
  };

  /**
   * Represents the different pacing modes a race session
   * can utilize. Each mode defines the arrangement and
   * behavior of cars under pacing conditions, such as
   * restarts or starting formations.
   */
  enum class PaceMode {
    SingleFileStart = 0,
    DoubleFileStart,
    SingleFileRestart,
    DoubleFileRestart,
    NotPacing,
  };

  /**
   * Represents different types of pacing flags used during a race session,
   * which determine specific instructions for cars under caution conditions.
   */
  enum class PaceFlagType : uint32_t {
    EndOfLine = 0x01,
    FreePass = 0x02,
    WavedAround = 0x04,
  };

  /**
   * Checks if a specific pace flag is set within a given bitmask.
   *
   * @param bitmask The bitmask to be checked against.
   * @param flag The pace flag to check for in the bitmask.
   * @return True if the provided flag is set in the bitmask, otherwise false.
   */
  inline bool IsPaceFlagSet(uint32_t bitmask, PaceFlagType flag) {
    return magic_enum::enum_underlying(flag) & bitmask > 0;
  }

  /**
   * Enumeration representing known variable names that are used
   * to encapsulate various telemetry data points and game state
   * information in `iRacing`. Each enumerator corresponds to a
   * specific data field provided by the telemetry system.
   */
  enum class KnownVarName {
    AirDensity = 0,
    AirPressure,
    AirTemp,
    Alt,
    Brake,
    BrakeRaw,
    CamCameraNumber,
    CamCameraState,
    CamCarIdx,
    CamGroupNumber,
    Clutch,
    CpuUsageBG,
    DCDriversSoFar,
    DCLapStatus,
    DisplayUnits,
    DriverMarker,
    EngineWarnings,
    EnterExitReset,
    FogLevel,
    FrameRate,
    FuelLevel,
    FuelLevelPct,
    FuelPress,
    FuelUsePerHour,
    Gear,
    IsDiskLoggingActive,
    IsDiskLoggingEnabled,
    IsInGarage,
    IsOnTrack,
    IsOnTrackCar,
    IsReplayPlaying,
    Lap,
    LapBestLap,
    LapBestLapTime,
    LapBestNLapLap,
    LapBestNLapTime,
    LapCurrentLapTime,
    LapDeltaToBestLap,
    LapDeltaToBestLap_DD,
    LapDeltaToBestLap_OK,
    LapDeltaToOptimalLap,
    LapDeltaToOptimalLap_DD,
    LapDeltaToOptimalLap_OK,
    LapDeltaToSessionBestLap,
    LapDeltaToSessionBestLap_DD,
    LapDeltaToSessionBestLap_OK,
    LapDeltaToSessionLastlLap,
    LapDeltaToSessionLastlLap_DD,
    LapDeltaToSessionLastlLap_OK,
    LapDeltaToSessionOptimalLap,
    LapDeltaToSessionOptimalLap_DD,
    LapDeltaToSessionOptimalLap_OK,
    LapDist,
    LapDistPct,
    LapLasNLapSeq,
    LapLastLapTime,
    LapLastNLapTime,
    Lat,
    LatAccel,
    Lon,
    LongAccel,
    ManifoldPress,
    OilLevel,
    OilPress,
    OilTemp,
    OnPitRoad,
    Pitch,
    PitchRate,
    PitOptRepairLeft,
    PitRepairLeft,
    PitSvFlags,
    PitSvFuel,
    PitSvLFP,
    PitSvLRP,
    PitSvRFP,
    PitSvRRP,
    PlayerCarClassPosition,
    PlayerCarPosition,
    PlayerCarMyIncidentCount,
    RaceLaps,
    RadioTransmitCarIdx,
    RadioTransmitFrequencyIdx,
    RadioTransmitRadioIdx,
    RelativeHumidity,
    ReplayFrameNum,
    ReplayFrameNumEnd,
    ReplayPlaySlowMotion,
    ReplayPlaySpeed,
    ReplaySessionNum,
    ReplaySessionTime,
    Roll,
    RollRate,
    RPM,
    SessionFlags,
    SessionLapsRemain,
    SessionNum,
    SessionState,
    SessionTick,
    SessionTime,
    SessionTimeRemain,
    SessionUniqueID,
    ShiftGrindRPM,
    ShiftIndicatorPct,
    ShiftPowerPct,
    Skies,
    Speed,
    SteeringWheelAngle,
    SteeringWheelAngleMax,
    SteeringWheelPctDamper,
    SteeringWheelPctTorque,
    SteeringWheelPctTorqueSign,
    SteeringWheelPctTorqueSignStops,
    SteeringWheelPeakForceNm,
    SteeringWheelTorque,
    Throttle,
    ThrottleRaw,
    TrackTemp,
    TrackTempCrew,
    VelocityX,
    VelocityY,
    VelocityZ,
    VertAccel,
    Voltage,
    WaterLevel,
    WaterTemp,
    WeatherType,
    WindDir,
    WindVel,
    Yaw,
    YawNorth,
    YawRate,
    CFrideHeight,
    CFshockDefl,
    CFshockVel,
    CFSRrideHeight,
    CRrideHeight,
    CRshockDefl,
    CRshockVel,
    dcABS,
    dcAntiRollFront,
    dcAntiRollRear,
    dcBoostLevel,
    dcBrakeBias,
    dcDiffEntry,
    dcDiffExit,
    dcDiffMiddle,
    dcEngineBraking,
    dcEnginePower,
    dcFuelMixture,
    dcRevLimiter,
    dcThrottleShape,
    dcTractionControl,
    dcTractionControl2,
    dcTractionControlToggle,
    dcWeightJackerLeft,
    dcWeightJackerRight,
    dcWingFront,
    dcWingRear,
    dpFNOMKnobSetting,
    dpFUFangleIndex,
    dpFWingAngle,
    dpFWingIndex,
    dpLrWedgeAdj,
    dpPSSetting,
    dpQtape,
    dpRBarSetting,
    dpRFTruckarmP1Dz,
    dpRRDamperPerchOffsetm,
    dpRrPerchOffsetm,
    dpRrWedgeAdj,
    dpRWingAngle,
    dpRWingIndex,
    dpRWingSetting,
    dpTruckarmP1Dz,
    dpWedgeAdj,
    LFbrakeLinePress,
    LFcoldPressure,
    LFpressure,
    LFrideHeight,
    LFshockDefl,
    LFshockVel,
    LFspeed,
    LFtempCL,
    LFtempCM,
    LFtempCR,
    LFtempL,
    LFtempM,
    LFtempR,
    LFwearL,
    LFwearM,
    LFwearR,
    LRbrakeLinePress,
    LRcoldPressure,
    LRpressure,
    LRrideHeight,
    LRshockDefl,
    LRshockVel,
    LRspeed,
    LRtempCL,
    LRtempCM,
    LRtempCR,
    LRtempL,
    LRtempM,
    LRtempR,
    LRwearL,
    LRwearM,
    LRwearR,
    RFbrakeLinePress,
    RFcoldPressure,
    RFpressure,
    RFrideHeight,
    RFshockDefl,
    RFshockVel,
    RFspeed,
    RFtempCL,
    RFtempCM,
    RFtempCR,
    RFtempL,
    RFtempM,
    RFtempR,
    RFwearL,
    RFwearM,
    RFwearR,
    RRbrakeLinePress,
    RRcoldPressure,
    RRpressure,
    RRrideHeight,
    RRshockDefl,
    RRshockVel,
    RRspeed,
    RRtempCL,
    RRtempCM,
    RRtempCR,
    RRtempL,
    RRtempM,
    RRtempR,
    RRwearL,
    RRwearM,
    RRwearR,
    CarIdxClassPosition,
    CarIdxEstTime,
    CarIdxF2Time,
    CarIdxGear,
    CarIdxLap,
    CarIdxLapDistPct,
    CarIdxOnPitRoad,
    CarIdxPosition,
    CarIdxRPM,
    CarIdxSteer,
    CarIdxTrackSurface,
  };

  /**
   * @brief An iterable list of `KnownVarName` values represented as their
   * respective name
   */
  constexpr auto KnownVarNames = magic_enum::enum_names<KnownVarName>();

  /**
   * @brief Convert enum constant to string_view
   *
   * @param name Known variable name
   * @return string_view of enum constant
   */
  constexpr std::string_view KnownVarNameToStringView(const KnownVarName &name) {
    return magic_enum::enum_name(name);
  }

  /**
   * Remote control the sim by sending these windows messages
   * camera and replay commands only work when you are out of your car,
   * pit commands only work when in your car
   */
  enum class BroadcastMessage {
    CamSwitchPos = 0,
    // car position, group, camera
    CamSwitchNum,
    // driver #, group, camera
    CamSetState,
    // CameraState, unused, unused
    ReplaySetPlaySpeed,
    // speed, slowMotion, unused
    ReplaySetPlayPosition,
    // ReplayPositionMode, Frame Number (high, low)
    ReplaySearch,
    // ReplaySearchMode, unused, unused
    ReplaySetState,
    // ReplayStateMode, unused, unused
    ReloadTextures,
    // ReloadTexturesMode, carIdx, unused
    ChatCommand,
    // ChatCommandMode, subCommand, unused
    PitCommand,
    // PitCommandMode, parameter
    TelemCommand,
    // TelemetryCommandMode, unused, unused
    FFBCommand,
    // FFBCommandMode, value (float, high, low)
    ReplaySearchSessionTime,
    // sessionNum, sessionTimeMS (high, low)
    VideoCapture,
    // VideoCaptureMode, unused, unused
    Last // unused placeholder
  };

  /**
   * Represents the modes available for executing chat commands
   * within the application.
   */
  enum class ChatCommandMode {
    // pass in a number from 1-15 representing the chat macro to launch
    Macro = 0,

    // Open up a new chat window
    BeginChat,

    // Reply to last private chat
    Reply,

    Cancel // Close chat window
  };

  /**
   * Enum class representing various pit command modes used to execute specific pit
   * stop actions during a race. Each mode corresponds to a distinct operation related
   * to pit services.
   *
   * > NOTE: this only works when the driver is in the car
   */
  enum class PitCommandMode
  {
    // Clear all pit checkboxes
    Clear = 0,

    // Clean the windshield, using one tear off
    WS,

    // Add fuel, optionally specify the amount to add in liters or pass '0' to use existing amount
    Fuel,

    // Change the left front tire, optionally specifying the pressure in KPa or pass '0' to use existing pressure
    LF,

    // right front
    RF,

    // left rear
    LR,

    // right rear
    RR,

    // Clear tire pit checkboxes
    ClearTires,

    // Request a fast repair
    FR,

    // Uncheck Clean the winshield checkbox
    ClearWS,

    // Uncheck request a fast repair
    ClearFR,

    // Uncheck add fuel
    ClearFuel,

  };

  /**
   * You can call this any time, but telemetry only records when driver is in there car
   */
  enum class TelemetryCommandMode
  {
    // Turn telemetry recording off
    Stop = 0,

    // Turn telemetry recording on
    Start,

    // Write current file to disk and start a new one
    Restart
  };

  enum class ReplayStateMode {
    // clear any data in the replay tape
    EraseTape = 0,

    Last // unused place holder
  };

  /**
   * Defines the modes for reloading textures, determining
   * the scope of texture reloading operations.
   */
  enum class ReloadTexturesMode {
    // reload all textures
    All = 0,

    // reload only textures for the specific carIdx
    CarIdx
  };

  /**
   * Enum representing various search modes for navigating
   * through a replay in a simulation or replay system.
   */
  enum class ReplaySearchMode {
    ToStart = 0,
    ToEnd,
    PrevSession,
    NextSession,
    PrevLap,
    NextLap,
    PrevFrame,
    NextFrame,
    PrevIncident,
    NextIncident,
    Last // unused placeholder
  };

  /**
   * Represents the mode used to specify a position within
   * a replay session in the simulation.
   */
  enum class ReplayPositionMode {
    Begin = 0,
    Current,
    End,
    Last // unused placeholder
  };

  /**
   * Modes for configuring force feedback (FFB) commands.
   */
  enum class FFBCommandMode // You can call this any time
  {
    // Set the maximum force when mapping steering torque force to direct input units (float in Nm)
    MaxForce = 0,

    Last // unused placeholder
  };

  /**
   * CamSwitchPos or CamSwitchNum camera focus defines
   * pass these in for the first parameter to select the 'focus at' types in the camera system.
   */
  enum class CameraSwitchMode {
    FocusAtIncident = -3,
    FocusAtLeader = -2,
    FocusAtExiting = -1,
    // ctFocusAtDriver + car number...
    FocusAtDriver = 0
  };

  /**
   * Specifies various modes for video capture operations which include
   * screenshot capture, video capture controls, and video timer display options.
   */
  enum class VideoCaptureMode {
    // save a screenshot to disk
    TriggerScreenShot = 0,

    // start capturing video
    StartVideoCapture,

    // stop capturing video
    EndVideoCapture,

    // toggle video capture on/off
    ToggleVideoCapture,

    // show video timer in upper left corner of display
    ShowVideoTimer,

    // hide video timer
    HideVideoTimer,

  };
} // namespace IRacingTools::SDK
