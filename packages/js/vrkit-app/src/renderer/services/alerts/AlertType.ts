export enum AlertType {
  info = "info",
  error = "error",
  success = "success",
  warning = "warning",
  loading = "loading"
}

export type AlertTypeKind = `${AlertType}` | AlertType
