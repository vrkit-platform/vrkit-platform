// import type { AppSettings } from "@vrkit-platform/shared"
import type { AppDialogStateValue } from "./AppDialogStateValue"


export interface GlobalState {
  //settings: AppSettings,
  ready: boolean
  dialog?: AppDialogStateValue
}
