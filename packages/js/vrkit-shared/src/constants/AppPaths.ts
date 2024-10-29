import { asOption } from "@3fv/prelude-ts"
import Path from "path"
import Fs from "fs"
import {FindPackagePath} from "../utils/pkg/FindPackagePath"
import { assert, isNotEmpty } from "../utils/ObjectUtil"
import { getLogger } from "@3fv/logger-proxy"
import { isString } from "@3fv/guard"
import { isDev } from "./shared-constants"

const log = getLogger(__filename)


export interface IDevPaths {
  root: string
}

function createDevPaths(): IDevPaths {
  if (!isDev) {
    return null
  } else {
    const pkgPath = FindPackagePath("vrkit-project")
    return pkgPath ? {
      root: pkgPath[0]
    } : null
  }
}

export const DevPaths:IDevPaths = createDevPaths()

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

const pluginsDir = Path.join(appDataLocalDir, "Plugins")

const devPkgPath = asOption(DevPaths?.root)
    .map(root => Path.join(root,"packages","js"))
    .getOrNull()
const pluginSearchPaths = [pluginsDir, devPkgPath].filter(isString)

const logsDir = Path.join(appDataLocalDir, "Logs")
const logFile = Path.join(logsDir, "VRKit.log")

export const AppPaths = {
  homeDir,
  appDataLocalDir,
  appDataDir,
  trackMapsDir,
  dashboardsDir,
  
  logsDir,

  pluginsDir,
  pluginSearchPaths,
  
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

Object.entries(AppPaths)
.filter(([,dir]) => isString(dir))
.forEach(([key, dir]: [string,string]) => {
  log.info(`${key} directory:`, dir)
  Fs.mkdirSync(dir, { recursive: true })
})

