

export enum LogServerMessageType {
  LogRecords = "LogRecords"
}

export interface LogServerMessageArgs {
  [LogServerMessageType.LogRecords]: {
    clientId: string
    buffers: Buffer[]
  }
}