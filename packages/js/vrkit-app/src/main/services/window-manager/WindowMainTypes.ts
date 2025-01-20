import {
  assign,
  BrowserWindowEventKind,
  cloneDeep,
  deepFreeze,
  defaults,
  WindowConfig,
  WindowCreateOptions,
  WindowInstance,
  WindowRole
} from "@vrkit-platform/shared"
import { windowOptionDefaults } from "./WindowHelpers"
import Path from "path"
import { app } from "electron"
import type WindowStateManager from "./WindowStateManager"
import { resolveHtmlPath } from "../../utils/FsExtra"

export interface WindowMainInstance extends WindowInstance<WindowMainInstance> {
  stateManager: WindowStateManager

  browserWindowOptions: Electron.BrowserWindowConstructorOptions

  browserWindow: Electron.BrowserWindow

  browserWindowClosed: boolean

  onBrowserWindowEvent?: (
    type: BrowserWindowEventKind,
    browserWindow: Electron.BrowserWindow,
    windowInstance: WindowMainInstance
  ) => any
}

function newBaseWindowCreateOptions(
  role: WindowRole,
  config: Partial<WindowConfig<WindowMainInstance>> = {}
): WindowConfig<WindowMainInstance> {
  return defaults(
    {
      role,
      ...config
    },
    {
      modal: false,
      multiple: false,
      manageState: false,
      browserWindowOptions: {}
    }
  )
}

function newNormalWindowCreateOptions() {
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

function newFloatingWindowCreateOptions(optConfig: Partial<WindowConfig> = {}) {
  const baseConfig = {
    type: "Floating",
    manageState: false,
    modal: false,
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

export const BaseWindowConfigs: { [Role in WindowRole]: WindowCreateOptions<WindowMainInstance> } = deepFreeze({
  Main: newBaseWindowCreateOptions(WindowRole.Main, {
    ...newNormalWindowCreateOptions(),
    initialRoute: "/main"
  }),
  Settings: newBaseWindowCreateOptions(WindowRole.Settings, {
    ...newNormalWindowCreateOptions(),
    modal: true,
    initialRoute: "/settings"
  }),
  DashboardVRLayout: newBaseWindowCreateOptions(WindowRole.DashboardVRLayout, {
    ...newFloatingWindowCreateOptions()
  }),
  DashboardInfo: newBaseWindowCreateOptions(WindowRole.DashboardInfo, {
    manageState: true,
    ...newFloatingWindowCreateOptions()
  }),
  Overlay: newBaseWindowCreateOptions(WindowRole.Overlay, {
    multiple: true,
    ...newFloatingWindowCreateOptions({
      browserWindowOptions: {
        alwaysOnTop: true
      }
    })
  })
})

export function newWindowCreateOptions<Role extends WindowRole>(
  role: Role,
  options: Partial<WindowCreateOptions<WindowMainInstance>> = {}
): WindowCreateOptions<WindowMainInstance> {
  return assign(cloneDeep(BaseWindowConfigs[role]), options)
}

export function isNormalWindow<T extends WindowMainInstance>(wi: T): boolean {
  return wi?.type === "Normal"
}

export function isFloatingWindow<T extends WindowMainInstance>(wi: T): boolean {
  return wi?.type === "Floating"
}

export const AppBuildPaths = {
  root: app.isPackaged ? __dirname : Path.join(__dirname, "..", "..", "..", "..", "..", "..", "..", "build", "js"),
  assets: app.isPackaged ? Path.join(process.resourcesPath, "assets") : Path.join(__dirname, "..", "assets")
}
