import { Buffer } from "buffer"
import * as net from "net"
import { getLogger } from "@3fv/logger-proxy"
import { Deferred } from "@3fv/deferred"
import EventEmitter3 from "eventemitter3"
import { guard } from "@3fv/guard"

const log = getLogger(__filename),
  { debug, trace, info, error, warn } = log

// CPP TYPE `NamedPipeMessageHeader` SIZE IN BYTES
const MESSAGE_HEADER_LENGTH =
  4 + // ID
  4 + //  SOURCE_ID
  4 + // CLIENT_ID
  4 // MESSAGE SIZE

// const PIPE_NAME = "vrkit_iracing_ipc_server"
// const PIPE_PATH = "\\\\.\\pipe\\" + PIPE_NAME
export const PIPE_PATH_PREFIX = "\\\\.\\pipe\\"
export function ToPipePath(pipeName: string): string {
  return pipeName.startsWith(PIPE_PATH_PREFIX) ? pipeName : PIPE_PATH_PREFIX + pipeName
}

export class NamedPipeMessageHeader {
  static read(readBuffer: Buffer): NamedPipeMessageHeader {
    const bufferView = new DataView(readBuffer.buffer)
    return new NamedPipeMessageHeader(
      bufferView.getUint32(0, true),
      bufferView.getUint32(4, true),
      bufferView.getUint32(8, true),
      bufferView.getUint32(12, true)
    )
  }

  constructor(
    public id: number,
    public sourceId: number = 0,
    public clientId: number = 0,
    public size: number = 0
  ) {}

  toDataView(dataView: DataView): DataView {
    dataView.setUint32(0, this.id, true)
    dataView.setUint32(4, this.sourceId, true)
    dataView.setUint32(8, this.clientId, true)
    dataView.setUint32(12, this.size, true)
    return dataView
  }
}

export interface NamedPipeClientEventMap {
  error: (client: NamedPipeClient, error: Error) => any
  connect: (client: NamedPipeClient) => any

  message: (client: NamedPipeClient, readHeader: NamedPipeMessageHeader, readData: Uint8Array) => any

  end: (client: NamedPipeClient) => any
}

export class NamedPipeClient extends EventEmitter3<NamedPipeClientEventMap> {
  static ClientIdCounter = 0

  private readonly pipePath: string

  private connectDeferred: Deferred<NamedPipeClient> | null = null

  private client: NodeJS.Socket

  private readHeader: NamedPipeMessageHeader = null!

  private readBuffer: Buffer = null!

  constructor(
    public readonly pipeName: string,
    public readonly clientId: number = ++NamedPipeClient.ClientIdCounter
  ) {
    super()
    this.pipePath = ToPipePath(pipeName)
  }

  /**
   * Handles the event when the client successfully connects.
   * This method ensures that the connection promise is resolved
   * and emits a "connect" event to notify listeners.
   *
   * @return {void} This method does not return a value.
   */
  private onConnect(): void {
    debug("Client: onConnect")
    const deferred = this.connectDeferred!
    log.assert(deferred && !deferred!.isSettled(), "onConnect: connectDeferred is already settled")
    deferred.resolve(this)
    this.emit("connect", this)
  }

  /**
   * Handles the error event for the named pipe client.
   * This method logs the error, emits an "error" event,
   * and rejects the connection promise if it is still pending.
   *
   * @param err
   * @private
   */
  private onError(err: Error) {
    error(`NamedPipeClient.onError: ${err.message}`, err)
    this.disconnect(err)
    this.emit("error", this, err)
  }

