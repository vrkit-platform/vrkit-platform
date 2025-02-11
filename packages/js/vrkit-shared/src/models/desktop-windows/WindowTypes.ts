import { isNotEmptyString } from "../../utils"
import type Electron from "electron"

export enum WindowRole {
  Main = "Main",
  Settings = "Settings",
  DashboardController = "DashboardController",
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
  
  aspectRatio?: number

  renderMode?: WindowRenderMode
  
  devToolMode?: Electron.OpenDevToolsOptions["mode"]
  
  modal?: boolean
  
  parentRole?: WindowRole
  
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

/**
 * Represents the configuration options for a window.
 *
 * This interface extends `WindowCreateOptions` and includes
 * additional properties necessary for identifying and configuring
 * a window instance.
 *
 * @template Instance - The type of the window instance being configured.
 *                       Defaults to `unknown` if not specified.
 *
 * @property {string} id - A unique identifier for the window.
 */
export interface WindowConfig<Instance = unknown> extends WindowCreateOptions<Instance> {
  id: string
}


/**
 * Represents a window instance with specific properties and configurations.
 *
 * @template Instance - Defines the type of the instance associated with the window configuration.
 *
 * @property {string} id - The unique identifier for the window.
 * @property {WindowRole} role - The role or purpose of the window within an application.
 * @property {boolean} modal - Indicates whether the window is modal, restricting interaction to itself until it is closed.
 * @property {WindowKind} type - The type or classification of the window (e.g., modal, dialog, panel, etc.).
 * @property {WindowConfig<Instance>} config - Configuration details for the specified instance of the window.
 */
export interface WindowInstance<Instance = unknown> {
  id: string
  role: WindowRole
  modal: boolean
  type: WindowKind
  config: WindowConfig<Instance>
}


/**
 * Represents a utility type that extracts the `Role` part of a `WindowConfig` type.
 * This generic type is used to conditionally infer and retrieve the `Role` type
 * from a provided configuration type, provided that it extends `WindowConfig`.
 *
 * @template Config - The configuration type that may extend `WindowConfig`.
 */
export type WindowConfigRole<Config> = Config extends WindowConfig<infer Role> ? Role : never


/**
 * `WindowCreateOptionsRole` is a utility type that extracts the `Role` type from the `WindowCreateOptions` generic type.
 * If the `Options` type extends `WindowCreateOptions` with a specific `Role`, it resolves to that `Role` type; otherwise, it resolves to `never`.
 *
 * This type is used to infer the role type parameter inside the `WindowCreateOptions` type for better type safety and clarity in type definitions.
 *
 * @template Options - The type being checked, which should extend `WindowCreateOptions` with a specific `Role`.
 */
export type WindowCreateOptionsRole<Options> = Options extends WindowCreateOptions<infer Role> ? Role : never

/**
 * Represents metadata for a window, derived from the `WindowConfig` type.
 * All properties from `WindowConfig` are included except `onBrowserWindowEvent`
 * and `browserWindowOptions`, which are omitted.
 *
 * This type is typically used to describe or pass non-functional configuration
 * details of a window, ensuring that specific event handlers or browser window
 * settings are excluded.
 *
 * Useful when a simplified view or subset of the full `WindowConfig` is required.
 */
export type WindowMetadata = Omit<WindowConfig, "onBrowserWindowEvent" | "browserWindowOptions">

