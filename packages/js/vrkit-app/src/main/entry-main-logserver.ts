import upmNodeProcess from "@3fv/electron-utility-process-manager/node"
import Tracer from "tracer"
import { AppPaths } from "@vrkit-platform/shared/constants/node"
import Path from "path"
import type { LogServerEventData, LogServerRecordCount, LogServerRequestMap } from "../common/logger"
import Fsx from "fs-extra"
import { isArray } from "@3fv/guard"
import PQueue from "p-queue"

const jsonlFile = Path.join(AppPaths.logsDir, "VRKitApp.jsonl")
const logFile = Path.join(AppPaths.logsDir, "VRKitApp.log")
let totalCount = 0

const log = Tracer.colorConsole({
  transport: function (data) {
    Fsx.appendFile(logFile, data.rawoutput + "\n", err => {
      if (err) {
        console.warn(`Unable to append to file (${logFile})`, err)
      }
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

upmNodeProcess.addEventHandler((_clientId, _port, payload: LogServerEventData) => {
  if (!isArray(payload?.records)) {
    log.error(`Received mis-shaped log records`, payload)
    return
  }

  const { records } = payload
  totalCount += records.length
  // ENABLE TO SEE RECORD RECEIPTS
  // log.debug(`Received (${records.length}) log records, total is now (${totalCount})`)
  writeRecords(records)
  
  return true
})

upmNodeProcess.addRequestHandler<LogServerRequestMap>(
  "getLogRecordCount",
  async (_type, _messageId): Promise<LogServerRecordCount> => {
    return { count: totalCount } as LogServerRecordCount
  }
)

upmNodeProcess.addRequestHandler<LogServerRequestMap>("getLogFile", async (_type, _messageId) => {
  return logFile
})

export {}
