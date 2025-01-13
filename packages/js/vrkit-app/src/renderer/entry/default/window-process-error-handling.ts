import { ipcRenderer } from "electron"
import {
  type ElectronIPCChannelKind
} from "@vrkit-platform/shared"
import { flatten, toPlainObject } from "lodash"
import { isPrimitive } from "@3fv/guard"

function reportError(type: "windowError" | "uncaughtException" | "unhandledRejection", ...args: any[]) {
  const msg = `${type}, ${JSON.stringify(args,null,2)}`
  console.error(msg,...args)
  try {
    ipcRenderer.send("unhandledError" satisfies ElectronIPCChannelKind,
        [
          type,
          ...flatten(args).map(it => isPrimitive(it) ? it : toPlainObject(it))
        ]
    )
  } catch (err) {
    console.error(`Unable to send error message to main`, err)
  }
}

window.addEventListener("error", (...args) => {
  reportError("windowError", ...args)
})

window.addEventListener("unhandledrejection", (...args) => {
  reportError("unhandledRejection", ...args)
})

process.on("uncaughtException",(...args:any[]) => {
  reportError("uncaughtException", ...args)
})

process.on("unhandledRejection",(...args:any[]) => {
  reportError("unhandledRejection", ...args)
})
