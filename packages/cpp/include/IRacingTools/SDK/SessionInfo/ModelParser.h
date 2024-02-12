//
// Created by jglanz on 2/10/2024.
//

#pragma once

#include <yaml-cpp/yaml.h>

#include "SessionInfoMessage.h"

namespace YAML {
  using namespace IRacingTools::SDK::SessionInfo;

  template<> struct convert<SessionInfoMessage> {
    static Node encode(const SessionInfoMessage &rhs) {
      Node node;
      node["WeekendInfo"] = rhs.weekendInfo;
      node["SessionInfo"] = rhs.sessionInfo;
      node["QualifyResultsInfo"] = rhs.qualifyResultsInfo;
      node["CameraInfo"] = rhs.cameraInfo;
      node["RadioInfo"] = rhs.radioInfo;
      node["DriverInfo"] = rhs.driverInfo;
      node["SplitTimeInfo"] = rhs.splitTimeInfo;
//      node["CarSetup"] = rhs.carSetup;
      return node;
    }

    static bool decode(const Node &node, SessionInfoMessage &rhs) {
      rhs.weekendInfo = node["WeekendInfo"].as<WeekendInfo>();
      rhs.sessionInfo = node["SessionInfo"].as<SessionInfo>();
      rhs.qualifyResultsInfo = node["QualifyResultsInfo"].as<QualifyResultsInfo>();
      rhs.cameraInfo = node["CameraInfo"].as<CameraInfo>();
      rhs.radioInfo = node["RadioInfo"].as<RadioInfo>();
      rhs.driverInfo = node["DriverInfo"].as<DriverInfo>();
      rhs.splitTimeInfo = node["SplitTimeInfo"].as<SplitTimeInfo>();
//      rhs.carSetup = node["CarSetup"].as<CarSetup>();
      return true;
    }
  };

  template<> struct convert<WeekendInfo> {
    static Node encode(const WeekendInfo &rhs) {
      Node node;
      node["TrackName"] = rhs.trackName;
      node["TrackID"] = rhs.trackID;
      node["TrackLength"] = rhs.trackLength;
      node["TrackLengthOfficial"] = rhs.trackLengthOfficial;
      node["TrackDisplayName"] = rhs.trackDisplayName;
      node["TrackDisplayShortName"] = rhs.trackDisplayShortName;
      node["TrackConfigName"] = rhs.trackConfigName;
      node["TrackCity"] = rhs.trackCity;
      node["TrackCountry"] = rhs.trackCountry;
      node["TrackAltitude"] = rhs.trackAltitude;
      node["TrackLatitude"] = rhs.trackLatitude;
      node["TrackLongitude"] = rhs.trackLongitude;
      node["TrackNorthOffset"] = rhs.trackNorthOffset;
      node["TrackNumTurns"] = rhs.trackNumTurns;
      node["TrackPitSpeedLimit"] = rhs.trackPitSpeedLimit;
      node["TrackType"] = rhs.trackType;
      node["TrackDirection"] = rhs.trackDirection;
      node["TrackWeatherType"] = rhs.trackWeatherType;
      node["TrackSkies"] = rhs.trackSkies;
      node["TrackSurfaceTemp"] = rhs.trackSurfaceTemp;
      node["TrackAirTemp"] = rhs.trackAirTemp;
      node["TrackAirPressure"] = rhs.trackAirPressure;
      node["TrackWindVel"] = rhs.trackWindVel;
      node["TrackWindDir"] = rhs.trackWindDir;
      node["TrackRelativeHumidity"] = rhs.trackRelativeHumidity;
      node["TrackFogLevel"] = rhs.trackFogLevel;
      node["TrackPrecipitation"] = rhs.trackPrecipitation;
      node["TrackCleanup"] = rhs.trackCleanup;
      node["TrackDynamicTrack"] = rhs.trackDynamicTrack;
      node["TrackVersion"] = rhs.trackVersion;
      node["SeriesID"] = rhs.seriesID;
      node["SeasonID"] = rhs.seasonID;
      node["SessionID"] = rhs.sessionID;
      node["SubSessionID"] = rhs.subSessionID;
      node["LeagueID"] = rhs.leagueID;
      node["Official"] = rhs.official;
      node["RaceWeek"] = rhs.raceWeek;
      node["EventType"] = rhs.eventType;
      node["Category"] = rhs.category;
      node["SimMode"] = rhs.simMode;
      node["TeamRacing"] = rhs.teamRacing;
      node["MinDrivers"] = rhs.minDrivers;
      node["MaxDrivers"] = rhs.maxDrivers;
      node["DCRuleSet"] = rhs.dCRuleSet;
      node["QualifierMustStartRace"] = rhs.qualifierMustStartRace;
      node["NumCarClasses"] = rhs.numCarClasses;
      node["NumCarTypes"] = rhs.numCarTypes;
      node["HeatRacing"] = rhs.heatRacing;
      node["BuildType"] = rhs.buildType;
      node["BuildTarget"] = rhs.buildTarget;
      node["BuildVersion"] = rhs.buildVersion;
      node["WeekendOptions"] = rhs.weekendOptions;
      node["TelemetryOptions"] = rhs.telemetryOptions;
      return node;
    }

    static bool decode(const Node &node, WeekendInfo &rhs) {
      rhs.trackName = node["TrackName"].as<std::string>();
      rhs.trackID = node["TrackID"].as<std::int32_t>();
      rhs.trackLength = node["TrackLength"].as<std::string>();
      rhs.trackLengthOfficial = node["TrackLengthOfficial"].as<std::string>();
      rhs.trackDisplayName = node["TrackDisplayName"].as<std::string>();
      rhs.trackDisplayShortName = node["TrackDisplayShortName"].as<std::string>();
      rhs.trackConfigName = node["TrackConfigName"].as<std::string>();
      rhs.trackCity = node["TrackCity"].as<std::string>();
      rhs.trackCountry = node["TrackCountry"].as<std::string>();
      rhs.trackAltitude = node["TrackAltitude"].as<std::string>();
      rhs.trackLatitude = node["TrackLatitude"].as<std::string>();
      rhs.trackLongitude = node["TrackLongitude"].as<std::string>();
      rhs.trackNorthOffset = node["TrackNorthOffset"].as<std::string>();
      rhs.trackNumTurns = node["TrackNumTurns"].as<std::int32_t>();
      rhs.trackPitSpeedLimit = node["TrackPitSpeedLimit"].as<std::string>();
      rhs.trackType = node["TrackType"].as<std::string>();
      rhs.trackDirection = node["TrackDirection"].as<std::string>();
      rhs.trackWeatherType = node["TrackWeatherType"].as<std::string>();
      rhs.trackSkies = node["TrackSkies"].as<std::string>();
      rhs.trackSurfaceTemp = node["TrackSurfaceTemp"].as<std::string>();
      rhs.trackAirTemp = node["TrackAirTemp"].as<std::string>();
      rhs.trackAirPressure = node["TrackAirPressure"].as<std::string>();
      rhs.trackWindVel = node["TrackWindVel"].as<std::string>();
      rhs.trackWindDir = node["TrackWindDir"].as<std::string>();
      rhs.trackRelativeHumidity = node["TrackRelativeHumidity"].as<std::string>();
      rhs.trackFogLevel = node["TrackFogLevel"].as<std::string>();
      rhs.trackPrecipitation = node["TrackPrecipitation"].as<std::string>();
      rhs.trackCleanup = node["TrackCleanup"].as<std::int32_t>();
      rhs.trackDynamicTrack = node["TrackDynamicTrack"].as<std::int32_t>();
      rhs.trackVersion = node["TrackVersion"].as<std::string>();
      rhs.seriesID = node["SeriesID"].as<std::int32_t>();
      rhs.seasonID = node["SeasonID"].as<std::int32_t>();
      rhs.sessionID = node["SessionID"].as<std::int32_t>();
      rhs.subSessionID = node["SubSessionID"].as<std::int32_t>();
      rhs.leagueID = node["LeagueID"].as<std::int32_t>();
      rhs.official = node["Official"].as<std::int32_t>();
      rhs.raceWeek = node["RaceWeek"].as<std::int32_t>();
      rhs.eventType = node["EventType"].as<std::string>();
      rhs.category = node["Category"].as<std::string>();
      rhs.simMode = node["SimMode"].as<std::string>();
      rhs.teamRacing = node["TeamRacing"].as<std::int32_t>();
      rhs.minDrivers = node["MinDrivers"].as<std::int32_t>();
      rhs.maxDrivers = node["MaxDrivers"].as<std::int32_t>();
      rhs.dCRuleSet = node["DCRuleSet"].as<std::string>();
      rhs.qualifierMustStartRace = node["QualifierMustStartRace"].as<std::int32_t>();
      rhs.numCarClasses = node["NumCarClasses"].as<std::int32_t>();
      rhs.numCarTypes = node["NumCarTypes"].as<std::int32_t>();
      rhs.heatRacing = node["HeatRacing"].as<std::int32_t>();
      rhs.buildType = node["BuildType"].as<std::string>();
      rhs.buildTarget = node["BuildTarget"].as<std::string>();
      rhs.buildVersion = node["BuildVersion"].as<std::string>();
      rhs.weekendOptions = node["WeekendOptions"].as<WeekendOptions>();
      rhs.telemetryOptions = node["TelemetryOptions"].as<TelemetryOptions>();
      return true;
    }
  };

