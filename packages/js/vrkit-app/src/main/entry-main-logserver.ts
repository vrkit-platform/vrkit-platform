import upmNodeProcess from "@3fv/electron-utility-process-manager/node"
import Tracer from "tracer"
import { AppPaths } from "@vrkit-platform/shared/constants/node"
import Path from "path"
import type { LogServerEventData, LogServerRecordCount, LogServerRequestMap } from "../common/logger"
import Fsx from "fs-extra"
import { isArray } from "@3fv/guard"
import PQueue from "p-queue"
import type { LogRecord } from "@3fv/logger-proxy"

const jsonlFile = Path.join(AppPaths.logsDir, "VRKitApp.jsonl")
const logFile = Path.join(AppPaths.logsDir, "VRKitApp.log")
let totalCount = 0

const log = Tracer.colorConsole({
  transport: function (data) {
    // console.log(data.output)
    Fsx.appendFile(logFile, data.rawoutput + "\n", err => {
      if (err) throw err
    })
  }
})

const writeQueue = new PQueue({
  concurrency: 1
})

function writeRecords(records: string[]) {
  const recordData = records.join("\n")
  writeQueue.add(() => Fsx.appendFile(jsonlFile, recordData + "\n", "utf-8"))
}
// const appender = new FileAppender({
//   enableRolling: true,
//   maxFiles: 5,
//   maxSize: 2048,
//   filename: Path.join(AppPaths.logsDir, "vrkit-app-electron.log")
// })
// log.info(`Log file ${logFile}`)
// console.info(`Log file ${logFile}`)

upmNodeProcess.addEventHandler((clientId, port, payload: LogServerEventData) => {
  if (!isArray(payload?.records)) {
    log.error(`Received mis-shaped log records`, payload)
    return
  }

  const { records } = payload
  totalCount += records.length
  log.info(`Received (${records.length}) log records, total is now (${totalCount})`)
  writeRecords(records)
  
  return true
})

upmNodeProcess.addRequestHandler<LogServerRequestMap>(
  "getLogRecordCount",
  async (type, messageId): Promise<LogServerRecordCount> => {
    return { count: totalCount } as LogServerRecordCount //`pong: ${what}`
  }
)

upmNodeProcess.addRequestHandler<LogServerRequestMap>("getLogFile", async (type, messageId) => {
  return logFile
})

export {}
