import { assert, isNotEmpty } from "vrkit-shared"
import { getLogger } from "@3fv/logger-proxy"

const log = getLogger(__filename)

assert(process.platform === "win32", `VRKit is only usable on Windows 10/11`)

export const isDev = process.env.NODE_ENV !== "production"
export const isElectron =
  typeof process !== "undefined" && process?.versions?.electron?.length > 0

export const APP_DB_ID = "APP_DB"

export const APP_STORE_ID = "APP_STORE_ID"

export const GlobalCSSClassNames = {
  electronWindowDraggable: "electronWindowDraggable",
  electronAllowInteraction: "electronAllowInteraction"
}

export enum AppDialogType {
  Unknown = "Unknown"
}

export type AppDialogTypeKind = AppDialogType | `${AppDialogType}`

export * from "vrkit-shared"