  template<> struct convert<WeekendOptions> {
    static Node encode(const WeekendOptions &rhs) {
      Node node;
      node["NumStarters"] = rhs.numStarters;
      node["StartingGrid"] = rhs.startingGrid;
      node["QualifyScoring"] = rhs.qualifyScoring;
      node["CourseCautions"] = rhs.courseCautions;
      node["StandingStart"] = rhs.standingStart;
      node["ShortParadeLap"] = rhs.shortParadeLap;
      node["Restarts"] = rhs.restarts;
      node["WeatherType"] = rhs.weatherType;
      node["Skies"] = rhs.skies;
      node["WindDirection"] = rhs.windDirection;
      node["WindSpeed"] = rhs.windSpeed;
      node["WeatherTemp"] = rhs.weatherTemp;
      node["RelativeHumidity"] = rhs.relativeHumidity;
      node["FogLevel"] = rhs.fogLevel;
      node["TimeOfDay"] = rhs.timeOfDay;
      node["Date"] = rhs.date;
      node["EarthRotationSpeedupFactor"] = rhs.earthRotationSpeedupFactor;
      node["Unofficial"] = rhs.unofficial;
      node["CommercialMode"] = rhs.commercialMode;
      node["NightMode"] = rhs.nightMode;
      node["IsFixedSetup"] = rhs.isFixedSetup;
      node["StrictLapsChecking"] = rhs.strictLapsChecking;
      node["HasOpenRegistration"] = rhs.hasOpenRegistration;
      node["HardcoreLevel"] = rhs.hardcoreLevel;
      node["NumJokerLaps"] = rhs.numJokerLaps;
      node["IncidentLimit"] = rhs.incidentLimit;
      node["FastRepairsLimit"] = rhs.fastRepairsLimit;
      node["GreenWhiteCheckeredLimit"] = rhs.greenWhiteCheckeredLimit;
      return node;
    }

    static bool decode(const Node &node, WeekendOptions &rhs) {
      rhs.numStarters = node["NumStarters"].as<std::int32_t>();
      rhs.startingGrid = node["StartingGrid"].as<std::string>();
      rhs.qualifyScoring = node["QualifyScoring"].as<std::string>();
      rhs.courseCautions = node["CourseCautions"].as<std::string>();
      rhs.standingStart = node["StandingStart"].as<std::int32_t>();
      rhs.shortParadeLap = node["ShortParadeLap"].as<std::int32_t>();
      rhs.restarts = node["Restarts"].as<std::string>();
      rhs.weatherType = node["WeatherType"].as<std::string>();
      rhs.skies = node["Skies"].as<std::string>();
      rhs.windDirection = node["WindDirection"].as<std::string>();
      rhs.windSpeed = node["WindSpeed"].as<std::string>();
      rhs.weatherTemp = node["WeatherTemp"].as<std::string>();
      rhs.relativeHumidity = node["RelativeHumidity"].as<std::string>();
      rhs.fogLevel = node["FogLevel"].as<std::string>();
      rhs.timeOfDay = node["TimeOfDay"].as<std::string>();
      rhs.date = node["Date"].as<std::string>();
      rhs.earthRotationSpeedupFactor = node["EarthRotationSpeedupFactor"].as<std::int32_t>();
      rhs.unofficial = node["Unofficial"].as<std::int32_t>();
      rhs.commercialMode = node["CommercialMode"].as<std::string>();
      rhs.nightMode = node["NightMode"].as<std::string>();
      rhs.isFixedSetup = node["IsFixedSetup"].as<std::int32_t>();
      rhs.strictLapsChecking = node["StrictLapsChecking"].as<std::string>();
      rhs.hasOpenRegistration = node["HasOpenRegistration"].as<std::int32_t>();
      rhs.hardcoreLevel = node["HardcoreLevel"].as<std::int32_t>();
      rhs.numJokerLaps = node["NumJokerLaps"].as<std::int32_t>();
      rhs.incidentLimit = node["IncidentLimit"].as<std::int32_t>();
      rhs.fastRepairsLimit = node["FastRepairsLimit"].as<std::int32_t>();
      rhs.greenWhiteCheckeredLimit = node["GreenWhiteCheckeredLimit"].as<std::int32_t>();
      return true;
    }
  };

