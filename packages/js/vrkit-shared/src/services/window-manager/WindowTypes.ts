import { isNotEmptyString } from "../../utils"
import type Electron from "electron"

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

export enum BrowserWindowEventType {
  Created = "Created",
  Ready = "Ready"
}

export type BrowserWindowEventKind = `${BrowserWindowEventType}`

export enum WindowRenderMode {
  Screen = "Screen",
  VR = "VR"
}

export function isWindowRole(candidate: any): candidate is WindowRole {
  return isNotEmptyString(candidate) && isNotEmptyString(WindowRole[candidate])
}

export interface WindowCreateOptions<Instance = unknown> {
  id?: string

  role: WindowRole

  type: WindowKind

  renderMode?: WindowRenderMode
  
  modal?: boolean
  
  multiple: boolean

  manageState: boolean

  browserWindowOptions: Electron.BrowserWindowConstructorOptions

  /**
   * On BrowserWindowEvent handler
   * TODO: Make `WindowConfig` extend `EventEmitter3<BrowserWindowEventArgMap>`
   *   instead of 1-off handler
   *
   * @param type
   * @param browserWindow
   * @param windowInstance
   */
  onBrowserWindowEvent?: (
    type: BrowserWindowEventKind,
    browserWindow: Electron.BrowserWindow,
    windowInstance: Instance
  ) => any

  /**
   * URL of bundle to load
   */
  url: string

  /**
   * Initial route for react router
   */
  initialRoute?: string
}

export interface WindowConfig<Instance = unknown> extends WindowCreateOptions<Instance> {
  id: string
}

export interface WindowInstance<Instance = unknown> {
  id: string

  role: WindowRole
  modal: boolean
  
  type: WindowKind

  config: WindowConfig<Instance>
}

export type WindowConfigRole<Config> = Config extends WindowConfig<infer Role> ? Role : never
export type WindowCreateOptionsRole<Options> = Options extends WindowCreateOptions<infer Role> ? Role : never
