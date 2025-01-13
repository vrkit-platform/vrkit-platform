import { asOption, Predicate } from "@3fv/prelude-ts"
import { dialog, ipcMain } from "electron"
import type{
  ElectronIPCChannelKind
} from "@vrkit-platform/shared"
import { negate, isEmpty, flatten } from "lodash"
import { isString } from "@3fv/guard"

type GlobalErrorType = "windowError" | "uncaughtException" | "unhandledRejection"

export function reportMainError(type: GlobalErrorType, ...args: any[]) {
  const isNotEmptyString = Predicate.of(isString).and(negate(isEmpty)),
      stack = args.map(it => it?.stack).filter(isNotEmptyString)[0] ?? "Not available",
      errorMsg = asOption(args.map(it => isNotEmptyString(it) ? it : it?.message).filter(isNotEmptyString).join("\n"))
          .filter(isNotEmptyString)
          .getOrElse("Not available"),
      rawData = JSON.stringify(args, null, 2)
  
  dialog.showErrorBox("Unexpected error occurred in main process", `${errorMsg}\ntype: ${type}\nstack: \n${stack}\n\nRaw Details: \n${rawData}`)
}

function onRendererError(ev: Electron.IpcMainEvent, type, ...args: any[]) {
  args = Array.isArray(args[0]) ? flatten(args) : args
  reportMainError(type, ...args)
}

ipcMain.on("unhandledError" satisfies ElectronIPCChannelKind, onRendererError)
if (import.meta.webpackHot) {
  import.meta.webpackHot.addDisposeHandler(() => {
    ipcMain.off("unhandledError" satisfies ElectronIPCChannelKind, onRendererError)
  })
}
export {}