  template<> struct convert<TelemetryOptions> {
    static Node encode(const TelemetryOptions &rhs) {
      Node node;
      node["TelemetryDiskFile"] = rhs.telemetryDiskFile;
      return node;
    }

    static bool decode(const Node &node, TelemetryOptions &rhs) {
      rhs.telemetryDiskFile = node["TelemetryDiskFile"].as<std::string>();
      return true;
    }
  };

  template<> struct convert<SessionInfo> {
    static Node encode(const SessionInfo &rhs) {
      Node node;
      node["Sessions"] = rhs.sessions;
      return node;
    }

    static bool decode(const Node &node, SessionInfo &rhs) {
      rhs.sessions = node["Sessions"].as<std::vector<Session>>();
      return true;
    }
  };

  template<> struct convert<Session> {
    static Node encode(const Session &rhs) {
      Node node;
      node["SessionNum"] = rhs.sessionNum;
      node["SessionLaps"] = rhs.sessionLaps;
      node["SessionTime"] = rhs.sessionTime;
      node["SessionNumLapsToAvg"] = rhs.sessionNumLapsToAvg;
      node["SessionType"] = rhs.sessionType;
      node["SessionTrackRubberState"] = rhs.sessionTrackRubberState;
      node["SessionName"] = rhs.sessionName;
      //        node["SessionSubType"] = rhs.sessionSubType;
      node["SessionSkipped"] = rhs.sessionSkipped;
      node["SessionRunGroupsUsed"] = rhs.sessionRunGroupsUsed;
      node["SessionEnforceTireCompoundChange"] = rhs.sessionEnforceTireCompoundChange;
      node["ResultsPositions"] = rhs.resultsPositions;
      node["ResultsFastestLap"] = rhs.resultsFastestLap;
      node["ResultsAverageLapTime"] = rhs.resultsAverageLapTime;
      node["ResultsNumCautionFlags"] = rhs.resultsNumCautionFlags;
      node["ResultsNumCautionLaps"] = rhs.resultsNumCautionLaps;
      node["ResultsNumLeadChanges"] = rhs.resultsNumLeadChanges;
      node["ResultsLapsComplete"] = rhs.resultsLapsComplete;
      node["ResultsOfficial"] = rhs.resultsOfficial;
      return node;
    }

    static bool decode(const Node &node, Session &rhs) {
      rhs.sessionNum = node["SessionNum"].as<std::int32_t>();
      rhs.sessionLaps = node["SessionLaps"].as<std::string>();
      rhs.sessionTime = node["SessionTime"].as<std::string>();
      rhs.sessionNumLapsToAvg = node["SessionNumLapsToAvg"].as<std::int32_t>();
      rhs.sessionType = node["SessionType"].as<std::string>();
      rhs.sessionTrackRubberState = node["SessionTrackRubberState"].as<std::string>();
      rhs.sessionName = node["SessionName"].as<std::string>();
      //        rhs.sessionSubType = node["SessionSubType"].as<std::string>();
      rhs.sessionSkipped = node["SessionSkipped"].as<std::int32_t>();
      rhs.sessionRunGroupsUsed = node["SessionRunGroupsUsed"].as<std::int32_t>();
      rhs.sessionEnforceTireCompoundChange = node["SessionEnforceTireCompoundChange"].as<std::int32_t>();
//      rhs.resultsPositions = node["ResultsPositions"].as<std::vector<ResultsPosition>>();
//      rhs.resultsFastestLap = node["ResultsFastestLap"].as<std::vector<ResultsFastestLap>>();
//      rhs.resultsAverageLapTime = node["ResultsAverageLapTime"].as<float>();
//      rhs.resultsNumCautionFlags = node["ResultsNumCautionFlags"].as<std::int32_t>();
//      rhs.resultsNumCautionLaps = node["ResultsNumCautionLaps"].as<std::int32_t>();
//      rhs.resultsNumLeadChanges = node["ResultsNumLeadChanges"].as<std::int32_t>();
//      rhs.resultsLapsComplete = node["ResultsLapsComplete"].as<std::int32_t>();
//      rhs.resultsOfficial = node["ResultsOfficial"].as<std::int32_t>();
      return true;
    }
  };