  /**
   * Handle incoming data from the named pipe client.
   * This method processes the incoming data, checks if there is enough data to
   * read a complete message, and emits the message if a complete message is
   * available.
   *
   * @param newBuffer
   * @private
   */
  private onData(newBuffer: Buffer) {
    if (log.isDebugEnabled()) debug(`onData(newBuffer=${newBuffer.length})`)
    let readBuffer = (this.readBuffer = this.readBuffer?.length
      ? Buffer.concat([this.readBuffer, newBuffer], this.readBuffer.length + newBuffer.length)
      : newBuffer)

    while (readBuffer.length >= MESSAGE_HEADER_LENGTH) {
      const readHeader = (this.readHeader = this.readHeader ?? NamedPipeMessageHeader.read(readBuffer)),
        readDataSize = readHeader.size,
        readTotalSize = readDataSize + MESSAGE_HEADER_LENGTH

      if (readBuffer.length < readTotalSize) {
        if (log.isDebugEnabled()) debug(`onData: NOT ENOUGH (${readBuffer.length}<${readTotalSize})`)
        break
      }

      // MESSAGE DATA AVAILABLE, PROCESS IT & EMIT
      const readData = readBuffer.subarray(MESSAGE_HEADER_LENGTH, MESSAGE_HEADER_LENGTH + readDataSize)
      this.onMessage(readHeader, new Uint8Array(readData))

      // DROP THIS MESSAGE DATA
      readBuffer = this.readBuffer = readBuffer.subarray(readTotalSize, readBuffer.length)

      // REMOVE THE HEADER
      this.readHeader = null!
    }

    if (log.isDebugEnabled()) debug(`onData(remainingData=${readBuffer.length})`)
  }

  /**
   * Disconnects the named pipe client.
   */
  disconnect(err: Error | null = null): void {
    const client = this.client
    if (!client) {
      return
    }
    const { connectDeferred } = this
    if (connectDeferred && !connectDeferred.isSettled()) {
      guard(() => connectDeferred.reject(err ?? Error("Client disconnected")))
    }
    
    this.connectDeferred = null
    
    info(`Disconnecting client ${this.clientId}`)
    guard(() => this.client.end())
    this.client = null!
  }

  /**
   * Handles the disconnection event of the named pipe client.
   * This method cleans up the connection, rejects any pending connection
   * promises, and emits an "end" event to notify listeners that the client has
   * disconnected.
   *
   * @return {void} This method does not return a value.
   */
  private onDisconnect(): void {
    info(`onDisconnect`)

    this.disconnect()
    if (this.connectDeferred && !this.connectDeferred.isSettled()) {
      this.connectDeferred.reject(new Error("Disconnected"))
    }
    this.connectDeferred = null
    this.emit("end", this)
  }
  
  /**
   * Connects to the named pipe server.
   */
  async connect(): Promise<NamedPipeClient> {
    if (this.connectDeferred) {
      return this.connectDeferred.promise
    }

    if (this.client) {
      this.disconnect()
    }

    const deferred = (this.connectDeferred = new Deferred<NamedPipeClient>())

    try {
      this.client = net
        .connect(this.pipePath, this.onConnect.bind(this))
        .on("error", this.onError.bind(this))
        .on("data", this.onData.bind(this))
        .on("end", this.onDisconnect.bind(this))

      return await deferred.promise
    } catch (err) {
      error("Failed to connect to named pipe", err)
      if (!deferred.isSettled()) {
        deferred.reject(err)
      }
      throw err
    }
  }

  async write(id: number, data: Uint8Array): Promise<void> {
    const msgHeader = new NamedPipeMessageHeader(id, 0, this.clientId, data.length),
      msgBuf = Buffer.alloc(MESSAGE_HEADER_LENGTH + data.length),
      msgView = new DataView(msgBuf.buffer)

    msgHeader.toDataView(msgView)
    msgBuf.set(data, MESSAGE_HEADER_LENGTH)

    await new Promise((resolve, reject) => {
      this.client.write(msgBuf.subarray(0, MESSAGE_HEADER_LENGTH), err => {
        if (err) {
          reject(err)
        } else {
          resolve(null)
        }
      })
    })
    await new Promise((resolve, reject) => {
      this.client.write(msgBuf.subarray(MESSAGE_HEADER_LENGTH), err => {
        if (err) {
          reject(err)
        } else {
          resolve(null)
        }
      })
    })
  }

  private onMessage(readHeader: NamedPipeMessageHeader, readData: Uint8Array): void {
    this.emit("message", this, readHeader, readData)
  }
}

export default NamedPipeClient
