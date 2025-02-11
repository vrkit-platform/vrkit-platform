import { asOption, Predicate } from "@3fv/prelude-ts"
import { dialog, ipcMain } from "electron"
import type { ElectronIPCChannelKind } from "@vrkit-platform/shared"
import { flatten, isEmpty, negate } from "lodash"
import { guard, isString } from "@3fv/guard"
import type { Logger } from "@3fv/logger-proxy"
import { GetMessageFromArgs, ToCleanArgs } from "vrkit-app-common/logger"

declare global {
  type GlobalErrorType = "windowError" | "uncaughtException" | "unhandledRejection"

  let VRKitReportMainFatalError: (type: GlobalErrorType, ...args: any[]) => void
}

const gGlobalErrorLoggerMap = new Map<string, Logger>()

export function reportMainError(type: GlobalErrorType, ...args: any[]) {
  const cleanArgs = ToCleanArgs(...args),
    stringArgs = cleanArgs.map(it => JSON.stringify(it))

  let msg = ""
  ;[msg, args] = GetMessageFromArgs(...cleanArgs)

  msg += ` (SOURCE=${type})`
  if (!msg.length) {
    msg += `(SOURCE=${type}), ${stringArgs.join(", ")}`
  }

  // if (isDev) {
  //   debugger
  // }

  if (!gGlobalErrorLoggerMap.has(type)) {
    guard(
      () => {
        gGlobalErrorLoggerMap.set(type, require("@3fv/logger-proxy").getLogger(type) as Logger)
      },
      err => console.error(`Failed to send to log server`, err)
    )
  }
  if (gGlobalErrorLoggerMap.has(type)) {
    const globalErrorLog = gGlobalErrorLoggerMap.get(type)
    globalErrorLog.error(msg, ...cleanArgs)
  }
  console.error(msg, ...cleanArgs)

  // console.error(...args)
  const isNotEmptyString = Predicate.of(isString).and(negate(isEmpty)),
    stack = args.find(it => isNotEmptyString(it?.stack)) ?? "Not available",
    errorMsg = asOption(msg).filter(isNotEmptyString).getOrElse("Not available")

  dialog.showErrorBox(
    "Unexpected error occurred in main process",
    `${errorMsg}\ntype: ${type}\nstack: \n${stack}\n\nRaw Details: \n${stringArgs.join("\n")}`
  )
}

;(global as any)["VRKitReportMainFatalError"] = reportMainError

function onRendererError(ev: Electron.IpcMainEvent, type, ...args: any[]) {
  args = Array.isArray(args[0]) ? flatten(args) : args
  reportMainError("windowError", type, ToCleanArgs(args))
}

function makeErrorHandler(type: GlobalErrorType) {
  return (...args: any[]) => {
    reportMainError(type, ToCleanArgs(...args))
  }
}

const handleUncaughtException = makeErrorHandler("uncaughtException"),
  handleUnhandledRejection = makeErrorHandler("unhandledRejection")

process.on("uncaughtException", handleUncaughtException)
process.on("unhandledRejection", handleUnhandledRejection)

ipcMain.on("unhandledError" satisfies ElectronIPCChannelKind, onRendererError)
if (import.meta.webpackHot) {
  import.meta.webpackHot.addDisposeHandler(() => {
    ipcMain.off("unhandledError" satisfies ElectronIPCChannelKind, onRendererError)
    process.removeAllListeners("uncaughtException")
    process.removeAllListeners("unhandledRejection")
  })
}

if (isDev) {
  global["CreateUncaughtException"] = (msg: string = "test1234", ...args: any[]) => {
    process.nextTick(() => {
      const log = ((global["GetLogger"] ?? require("@3fv/logger-proxy").getLogger)("main")) as Logger
      log.error(msg, ...args)
      throw Error(msg)
    })
  }

  global["CreateUnhandledRejection"] = (msg: string = "async-test1234", ...args: any[]) => {
    process.nextTick(async () => {
      const log = ((global["GetLogger"] ?? require("@3fv/logger-proxy").getLogger)("main")) as Logger
      log.error(msg, ...args)
      throw new Error(msg)
      // return Promise.reject(Error(msg))
    })
  }
}

export {}