  template<> struct convert<ResultsPosition> {
    static Node encode(const ResultsPosition &rhs) {
      Node node;
      node["Position"] = rhs.position;
      node["ClassPosition"] = rhs.classPosition;
      node["CarIdx"] = rhs.carIdx;
      node["Lap"] = rhs.lap;
      node["Time"] = rhs.time;
      node["FastestLap"] = rhs.fastestLap;
      node["FastestTime"] = rhs.fastestTime;
      node["LastTime"] = rhs.lastTime;
      node["LapsLed"] = rhs.lapsLed;
      node["LapsComplete"] = rhs.lapsComplete;
      node["JokerLapsComplete"] = rhs.jokerLapsComplete;
      node["LapsDriven"] = rhs.lapsDriven;
      node["Incidents"] = rhs.incidents;
      node["ReasonOutId"] = rhs.reasonOutId;
      node["ReasonOutStr"] = rhs.reasonOutStr;
      return node;
    }

    static bool decode(const Node &node, ResultsPosition &rhs) {
      rhs.position = node["Position"].as<std::int32_t>();
      rhs.classPosition = node["ClassPosition"].as<std::int32_t>();
      rhs.carIdx = node["CarIdx"].as<std::int32_t>();
      rhs.lap = node["Lap"].as<std::int32_t>();
      rhs.time = node["Time"].as<float>();
      rhs.fastestLap = node["FastestLap"].as<std::int32_t>();
      rhs.fastestTime = node["FastestTime"].as<float>();
      rhs.lastTime = node["LastTime"].as<float>();
      rhs.lapsLed = node["LapsLed"].as<std::int32_t>();
      rhs.lapsComplete = node["LapsComplete"].as<std::int32_t>();
      rhs.jokerLapsComplete = node["JokerLapsComplete"].as<std::int32_t>();
      rhs.lapsDriven = node["LapsDriven"].as<float>();
      rhs.incidents = node["Incidents"].as<std::int32_t>();
      rhs.reasonOutId = node["ReasonOutId"].as<std::int32_t>();
      rhs.reasonOutStr = node["ReasonOutStr"].as<std::string>();
      return true;
    }
  };

  template<> struct convert<ResultsFastestLap> {
    static Node encode(const ResultsFastestLap &rhs) {
      Node node;
      node["CarIdx"] = rhs.carIdx;
      node["FastestLap"] = rhs.fastestLap;
      node["FastestTime"] = rhs.fastestTime;
      return node;
    }

    static bool decode(const Node &node, ResultsFastestLap &rhs) {
      rhs.carIdx = node["CarIdx"].as<std::int32_t>();
      rhs.fastestLap = node["FastestLap"].as<std::int32_t>();
      rhs.fastestTime = node["FastestTime"].as<float>();
      return true;
    }
  };

  template<> struct convert<QualifyResultsInfo> {
    static Node encode(const QualifyResultsInfo &rhs) {
      Node node;
      node["Results"] = rhs.results;
      return node;
    }

    static bool decode(const Node &node, QualifyResultsInfo &rhs) {
      rhs.results = node["Results"].as<std::vector<SessionResult>>();
      return true;
    }
  };

  template<> struct convert<SessionResult> {
    static Node encode(const SessionResult &rhs) {
      Node node;
      node["Position"] = rhs.position;
      node["ClassPosition"] = rhs.classPosition;
      node["CarIdx"] = rhs.carIdx;
      node["FastestLap"] = rhs.fastestLap;
      node["FastestTime"] = rhs.fastestTime;
      return node;
    }

    static bool decode(const Node &node, SessionResult &rhs) {
      rhs.position = node["Position"].as<std::int32_t>();
      rhs.classPosition = node["ClassPosition"].as<std::int32_t>();
      rhs.carIdx = node["CarIdx"].as<std::int32_t>();
      rhs.fastestLap = node["FastestLap"].as<std::int32_t>();
      rhs.fastestTime = node["FastestTime"].as<float>();
      return true;
    }
  };

  template<> struct convert<CameraInfo> {
    static Node encode(const CameraInfo &rhs) {
      Node node;
      node["Groups"] = rhs.groups;
      return node;
    }

    static bool decode(const Node &node, CameraInfo &rhs) {
      rhs.groups = node["Groups"].as<std::vector<Group>>();
      return true;
    }
  };

  template<> struct convert<Group> {
    static Node encode(const Group &rhs) {
      Node node;
      node["GroupNum"] = rhs.groupNum;
      node["GroupName"] = rhs.groupName;
      node["Cameras"] = rhs.cameras;
      return node;
    }

    static bool decode(const Node &node, Group &rhs) {
      rhs.groupNum = node["GroupNum"].as<std::int32_t>();
      rhs.groupName = node["GroupName"].as<std::string>();
      rhs.cameras = node["Cameras"].as<std::vector<Camera>>();
      return true;
    }
  };

  template<> struct convert<Camera> {
    static Node encode(const Camera &rhs) {
      Node node;
      node["CameraNum"] = rhs.cameraNum;
      node["CameraName"] = rhs.cameraName;
      return node;
    }

    static bool decode(const Node &node, Camera &rhs) {
      rhs.cameraNum = node["CameraNum"].as<std::int32_t>();
      rhs.cameraName = node["CameraName"].as<std::string>();
      return true;
    }
  };

  template<> struct convert<RadioInfo> {
    static Node encode(const RadioInfo &rhs) {
      Node node;
      node["SelectedRadioNum"] = rhs.selectedRadioNum;
      node["Radios"] = rhs.radios;
      return node;
    }

    static bool decode(const Node &node, RadioInfo &rhs) {
      rhs.selectedRadioNum = node["SelectedRadioNum"].as<std::int32_t>();
      rhs.radios = node["Radios"].as<std::vector<Radio>>();
      return true;
    }
  };

  template<> struct convert<Radio> {
    static Node encode(const Radio &rhs) {
      Node node;
      node["RadioNum"] = rhs.radioNum;
      node["HopCount"] = rhs.hopCount;
      node["NumFrequencies"] = rhs.numFrequencies;
      node["TunedToFrequencyNum"] = rhs.tunedToFrequencyNum;
      node["ScanningIsOn"] = rhs.scanningIsOn;
      node["Frequencies"] = rhs.frequencies;
      return node;
    }

    static bool decode(const Node &node, Radio &rhs) {
      rhs.radioNum = node["RadioNum"].as<std::int32_t>();
      rhs.hopCount = node["HopCount"].as<std::int32_t>();
      rhs.numFrequencies = node["NumFrequencies"].as<std::int32_t>();
      rhs.tunedToFrequencyNum = node["TunedToFrequencyNum"].as<std::int32_t>();
      rhs.scanningIsOn = node["ScanningIsOn"].as<std::int32_t>();
      rhs.frequencies = node["Frequencies"].as<std::vector<Frequency>>();
      return true;
    }
  };

