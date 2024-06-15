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


/*
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

 - Remote Conrol
   You can control the camera selections and playback of a replay tape, from
   any external application by sending a windows message with the 
   irsdk_broadcastMsg() function.
*/
#pragma once

#include <chrono>

#include <magic_enum.hpp>
#include <windows.h>

#include <IRacingTools/SDK/Utils/LUT.h>

namespace IRacingTools::SDK {
    using ClientId = std::string_view;

    template <typename T>
    using Opt = std::optional<T>;

    using SessionTime = std::chrono::milliseconds;

    enum class ConnectionStatus : int {
        NotConnected = 0,
        Connected = 1
    };

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

    constexpr std::size_t VarDataTypeCount = magic_enum::enum_count<VarDataType>();

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

    constexpr std::array<std::size_t, VarDataTypeCount> VarDataTypeBytes = VarDataTypeSizeTable.values();
    //     {
    //     1,		// type_char
    //     1,		// type_bool
    //
    //     4,		// type_int
    //     4,		// type_bitmask
    //     4,		// type_float
    //
    //     8		// type_double
    // };

    // bit fields
    enum class EngineWarning {
        WaterTemp = 0x01,
        FuelPressure = 0x02,
        OilPressure = 0x04,
        EngineStalled = 0x08,
        PitSpeedLimiter = 0x10,
        RevLimiterActive = 0x20,
        OilTemp = 0x40,
    };

    // global flags
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
        Servicible = 0x00040000,
        // car is allowed service (not a flag)
        Furled = 0x00080000,
        Repair = 0x00100000,

        // start lights
        StartHidden = 0x10000000,
        StartReady = 0x20000000,
        StartSet = 0x40000000,
        StartGo = 0x80000000,
    };

    inline bool IsFlagSet(uint32_t bitmask, FlagType flag) {
        return magic_enum::enum_underlying(flag) & bitmask > 0;
    }

    // status
    enum class TrackLocation {
        NotInWorld = -1,
        OffTrack,
        InPitStall,
        ApproachingPits,
        OnTrack
    };

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

    enum class SessionState {
        Invalid,
        GetInCar,
        Warmup,
        ParadeLaps,
        Racing,
        Checkered,
        CoolDown
    };

    enum class CarLeftRight {
        LROff,
        LRClear,
        // no cars around us.
        LRCarLeft,
        // there is a car to our left.
        LRCarRight,
        // there is a car to our right.
        LRCarLeftRight,
        // there are cars on each side.
        LR2CarsLeft,
        // there are two cars to our left.
        LR2CarsRight // there are two cars to our right.
    };

    enum class CameraState {
        IsSessionScreen = 0x0001,
        // the camera tool can only be activated if viewing the session screen (out of car)
        IsScenicActive = 0x0002,
        // the scenic camera is active (no focus car)

        //these can be changed with a broadcast message
        CamToolActive = 0x0004,
        UIHidden = 0x0008,
        UseAutoShotSelection = 0x0010,
        UseTemporaryEdits = 0x0020,
        UseKeyAcceleration = 0x0040,
        UseKey10xAcceleration = 0x0080,
        UseMouseAimMode = 0x0100
    };

    enum class PitSvTask {
        LFTireChange = 0x0001,
        RFTireChange = 0x0002,
        LRTireChange = 0x0004,
        RRTireChange = 0x0008,
        FuelFill = 0x0010,
        WindshieldTearoff = 0x0020,
        FastRepair = 0x0040
    };

    enum class PitSvStatus {
        // status
        None = 0,
        InProgress,
        Complete,

        // errors
        TooFarLeft = 100,
        TooFarRight,
        TooFarForward,
        TooFarBack,
        BadAngle,
        CantFixThat,
    };

    enum class PaceMode {
        SingleFileStart = 0,
        DoubleFileStart,
        SingleFileRestart,
        DoubleFileRestart,
        NotPacing,
    };

    enum class PaceFlagType : uint32_t {
        EndOfLine = 0x01,
        FreePass = 0x02,
        WavedAround = 0x04,
    };

    inline bool IsPaceFlagSet(uint32_t bitmask, PaceFlagType flag) {
        return magic_enum::enum_underlying(flag) & bitmask > 0;
    }

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

    constexpr auto KnownVarNames = magic_enum::enum_names<KnownVarName>();

    /**
     * @brief Convert enum constant to string_view
     *
     * @param name Known variable name
     * @return string_view of enum constant
     */
    constexpr std::string_view KnownVarNameToStringView(const KnownVarName& name) {
        return magic_enum::enum_name(name);
    }


    //----
    //


    //----
    // Remote control the sim by sending these windows messages
    // camera and replay commands only work when you are out of your car,
    // pit commands only work when in your car
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

    enum class ChatCommandMode {
        Macro = 0,
        // pass in a number from 1-15 representing the chat macro to launch
        BeginChat,
        // Open up a new chat window
        Reply,
        // Reply to last private chat
        Cancel // Close chat window
    };

    enum class PitCommandMode // this only works when the driver is in the car
    {
        Clear = 0,
        // Clear all pit checkboxes
        WS,
        // Clean the winshield, using one tear off
        Fuel,
        // Add fuel, optionally specify the amount to add in liters or pass '0' to use existing amount
        LF,
        // Change the left front tire, optionally specifying the pressure in KPa or pass '0' to use existing pressure
        RF,
        // right front
        LR,
        // left rear
        RR,
        // right rear
        ClearTires,
        // Clear tire pit checkboxes
        FR,
        // Request a fast repair
        ClearWS,
        // Uncheck Clean the winshield checkbox
        ClearFR,
        // Uncheck request a fast repair
        ClearFuel,
        // Uncheck add fuel
    };

    enum class TelemetryCommandMode // You can call this any time, but telemtry only records when driver is in there car
    {
        Stop = 0,
        // Turn telemetry recording off
        Start,
        // Turn telemetry recording on
        Restart,
        // Write current file to disk and start a new one
    };

    enum class ReplayStateMode {
        EraseTape = 0,
        // clear any data in the replay tape
        Last // unused place holder
    };

    enum class ReloadTexturesMode {
        All = 0,
        // reload all textuers
        CarIdx // reload only textures for the specific carIdx
    };

    // Search replay tape for events
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

    enum class ReplayPositionMode {
        Begin = 0,
        Current,
        End,
        Last // unused placeholder
    };

    enum class FFBCommandMode // You can call this any time
    {
        MaxForce = 0,
        // Set the maximum force when mapping steering torque force to direct input units (float in Nm)
        Last // unused placeholder
    };

    // CamSwitchPos or CamSwitchNum camera focus defines
    // pass these in for the first parameter to select the 'focus at' types in the camera system.
    enum class CameraSwitchMode {
        FocusAtIncident = -3,
        FocusAtLeader = -2,
        FocusAtExiting = -1,
        // ctFocusAtDriver + car number...
        FocusAtDriver = 0
    };

    enum class VideoCaptureMode {
        TriggerScreenShot = 0,
        // save a screenshot to disk
        StartVideoCapture,
        // start capturing video
        EndVideoCapture,
        // stop capturing video
        ToggleVideoCapture,
        // toggle video capture on/off
        ShowVideoTimer,
        // show video timer in upper left corner of display
        HideVideoTimer,
        // hide video timer
    };
}
