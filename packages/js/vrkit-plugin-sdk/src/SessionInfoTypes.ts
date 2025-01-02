export interface SessionInfoMessage {
  cameraInfo: CameraInfo

  carSetup: CarSetup

  driverInfo: DriverInfo

  qualifyResultsInfo: QualifyResultsInfo

  radioInfo: RadioInfo

  sessionInfo: SessionInfo

  splitTimeInfo: SplitTimeInfo

  weekendInfo: WeekendInfo
}

export interface CameraInfo {
  groups: Group[]
}

export interface Group {
  cameras: Camera[]

  groupName: string

  groupNum: number

  isScenic?: boolean
}

export interface Camera {
  cameraName: string

  cameraNum: number
}

export interface CarSetup {
  brakesDriveUnit: BrakesDriveUnit

  chassis: Chassis

  tiresAero: TiresAero

  updateCount: number
}

export interface BrakesDriveUnit {
  brakeSpec: BrakeSpec

  engine: Engine

  fuel: Fuel

  gearRatios: GearRatios
}

export interface BrakeSpec {
  brakePressureBias: string

  padCompound: string
}

export interface Engine {
  boostLevelCal: number

  throttleShapeTps: number
}

export interface Fuel {
  fuelLevel: string
}

export interface GearRatios {
  gearStack: string

  speedInFifth: string

  speedInFirst: string

  speedInFourth: string

  speedInSecond: string

  speedInSixth: string

  speedInThird: string
}

export interface Chassis {
  front: Front

  leftFront: LeftFront

  leftRear: LeftFront

  rear: Rear

  rightFront: LeftFront

  rightRear: LeftFront
}

export interface Front {
  arbSize: string

  displayPage: string

  steeringRatio: number

  toeIn: string
}

export interface LeftFront {
  camber: string

  cornerWeight: string

  hsCompDamping: string

  hsRbdDamping: string

  lsCompDamping: string

  rideHeight: string

  shockDefl: string

  springDefl?: string

  springPerchOffset: string

  springRate: string

  toeIn?: string
}

export interface Rear {
  arbSize: string

  crossWeight: string
}

export interface TiresAero {
  aeroSettings: AeroSettings

  leftFrontTire: Tire

  leftRearTire: Tire

  rightFrontTire: Tire

  rightRearTire: Tire
}

export interface AeroSettings {
  ofDivePlanes: number

  rearWingSetting: string

  wingGurneySetting: string
}

export interface Tire {
  lastHotPressure: string

  lastTempsIMO?: string

  lastTempsOMI?: string

  startingPressure: string

  treadRemaining: string
}

export interface DriverInfo {
  driverCarEngCylinderCount: number

  driverCarEstLapTime: number

  driverCarFuelKgPerLTR: number

  driverCarFuelMaxLTR: number

  driverCarGearNeutral: number

  driverCarGearNumForward: number

  driverCarGearReverse: number

  driverCarIdleRPM: number

  driverCarIdx: number

  driverCarIsElectric: number

  driverCarMaxFuelPct: number

  driverCarRedLine: number

  driverCarSLBlinkRPM: number

  driverCarSLFirstRPM: number

  driverCarSLLastRPM: number

  driverCarSLShiftRPM: number

  driverCarVersion: string

  driverHeadPosX: number

  driverHeadPosY: number

  driverHeadPosZ: number

  driverIncidentCount: number

  driverPitTrkPct: number

  drivers: Driver[]

  driverSetupIsModified: number

  driverSetupLoadTypeName: string

  driverSetupName: string

  driverSetupPassedTech: number

  driverUserID: number

  paceCarIdx: number
}

export interface Driver {
  abbrevName: null | string

  bodyType: number

  carClassColor: string

  carClassDryTireSetLimit: TrackFogLevel

  carClassEstLapTime: number

  carClassID: number

  carClassLicenseLevel: number

  carClassMaxFuelPct: CarClassMaxFuelPct

  carClassPowerAdjust: CarClassPowerAdjust

  carClassRelSpeed: number

  carClassShortName: Car | null

  carClassWeightPenalty: CarClassWeightPenalty

  carDesignStr: string

  carID: number

  carIdx: number

  carIsAI: number

  carIsElectric: number

  carIsPaceCar: number

  carNumber: string

  carNumberDesignStr: CarNumberDesignStr

  carNumberRaw: number

  carPath: CarPath

  carScreenName: Car

  carScreenNameShort: Car

  carSponsor1: number

  carSponsor2: number

  clubID: number

  clubName: string

  curDriverIncidentCount: number

  divisionID: number

  divisionName: string

  faceType: number

  helmetDesignStr: string

  helmetType: number

  initials: string

  iRating: number

  isSpectator: number

  licColor: string

  licLevel: number

  licString: string

  licSubLevel: number

  suitDesignStr: string

  teamID: number

  teamIncidentCount: number

  teamName: string

  userID: number

  userName: string
}

export enum TrackFogLevel {
  The0 = "0 %"
}

export enum CarClassMaxFuelPct {
  The0660 = "0.660 %",
  The1000 = "1.000 %"
}