  template<> struct convert<Frequency> {
    static Node encode(const Frequency &rhs) {
      Node node;
      node["FrequencyNum"] = rhs.frequencyNum;
      node["FrequencyName"] = rhs.frequencyName;
      node["Priority"] = rhs.priority;
      node["CarIdx"] = rhs.carIdx;
      node["EntryIdx"] = rhs.entryIdx;
      node["ClubID"] = rhs.clubID;
      node["CanScan"] = rhs.canScan;
      node["CanSquawk"] = rhs.canSquawk;
      node["Muted"] = rhs.muted;
      node["IsMutable"] = rhs.isMutable;
      node["IsDeletable"] = rhs.isDeletable;
      return node;
    }

    static bool decode(const Node &node, Frequency &rhs) {
      rhs.frequencyNum = node["FrequencyNum"].as<std::int32_t>();
      rhs.frequencyName = node["FrequencyName"].as<std::string>();
      rhs.priority = node["Priority"].as<std::int32_t>();
      rhs.carIdx = node["CarIdx"].as<std::int32_t>();
      rhs.entryIdx = node["EntryIdx"].as<std::int32_t>();
      rhs.clubID = node["ClubID"].as<std::int32_t>();
      rhs.canScan = node["CanScan"].as<std::int32_t>();
      rhs.canSquawk = node["CanSquawk"].as<std::int32_t>();
      rhs.muted = node["Muted"].as<std::int32_t>();
      rhs.isMutable = node["IsMutable"].as<std::int32_t>();
      rhs.isDeletable = node["IsDeletable"].as<std::int32_t>();
      return true;
    }
  };

  template<> struct convert<DriverInfo> {
    static Node encode(const DriverInfo &rhs) {
      Node node;
      node["DriverCarIdx"] = rhs.driverCarIdx;
      node["DriverUserID"] = rhs.driverUserID;
      node["PaceCarIdx"] = rhs.paceCarIdx;
      node["DriverHeadPosX"] = rhs.driverHeadPosX;
      node["DriverHeadPosY"] = rhs.driverHeadPosY;
      node["DriverHeadPosZ"] = rhs.driverHeadPosZ;
      node["DriverCarIsElectric"] = rhs.driverCarIsElectric;
      node["DriverCarIdleRPM"] = rhs.driverCarIdleRPM;
      node["DriverCarRedLine"] = rhs.driverCarRedLine;
      node["DriverCarEngCylinderCount"] = rhs.driverCarEngCylinderCount;
      node["DriverCarFuelKgPerLtr"] = rhs.driverCarFuelKgPerLtr;
      node["DriverCarFuelMaxLtr"] = rhs.driverCarFuelMaxLtr;
      node["DriverCarMaxFuelPct"] = rhs.driverCarMaxFuelPct;
      node["DriverCarGearNumForward"] = rhs.driverCarGearNumForward;
      node["DriverCarGearNeutral"] = rhs.driverCarGearNeutral;
      node["DriverCarGearReverse"] = rhs.driverCarGearReverse;
      node["DriverCarSLFirstRPM"] = rhs.driverCarSLFirstRPM;
      node["DriverCarSLShiftRPM"] = rhs.driverCarSLShiftRPM;
      node["DriverCarSLLastRPM"] = rhs.driverCarSLLastRPM;
      node["DriverCarSLBlinkRPM"] = rhs.driverCarSLBlinkRPM;
      node["DriverCarVersion"] = rhs.driverCarVersion;
      node["DriverPitTrkPct"] = rhs.driverPitTrkPct;
      node["DriverCarEstLapTime"] = rhs.driverCarEstLapTime;
      node["DriverSetupName"] = rhs.driverSetupName;
      node["DriverSetupIsModified"] = rhs.driverSetupIsModified;
      node["DriverSetupLoadTypeName"] = rhs.driverSetupLoadTypeName;
      node["DriverSetupPassedTech"] = rhs.driverSetupPassedTech;
      node["DriverIncidentCount"] = rhs.driverIncidentCount;
      node["Drivers"] = rhs.drivers;
      return node;
    }

    static bool decode(const Node &node, DriverInfo &rhs) {
      rhs.driverCarIdx = node["DriverCarIdx"].as<std::int32_t>();
      rhs.driverUserID = node["DriverUserID"].as<std::int32_t>();
      rhs.paceCarIdx = node["PaceCarIdx"].as<std::int32_t>();
      rhs.driverHeadPosX = node["DriverHeadPosX"].as<float>();
      rhs.driverHeadPosY = node["DriverHeadPosY"].as<float>();
      rhs.driverHeadPosZ = node["DriverHeadPosZ"].as<float>();
      rhs.driverCarIsElectric = node["DriverCarIsElectric"].as<std::int32_t>();
      rhs.driverCarIdleRPM = node["DriverCarIdleRPM"].as<float>();
      rhs.driverCarRedLine = node["DriverCarRedLine"].as<float>();
      rhs.driverCarEngCylinderCount = node["DriverCarEngCylinderCount"].as<std::int32_t>();
      rhs.driverCarFuelKgPerLtr = node["DriverCarFuelKgPerLtr"].as<float>();
      rhs.driverCarFuelMaxLtr = node["DriverCarFuelMaxLtr"].as<float>();
      rhs.driverCarMaxFuelPct = node["DriverCarMaxFuelPct"].as<float>();
      rhs.driverCarGearNumForward = node["DriverCarGearNumForward"].as<std::int32_t>();
      rhs.driverCarGearNeutral = node["DriverCarGearNeutral"].as<std::int32_t>();
      rhs.driverCarGearReverse = node["DriverCarGearReverse"].as<std::int32_t>();
      rhs.driverCarSLFirstRPM = node["DriverCarSLFirstRPM"].as<float>();
      rhs.driverCarSLShiftRPM = node["DriverCarSLShiftRPM"].as<float>();
      rhs.driverCarSLLastRPM = node["DriverCarSLLastRPM"].as<float>();
      rhs.driverCarSLBlinkRPM = node["DriverCarSLBlinkRPM"].as<float>();
      rhs.driverCarVersion = node["DriverCarVersion"].as<std::string>();
      rhs.driverPitTrkPct = node["DriverPitTrkPct"].as<float>();
      rhs.driverCarEstLapTime = node["DriverCarEstLapTime"].as<float>();
      rhs.driverSetupName = node["DriverSetupName"].as<std::string>();
      rhs.driverSetupIsModified = node["DriverSetupIsModified"].as<std::int32_t>();
      rhs.driverSetupLoadTypeName = node["DriverSetupLoadTypeName"].as<std::string>();
      rhs.driverSetupPassedTech = node["DriverSetupPassedTech"].as<std::int32_t>();
      rhs.driverIncidentCount = node["DriverIncidentCount"].as<std::int32_t>();
      rhs.drivers = node["Drivers"].as<std::vector<Driver>>();
      return true;
    }
  };

