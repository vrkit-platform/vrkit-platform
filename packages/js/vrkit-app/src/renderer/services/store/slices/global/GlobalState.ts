// import type { AppSettings } from "vrkit-app-common/models"
import type { AppDialogStateValue } from "./AppDialogStateValue"
import type { AppSettings } from "vrkit-app-common/models"


export interface GlobalState {
  settings: AppSettings,
  ready: boolean
  dialog?: AppDialogStateValue
}