export enum CarClassPowerAdjust {
  The0000 = "0.000 %"
}

export enum Car {
  RadicalSR10 = "Radical SR10",
  SafetyPcporsche911Cup = "safety pcporsche911cup"
}

export enum CarClassWeightPenalty {
  The0000Kg = "0.000 kg"
}

export enum CarNumberDesignStr {
  The00Ffffff777777000000 = "0,0,ffffff,777777,000000",
  The00FfffffFfffffFfffff = "0,0,ffffff,ffffff,ffffff"
}

export enum CarPath {
  Radicalsr10 = "radicalsr10",
  SafetyPcporsche911Cup = "safety pcporsche911cup"
}

export interface QualifyResultsInfo {
  results: Result[]
}

export interface Result {
  carIdx: number

  classPosition: number

  fastestLap: number

  fastestTime: number

  position: number
}

export interface RadioInfo {
  radios: Radio[]

  selectedRadioNum: number
}

export interface Radio {
  frequencies: Frequency[]

  hopCount: number

  numFrequencies: number

  radioNum: number

  scanningIsOn: number

  tunedToFrequencyNum: number
}

export interface Frequency {
  canScan: number

  canSquawk: number

  carIdx: number

  clubID: number

  entryIdx: number

  frequencyName: string

  frequencyNum: number

  isDeletable: number

  isMutable: number

  muted: number

  priority: number
}

export interface SessionInfo {
  sessions: Session[]
}

export interface Session {
  resultsAverageLapTime: number

  resultsFastestLap: ResultsFastestLap[]

  resultsLapsComplete: number

  resultsNumCautionFlags: number

  resultsNumCautionLaps: number

  resultsNumLeadChanges: number

  resultsOfficial: number

  resultsPositions: ResultsPosition[] | null

  sessionEnforceTireCompoundChange: number

  sessionLaps: number | string

  sessionName: string

  sessionNum: number

  sessionNumLapsToAvg: number

  sessionRunGroupsUsed: number

  sessionSkipped: number

  sessionSubType: null

  sessionTime: string

  sessionTrackRubberState: string

  sessionType: string
}

export interface ResultsFastestLap {
  carIdx: number

  fastestLap: number

  fastestTime: number
}

export interface ResultsPosition {
  carIdx: number

  classPosition: number

  fastestLap: number

  fastestTime: number

  incidents: number

  jokerLapsComplete: number

  lap: number

  lapsComplete: number

  lapsDriven: number

  lapsLED: number

  lastTime: number

  position: number

  reasonOutID: number

  reasonOutStr: ReasonOutStr

  time: number
}

export enum ReasonOutStr {
  Running = "Running"
}

export interface SplitTimeInfo {
  sectors: Sector[]
}

export interface Sector {
  sectorNum: number

  sectorStartPct: number
}

export interface WeekendInfo {
  buildTarget: string

  buildType: string

  buildVersion: string

  category: string

  dcRuleSet: string

  eventType: string

  heatRacing: number

  leagueID: number

  maxDrivers: number

  minDrivers: number

  numCarClasses: number

  numCarTypes: number

  official: number

  qualifierMustStartRace: number

  raceWeek: number

  seasonID: number

  seriesID: number

  sessionID: number

  simMode: string

  subSessionID: number

  teamRacing: number

  telemetryOptions: TelemetryOptions

  trackAirPressure: string

  trackAirTemp: string

  trackAltitude: string

  trackCity: string

  trackCleanup: number

  trackConfigName: string

  trackCountry: string

  trackDirection: string

  trackDisplayName: string

  trackDisplayShortName: string

  trackDynamicTrack: number

  trackFogLevel: TrackFogLevel

  trackID: number

  trackLatitude: string

  trackLength: string

  trackLengthOfficial: string

  trackLongitude: string

  trackName: string

  trackNorthOffset: string

  trackNumTurns: number

  trackPitSpeedLimit: string

  trackPrecipitation: TrackFogLevel

  trackRelativeHumidity: string

  trackSkies: string

  trackSurfaceTemp: string

  trackType: string

  trackVersion: string

  trackWeatherType: string

  trackWindDir: string

  trackWindVel: string

  weekendOptions: WeekendOptions
}

export interface TelemetryOptions {
  telemetryDiskFile: string
}

export interface WeekendOptions {
  commercialMode: string

  courseCautions: string

  date: Date

  earthRotationSpeedupFactor: number

  fastRepairsLimit: number

  fogLevel: TrackFogLevel

  greenWhiteCheckeredLimit: number

  hardcoreLevel: number

  hasOpenRegistration: number

  incidentLimit: number

  isFixedSetup: number

  nightMode: string

  numJokerLaps: number

  numStarters: number

  qualifyScoring: string

  relativeHumidity: string

  restarts: string

  shortParadeLap: number

  skies: string

  standingStart: number

  startingGrid: string

  strictLapsChecking: string

  timeOfDay: string

  unofficial: number

  weatherTemp: string

  weatherType: string

  windDirection: string

  windSpeed: string
}