  template<> struct convert<Driver> {
    static Node encode(const Driver &rhs) {
      Node node;
      node["CarIdx"] = rhs.carIdx;
      node["UserName"] = rhs.userName;
      node["AbbrevName"] = rhs.abbrevName;
      node["Initials"] = rhs.initials;
      node["UserID"] = rhs.userID;
      node["TeamID"] = rhs.teamID;
      node["TeamName"] = rhs.teamName;
      node["CarNumber"] = rhs.carNumber;
      node["CarNumberRaw"] = rhs.carNumberRaw;
      node["CarPath"] = rhs.carPath;
      node["CarClassID"] = rhs.carClassID;
      node["CarID"] = rhs.carID;
      node["CarIsPaceCar"] = rhs.carIsPaceCar;
      node["CarIsAI"] = rhs.carIsAI;
      node["CarIsElectric"] = rhs.carIsElectric;
      node["CarScreenName"] = rhs.carScreenName;
      node["CarScreenNameShort"] = rhs.carScreenNameShort;
      node["CarClassShortName"] = rhs.carClassShortName;
      node["CarClassRelSpeed"] = rhs.carClassRelSpeed;
      node["CarClassLicenseLevel"] = rhs.carClassLicenseLevel;
      node["CarClassMaxFuelPct"] = rhs.carClassMaxFuelPct;
      node["CarClassWeightPenalty"] = rhs.carClassWeightPenalty;
      node["CarClassPowerAdjust"] = rhs.carClassPowerAdjust;
      node["CarClassDryTireSetLimit"] = rhs.carClassDryTireSetLimit;
      node["CarClassColor"] = rhs.carClassColor;
      node["CarClassEstLapTime"] = rhs.carClassEstLapTime;
      node["IRating"] = rhs.iRating;
      node["LicLevel"] = rhs.licLevel;
      node["LicSubLevel"] = rhs.licSubLevel;
      node["LicString"] = rhs.licString;
      node["LicColor"] = rhs.licColor;
      node["IsSpectator"] = rhs.isSpectator;
      node["CarDesignStr"] = rhs.carDesignStr;
      node["HelmetDesignStr"] = rhs.helmetDesignStr;
      node["SuitDesignStr"] = rhs.suitDesignStr;
      node["BodyType"] = rhs.bodyType;
      node["FaceType"] = rhs.faceType;
      node["HelmetType"] = rhs.helmetType;
      node["CarNumberDesignStr"] = rhs.carNumberDesignStr;
      node["CarSponsor_1"] = rhs.carSponsor1;
      node["CarSponsor_2"] = rhs.carSponsor2;
      node["ClubName"] = rhs.clubName;
      node["ClubID"] = rhs.clubID;
      node["DivisionName"] = rhs.divisionName;
      node["DivisionID"] = rhs.divisionID;
      node["CurDriverIncidentCount"] = rhs.curDriverIncidentCount;
      node["TeamIncidentCount"] = rhs.teamIncidentCount;
      return node;
    }

    static bool decode(const Node &node, Driver &rhs) {
      rhs.carIdx = node["CarIdx"].as<std::int32_t>();
      rhs.userName = node["UserName"].as<std::string>();
      rhs.abbrevName = node["AbbrevName"].as<std::string>();
      rhs.initials = node["Initials"].as<std::string>();
      rhs.userID = node["UserID"].as<std::int32_t>();
      rhs.teamID = node["TeamID"].as<std::int32_t>();
      rhs.teamName = node["TeamName"].as<std::string>();
      rhs.carNumber = node["CarNumber"].as<std::string>();
      rhs.carNumberRaw = node["CarNumberRaw"].as<std::int32_t>();
      rhs.carPath = node["CarPath"].as<std::string>();
      rhs.carClassID = node["CarClassID"].as<std::int32_t>();
      rhs.carID = node["CarID"].as<std::int32_t>();
      rhs.carIsPaceCar = node["CarIsPaceCar"].as<std::int32_t>();
      rhs.carIsAI = node["CarIsAI"].as<std::int32_t>();
      rhs.carIsElectric = node["CarIsElectric"].as<std::int32_t>();
      rhs.carScreenName = node["CarScreenName"].as<std::string>();
      rhs.carScreenNameShort = node["CarScreenNameShort"].as<std::string>();
      rhs.carClassShortName = node["CarClassShortName"].as<std::string>();
      rhs.carClassRelSpeed = node["CarClassRelSpeed"].as<std::int32_t>();
      rhs.carClassLicenseLevel = node["CarClassLicenseLevel"].as<std::int32_t>();
      rhs.carClassMaxFuelPct = node["CarClassMaxFuelPct"].as<std::string>();
      rhs.carClassWeightPenalty = node["CarClassWeightPenalty"].as<std::string>();
      rhs.carClassPowerAdjust = node["CarClassPowerAdjust"].as<std::string>();
      rhs.carClassDryTireSetLimit = node["CarClassDryTireSetLimit"].as<std::string>();
      rhs.carClassColor = node["CarClassColor"].as<std::string>();
      rhs.carClassEstLapTime = node["CarClassEstLapTime"].as<float>();
      rhs.iRating = node["IRating"].as<std::int32_t>();
      rhs.licLevel = node["LicLevel"].as<std::int32_t>();
      rhs.licSubLevel = node["LicSubLevel"].as<std::int32_t>();
      rhs.licString = node["LicString"].as<std::string>();
      rhs.licColor = node["LicColor"].as<std::string>();
      rhs.isSpectator = node["IsSpectator"].as<std::int32_t>();
      rhs.carDesignStr = node["CarDesignStr"].as<std::string>();
      rhs.helmetDesignStr = node["HelmetDesignStr"].as<std::string>();
      rhs.suitDesignStr = node["SuitDesignStr"].as<std::string>();
      rhs.bodyType = node["BodyType"].as<std::int32_t>();
      rhs.faceType = node["FaceType"].as<std::int32_t>();
      rhs.helmetType = node["HelmetType"].as<std::int32_t>();
      rhs.carNumberDesignStr = node["CarNumberDesignStr"].as<std::string>();
      rhs.carSponsor1 = node["CarSponsor_1"].as<std::string>();
      rhs.carSponsor2 = node["CarSponsor_2"].as<std::string>();
      rhs.clubName = node["ClubName"].as<std::string>();
      rhs.clubID = node["ClubID"].as<std::int32_t>();
      rhs.divisionName = node["DivisionName"].as<std::string>();
      rhs.divisionID = node["DivisionID"].as<std::int32_t>();
      rhs.curDriverIncidentCount = node["CurDriverIncidentCount"].as<std::int32_t>();
      rhs.teamIncidentCount = node["TeamIncidentCount"].as<std::int32_t>();
      return true;
    }
  };

