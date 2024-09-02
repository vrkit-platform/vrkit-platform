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

export const APP_SYNC_MANAGER_ID = "SYNC_MANAGER_ID"
export const APP_DB_ID = "APP_DB"

// ONLY IN DEV ENV TASK MANAGER CAN RUN IN MAIN RENDERER
export const isSharedWorkerEnabled = false // !isDev ||
// !["false",false,0,"0"].includes(githubInSharedWorkerValue)

export const APP_STORE_ID = "APP_STORE_ID"

export const GlobalCSSClassNames = {
  electronWindowDraggable: "electronWindowDraggable",
  electronAllowInteraction: "electronAllowInteraction"
}

export enum AppDialogType {
  Unknown = "Unknown"
}

export type AppDialogTypeKind = AppDialogType | `${AppDialogType}`

const homeDir = asOption(process.env.USERPROFILE as string)
  .filter(isNotEmpty)
  .orElse(() => asOption(process.env.HOME as string))
  .filter(Fs.existsSync)
  .getOrThrow("Unable to find valid home directory")

export const AppName = "VRKit"

const iracingUserDir = Path.join(homeDir, "Documents", " iRacing")
const iracingTelemetryDir = Path.join(iracingUserDir, "Telemetry")
const iracingSetupsDir = Path.join(iracingUserDir, "Setups")

const appDataDir = Path.join(homeDir, "AppData", "Roaming", AppName)
const appDataLocalDir = Path.join(homeDir, "AppData", "Local", AppName)
const trackMapsDir = Path.join(appDataLocalDir, "TrackMaps")
const trackMapListFile = Path.join(appDataLocalDir, "track-map-file.jsonl")

const logsDir = Path.join(appDataLocalDir, "Logs")
const logFile = Path.join(logsDir, "VRKit.log")

export const AppPaths = {
  homeDir,
  appDataLocalDir,
  appDataDir,
  trackMapsDir,
  
  logsDir,
  

  iracingUserDir,
  iracingTelemetryDir,
  iracingSetupsDir
}

export const AppFiles = {
  trackMapListFile,
  logFile,
}

Object.entries(AppPaths).forEach(([key, dir]) => {
  log.info(`${key} directory:`, dir)
  Fs.mkdirSync(dir, { recursive: true })
})
