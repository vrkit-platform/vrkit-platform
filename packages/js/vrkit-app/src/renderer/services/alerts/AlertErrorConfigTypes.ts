import type { ErrorKind, Pair } from "vrkit-shared/utils"
import type { ToastOptions } from "react-hot-toast"

export interface AlertOptions extends ToastOptions {
  formatPrefix?: string
}

export type AlertErrorGuard<E extends ErrorKind> = (o: any) => o is E

export type AlertErrorFormatter<E extends ErrorKind> = (err: E,opts?: AlertOptions) => string

export type AlertErrorConfig<E extends ErrorKind> = Pair<AlertErrorGuard<E>,AlertErrorFormatter<E>>
