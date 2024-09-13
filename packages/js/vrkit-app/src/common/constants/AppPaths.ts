import { asOption } from "@3fv/prelude-ts"
import Path from "path"
import Fs from "fs"
import { assert, isNotEmpty } from "vrkit-app-common/utils"
import { getLogger } from "@3fv/logger-proxy"

const log = getLogger(__filename)

assert(process.platform === "win32", `VRKit is only usable on Windows 10/11`)

export const isDev = process.env.NODE_ENV !== "production"
export const isElectron =
    typeof process !== "undefined" && process?.versions?.electron?.length > 0

export const AppName = "VRKit"

const homeDir = asOption(process.env.USERPROFILE as string)
    .filter(isNotEmpty)
    .orElse(() => asOption(process.env.HOME as string))
    .filter(Fs.existsSync)
    .getOrThrow("Unable to find valid home directory")


const iracingUserDir = Path.join(homeDir, "Documents", " iRacing")
const iracingTelemetryDir = Path.join(iracingUserDir, "Telemetry")
const iracingSetupsDir = Path.join(iracingUserDir, "Setups")

const appDataDir = Path.join(homeDir, "AppData", "Roaming", AppName)
const appDataLocalDir = Path.join(homeDir, "AppData", "Local", AppName)

const trackMapsDir = Path.join(appDataLocalDir, "TrackMaps")
const trackMapListFile = Path.join(appDataLocalDir, "track-map-file.jsonl")

const dashboardsDir = Path.join(appDataLocalDir, "Dashboards")

const appSettingsFile = Path.join(appDataLocalDir, "app-settings.json")

const logsDir = Path.join(appDataLocalDir, "Logs")
const logFile = Path.join(logsDir, "VRKit.log")

export const AppPaths = {
  homeDir,
  appDataLocalDir,
  appDataDir,
  trackMapsDir,
  dashboardsDir,
  
  logsDir,
  
  
  iracingUserDir,
  iracingTelemetryDir,
  iracingSetupsDir
}

export const AppFiles = {
  appSettingsFile,
  trackMapListFile,
  logFile,
}

export const FileExtensions = {
  TrackMap: ".trackmap",
  Dashboard: ".dashboard",
}

Object.entries(AppPaths).forEach(([key, dir]) => {
  log.info(`${key} directory:`, dir)
  Fs.mkdirSync(dir, { recursive: true })
})
