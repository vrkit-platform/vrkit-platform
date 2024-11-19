import { asOption } from "@3fv/prelude-ts"
import Path from "path"
import Fs from "fs"
import { FindPackagePath, FindPathInTree } from "../utils/pkg/FindPackagePath"
import { isNotEmpty } from "../utils/ObjectUtil"
import { getLogger } from "@3fv/logger-proxy"
import { isString } from "@3fv/guard"
import { AppName, isDev } from "./shared-constants"

const log = getLogger(__filename)

export interface IDevPaths {
  root: string

  trackMapsPath: string
}

function createDevPaths(): IDevPaths {
  if (!isDev || TARGET_PLATFORM !== "electron-main") {
    return null
  } else {
    const pkgPath = FindPackagePath("vrkit-project")
    return pkgPath
      ? {
          root: pkgPath[0],
          trackMapsPath: Path.join(pkgPath[0], "data", "track_maps")
        }
      : null
  }
}

export const DevPaths: IDevPaths = createDevPaths()

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
const trackMapsBuiltInDirResult = FindPathInTree(["resources", "track_maps"], {
  dir: __dirname,
  type: "dir"
})

const trackMapsSearchPath = [trackMapsDir, trackMapsBuiltInDirResult?.[1], DevPaths?.trackMapsPath].filter(isString)
const trackMapListFile = Path.join(appDataLocalDir, "track-map-file.jsonl")

const dashboardsDir = Path.join(appDataLocalDir, "Dashboards")

const appSettingsFile = Path.join(appDataLocalDir, "app-settings.json")

const pluginsDir = Path.join(appDataLocalDir, "Plugins")

const devPkgPath = asOption(DevPaths?.root)
  .map(root => Path.join(root, "packages", "js"))
  .getOrNull()

const packagedPkgPathResult = FindPathInTree(["resources", "plugins"], {
  dir: __dirname
})

const pluginSearchPaths = [packagedPkgPathResult?.[1], pluginsDir, devPkgPath].filter(isString)

const logsDir = Path.join(appDataLocalDir, "Logs")
const logFile = Path.join(logsDir, "VRKit.log")

export const AppPaths = {
  homeDir,
  appDataLocalDir,
  appDataDir,
  trackMapsDir,
  trackMapsSearchPath,
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
  logFile
}

export const FileExtensions = {
  TrackMap: ".trackmap",
  Dashboard: ".dashboard"
}

Object.entries(AppPaths)
  .filter(([, dir]) => isString(dir))
  .forEach(([key, dir]: [string, string]) => {
    log.info(`${key} directory:`, dir)
    Fs.mkdirSync(dir, { recursive: true })
  })

export type IAppPaths = typeof AppPaths
export type IAppFiles = typeof AppFiles
export type IFileExtensions = typeof FileExtensions

export interface IAppStorage {
  paths: IAppPaths

  files: IAppFiles

  fileExtensions: IFileExtensions
}
