import {
  assign, cloneDeep, deepFreeze, defaults, isNotEmptyString
} from "@vrkit-platform/shared"
import { windowOptionDefaults } from "./WindowHelpers"
import Path from "path"
import { app } from "electron"
import { isString } from "@3fv/guard"
import type WindowStateManager from "./WindowStateManager"
import { resolveHtmlPath } from "../../utils/FsExtra"

export enum WindowRole {
  Main = "Main",
  Settings = "Settings",
  DashboardInfo = "DashboardInfo",
  DashboardVRLayout = "DashboardVRLayout",
  Overlay = "Overlay"
}

export enum WindowType {
  Normal = "Normal",
  Floating = "Floating"
}

export type WindowKind = `${WindowType}`

export enum WindowRenderMode {
  Screen = "Screen",
  VR = "VR"
}

export function isWindowRole(candidate: any): candidate is WindowRole {
  return isString(candidate) && isNotEmptyString(WindowRole[candidate])
}

export interface WindowConfig<Role extends WindowRole = any> {
  id?: string

  role: Role
  type: WindowKind

  renderMode?: WindowRenderMode

  multiple: boolean

  manageState: boolean

  browserWindowOptions: Electron.BrowserWindowConstructorOptions
  
  onBrowserWindowCreated?: (browserWindow: Electron.BrowserWindow, windowInstance: WindowInstance<WindowConfig<Role>>) => any
  onBrowserWindowReady?: (browserWindow: Electron.BrowserWindow, windowInstance: WindowInstance<WindowConfig<Role>>) => any

  url: string
}

export type WindowConfigRole<Config extends WindowConfig> = Config extends WindowConfig<infer Role> ? Role : never

export interface WindowInstance<
  Config extends WindowConfig = WindowConfig
> {
  id: string

  role: WindowConfigRole<Config>
  type: WindowKind

  config: Config

  stateManager: WindowStateManager
  
  browserWindowOptions: Electron.BrowserWindowConstructorOptions
  
  browserWindow: Electron.BrowserWindow
  browserWindowClosed: boolean

  onBrowserWindowCreated?: (browserWindow: Electron.BrowserWindow, windowInstance: WindowInstance<Config>) => any
  onBrowserWindowReady?: (browserWindow: Electron.BrowserWindow, windowInstance: WindowInstance<Config>) => any
}

function newBaseWindowConfig<Role extends WindowRole>(
  role: Role,
  config: Partial<WindowConfig<Role>> = {}
): WindowConfig<Role> {
  return defaults(
    {
      role,
      ...config
    },
    {
      multiple: false,
      manageState: false,
      browserWindowOptions: {}
    }
  )
}

function newNormalWindowConfig() {
  return {
    type: "Normal",
    manageState: true,
    browserWindowOptions: {
      backgroundColor: "black",
      show: false,
      titleBarStyle: "hidden",
      ...windowOptionDefaults()
    },
    url: resolveHtmlPath("index.html")
  } satisfies Partial<WindowConfig>
}

function newFloatingWindowConfig(optConfig: Partial<WindowConfig> = {}) {
  const baseConfig = {
    type: "Floating",
    manageState: false,
    browserWindowOptions: {
      show: false,
      frame: false,
      backgroundColor: "#00000000",
      ...windowOptionDefaults()
    },
    url: resolveHtmlPath("index-overlay.html")
  } as Partial<WindowConfig>
  
  return assign(baseConfig, optConfig)
}

export const BaseWindowConfigs: { [Role in WindowRole]: WindowConfig<Role> } = deepFreeze({
  Main: newBaseWindowConfig(WindowRole.Main, {
    ...newNormalWindowConfig()
  }),
  Settings: newBaseWindowConfig(WindowRole.Settings, {
    ...newNormalWindowConfig()
  }),
  DashboardVRLayout: newBaseWindowConfig(WindowRole.DashboardVRLayout, {
    ...newFloatingWindowConfig()
  }),
  DashboardInfo: newBaseWindowConfig(WindowRole.DashboardInfo, {
    manageState: true,
    ...newFloatingWindowConfig()
  }),
  Overlay: newBaseWindowConfig(WindowRole.Overlay, {
    multiple: true,
    ...newFloatingWindowConfig({
      browserWindowOptions: {
        alwaysOnTop: true
      }
    })
  })
})

export function newWindowConfig<Role extends WindowRole>(
    role: Role,
    config: Partial<WindowConfig<Role>> = {}
) {
  return assign(cloneDeep(BaseWindowConfigs[role]), config)
}

export function isNormalWindow<T extends WindowInstance>(wi: T): boolean {
  return wi?.type === "Normal"
}

export function isFloatingWindow<T extends WindowInstance>(wi: T): boolean {
  return wi?.type === "Floating"
}


export const AppBuildPaths = {
  root: app.isPackaged ? __dirname : Path.join(__dirname, "..", "..", "..", "..", "..", "build", "js"),
  assets: app.isPackaged ? Path.join(process.resourcesPath, "assets") : Path.join(__dirname, "..", "assets")
}
