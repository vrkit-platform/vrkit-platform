import type React from "react"
import type { AppDialogTypeKind } from "../../../../renderer-constants"


export interface AppDialogStateValue<Payload = any> {
  type: AppDialogTypeKind,
  payload: Payload
}


export interface AppDialogStateProps<Payload = any> {
  dialogState: AppDialogStateValue<Payload>
  onClose: (event: React.SyntheticEvent, reason: 'backdropClick' | 'escapeKeyDown') => any
  open: boolean
}
