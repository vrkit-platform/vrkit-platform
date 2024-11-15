
export interface LogServerEventData {
  clientId: string
  records: string[]
}

export interface LogServerRecordCount {
  count: number
}

export interface LogServerRequestMap {
  getLogRecordCount: () => Promise<LogServerRecordCount>
  getLogFile: () => Promise<string>
}

export const LogServerServiceName = "logserver"