  template<> struct convert<SplitTimeInfo> {
    static Node encode(const SplitTimeInfo &rhs) {
      Node node;
      node["Sectors"] = rhs.sectors;
      return node;
    }

    static bool decode(const Node &node, SplitTimeInfo &rhs) {
      rhs.sectors = node["Sectors"].as<std::vector<Sector>>();
      return true;
    }
  };

  template<> struct convert<Sector> {
    static Node encode(const Sector &rhs) {
      Node node;
      node["SectorNum"] = rhs.sectorNum;
      node["SectorStartPct"] = rhs.sectorStartPct;
      return node;
    }

    static bool decode(const Node &node, Sector &rhs) {
      rhs.sectorNum = node["SectorNum"].as<std::int32_t>();
      rhs.sectorStartPct = node["SectorStartPct"].as<float>();
      return true;
    }
  };

  template<> struct convert<CarSetup> {
    static Node encode(const CarSetup &rhs) {
      Node node;
      node["UpdateCount"] = rhs.updateCount;
      node["TiresAero"] = rhs.tiresAero;
      node["Chassis"] = rhs.chassis;
      node["BrakesDriveUnit"] = rhs.brakesDriveUnit;
      return node;
    }

    static bool decode(const Node &node, CarSetup &rhs) {
      rhs.updateCount = node["UpdateCount"].as<std::int32_t>();
      rhs.tiresAero = node["TiresAero"].as<TiresAero>();
      rhs.chassis = node["Chassis"].as<Chassis>();
      rhs.brakesDriveUnit = node["BrakesDriveUnit"].as<BrakesDriveUnit>();
      return true;
    }
  };

  template<> struct convert<TiresAero> {
    static Node encode(const TiresAero &rhs) {
      Node node;
      node["LeftFrontTire"] = rhs.leftFrontTire;
      node["LeftRearTire"] = rhs.leftRearTire;
      node["RightFrontTire"] = rhs.rightFrontTire;
      node["RightRearTire"] = rhs.rightRearTire;
      node["AeroSettings"] = rhs.aeroSettings;
      return node;
    }

    static bool decode(const Node &node, TiresAero &rhs) {
      rhs.leftFrontTire = node["LeftFrontTire"].as<Tire>();
      rhs.leftRearTire = node["LeftRearTire"].as<Tire>();
      rhs.rightFrontTire = node["RightFrontTire"].as<Tire>();
      rhs.rightRearTire = node["RightRearTire"].as<Tire>();
      rhs.aeroSettings = node["AeroSettings"].as<AeroSettings>();
      return true;
    }
  };

  template<> struct convert<Tire> {
    static Node encode(const Tire &rhs) {
      Node node;
      node["StartingPressure"] = rhs.startingPressure;
      node["LastHotPressure"] = rhs.lastHotPressure;
      node["LastTempsOMI"] = rhs.lastTempsOMI;
      node["TreadRemaining"] = rhs.treadRemaining;
      return node;
    }

    static bool decode(const Node &node, Tire &rhs) {
      rhs.startingPressure = node["StartingPressure"].as<float>();
      rhs.lastHotPressure = node["LastHotPressure"].as<float>();
      rhs.lastTempsOMI = node["LastTempsOMI"].as<float>();
      rhs.treadRemaining = node["TreadRemaining"].as<float>();
      return true;
    }
  };


  template<> struct convert<AeroSettings> {
    static Node encode(const AeroSettings &rhs) {
      Node node;
      node["RearWingSetting"] = rhs.rearWingSetting;
      node["OfDivePlanes"] = rhs.ofDivePlanes;
      node["WingGurneySetting"] = rhs.wingGurneySetting;
      return node;
    }

    static bool decode(const Node &node, AeroSettings &rhs) {
      rhs.rearWingSetting = node["RearWingSetting"].as<std::string>();
      rhs.ofDivePlanes = node["OfDivePlanes"].as<std::int32_t>();
      rhs.wingGurneySetting = node["WingGurneySetting"].as<bool>();
      return true;
    }
  };

  template<> struct convert<Chassis> {
    static Node encode(const Chassis &rhs) {
      Node node;
      node["Front"] = rhs.front;
      node["LeftFront"] = rhs.leftFront;
      node["LeftRear"] = rhs.leftRear;
      node["RightFront"] = rhs.rightFront;
      node["RightRear"] = rhs.rightRear;
      node["Rear"] = rhs.rear;
      return node;
    }

    static bool decode(const Node &node, Chassis &rhs) {
      rhs.front = node["Front"].as<Front>();
      rhs.leftFront = node["LeftFront"].as<ChassisCorner>();
      rhs.leftRear = node["LeftRear"].as<ChassisCorner>();
      rhs.rightFront = node["RightFront"].as<ChassisCorner>();
      rhs.rightRear = node["RightRear"].as<ChassisCorner>();
      rhs.rear = node["Rear"].as<Rear>();
      return true;
    }
  };

  template<> struct convert<Front> {
    static Node encode(const Front &rhs) {
      Node node;
      node["ArbSize"] = rhs.arbSize;
      node["ToeIn"] = rhs.toeIn;
      node["SteeringRatio"] = rhs.steeringRatio;
      node["DisplayPage"] = rhs.displayPage;
      return node;
    }

    static bool decode(const Node &node, Front &rhs) {
      rhs.arbSize = node["ArbSize"].as<std::string>();
      rhs.toeIn = node["ToeIn"].as<std::string>();
      rhs.steeringRatio = node["SteeringRatio"].as<float>();
      rhs.displayPage = node["DisplayPage"].as<std::string>();
      return true;
    }
  };

  template<> struct convert<ChassisCorner> {
    static Node encode(const ChassisCorner &rhs) {
      Node node;
      node["CornerWeight"] = rhs.cornerWeight;
      node["RideHeight"] = rhs.rideHeight;
      node["ShockDefl"] = rhs.shockDefl;
      node["SpringPerchOffset"] = rhs.springPerchOffset;
      node["SpringRate"] = rhs.springRate;
      node["LsCompDamping"] = rhs.lsCompDamping;
      node["HsCompDamping"] = rhs.hsCompDamping;
      node["HsRbdDamping"] = rhs.hsRbdDamping;
      node["Camber"] = rhs.camber;
      node["ToeIn"] = rhs.toeIn;
      return node;
    }

    static bool decode(const Node &node, ChassisCorner &rhs) {
      rhs.cornerWeight = node["CornerWeight"].as<std::string>();
      rhs.rideHeight = node["RideHeight"].as<std::string>();
      rhs.shockDefl = node["ShockDefl"].as<std::string>();
      rhs.springPerchOffset = node["SpringPerchOffset"].as<std::string>();
      rhs.springRate = node["SpringRate"].as<std::string>();
      rhs.lsCompDamping = node["LsCompDamping"].as<std::string>();
      rhs.hsCompDamping = node["HsCompDamping"].as<std::string>();
      rhs.hsRbdDamping = node["HsRbdDamping"].as<std::string>();
      rhs.camber = node["Camber"].as<std::string>();
      rhs.toeIn = node["ToeIn"].as<std::string>();
      return true;
    }
  };


  template<> struct convert<Rear> {
    static Node encode(const Rear &rhs) {
      Node node;
      node["ArbSize"] = rhs.arbSize;
      node["CrossWeight"] = rhs.crossWeight;
      return node;
    }

    static bool decode(const Node &node, Rear &rhs) {
      rhs.arbSize = node["ArbSize"].as<std::string>();
      rhs.crossWeight = node["CrossWeight"].as<std::string>();
      return true;
    }
  };

  template<> struct convert<BrakesDriveUnit> {
    static Node encode(const BrakesDriveUnit &rhs) {
      Node node;
      node["BrakeSpec"] = rhs.brakeSpec;
      node["Fuel"] = rhs.fuel;
      node["Engine"] = rhs.engine;
      node["GearRatios"] = rhs.gearRatios;
      return node;
    }

    static bool decode(const Node &node, BrakesDriveUnit &rhs) {
      rhs.brakeSpec = node["BrakeSpec"].as<BrakeSpec>();
      rhs.fuel = node["Fuel"].as<Fuel>();
      rhs.engine = node["Engine"].as<Engine>();
      rhs.gearRatios = node["GearRatios"].as<GearRatio>();
      return true;
    }
  };

  template<> struct convert<BrakeSpec> {
    static Node encode(const BrakeSpec &rhs) {
      Node node;
      node["PadCompound"] = rhs.padCompound;
      node["BrakePressureBias"] = rhs.brakePressureBias;
      return node;
    }

    static bool decode(const Node &node, BrakeSpec &rhs) {
      rhs.padCompound = node["PadCompound"].as<std::string>();
      rhs.brakePressureBias = node["BrakePressureBias"].as<std::string>();
      return true;
    }
  };

  template<> struct convert<Fuel> {
    static Node encode(const Fuel &rhs) {
      Node node;
      node["FuelLevel"] = rhs.fuelLevel;
      return node;
    }

    static bool decode(const Node &node, Fuel &rhs) {
      rhs.fuelLevel = node["FuelLevel"].as<std::string>();
      return true;
    }
  };

  template<> struct convert<Engine> {
    static Node encode(const Engine &rhs) {
      Node node;
      node["BoostLevel_Cal"] = rhs.boostLevelCal;
      node["ThrottleShape_Tps"] = rhs.throttleShapeTps;
      return node;
    }

    static bool decode(const Node &node, Engine &rhs) {
      rhs.boostLevelCal = node["BoostLevel_Cal"].as<std::int32_t>();
      rhs.throttleShapeTps = node["ThrottleShape_Tps"].as<std::int32_t>();
      return true;
    }
  };

  template<> struct convert<GearRatio> {
    static Node encode(const GearRatio &rhs) {
      Node node;
      node["GearStack"] = rhs.gearStack;
      node["SpeedInFirst"] = rhs.speedInFirst;
      node["SpeedInSecond"] = rhs.speedInSecond;
      node["SpeedInThird"] = rhs.speedInThird;
      node["SpeedInFourth"] = rhs.speedInFourth;
      node["SpeedInFifth"] = rhs.speedInFifth;
      node["SpeedInSixth"] = rhs.speedInSixth;
      return node;
    }

    static bool decode(const Node &node, GearRatio &rhs) {
      rhs.gearStack = node["GearStack"].as<std::string>();
      rhs.speedInFirst = node["SpeedInFirst"].as<std::string>();
      rhs.speedInSecond = node["SpeedInSecond"].as<std::string>();
      rhs.speedInThird = node["SpeedInThird"].as<std::string>();
      rhs.speedInFourth = node["SpeedInFourth"].as<std::string>();
      rhs.speedInFifth = node["SpeedInFifth"].as<std::string>();
      rhs.speedInSixth = node["SpeedInSixth"].as<std::string>();
      return true;
    }
  };


}// namespace YAML