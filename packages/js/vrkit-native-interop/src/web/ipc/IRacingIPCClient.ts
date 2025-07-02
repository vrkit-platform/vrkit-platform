import { v4 as UUIDV4 } from "uuid"
import { guard, isDefined, isNumber, isString } from "@3fv/guard"
import {
  Any,
  IRacingIPCClientMetadata,
  IRacingIPCDataProviderId,
  IRacingIPCError,
  IRacingIPCMessage,
  IRacingIPCMessageType,
  IRacingIPCSessionDataVarHeaders,
  IRacingIPCSetSubscriptions,
  SessionChangedEvent,
  SessionDataFrame,
  SessionEventType,
  SessionMetadata
} from "@vrkit-platform/models"
import { match, P } from "ts-pattern"
import { getLogger } from "@3fv/logger-proxy"
import { NamedPipeClient, type NamedPipeMessageHeader } from "./NamedPipeClient"
import { asOption } from "@3fv/prelude-ts"
import { MessageType } from "@protobuf-ts/runtime"
import { Deferred } from "@3fv/deferred"
import { identity } from "lodash"
import EventEmitter3 from "eventemitter3"
import { isDev } from "../constants"

const log = getLogger(__filename),
  { debug, trace, info, error, warn } = log

export class IRacingIPCRuntimeError extends Error implements IRacingIPCError {
  constructor(
    public readonly message: string,
    public readonly code: string = null!,
    public readonly stackTrace: string = null!
  ) {
    super(message)
    this.code = isString(this.code) ? this.code : "UNKNOWN"
    if (stackTrace?.length > 0) {
      super.stack = stackTrace
    } else {
      this.stackTrace = super.stack as string
    }
  }
}

export interface IRacingIPCSessionEventMapType {
  [SessionEventType.DATA_FRAME]: SessionDataFrame

  [SessionEventType.METADATA_CHANGED]: SessionMetadata
}

export const IRacingIPCSessionEventMap: Record<number, MessageType<any>> = {
  [SessionEventType.DATA_FRAME]: SessionDataFrame,
  [SessionEventType.METADATA_CHANGED]: SessionMetadata
}

export interface IRacingIPCRequestResponseMapType {
  [IRacingIPCMessageType.TYPE_SET_CLIENT_METADATA]: {
    request: IRacingIPCClientMetadata
    response: IRacingIPCClientMetadata
  }

  [IRacingIPCMessageType.TYPE_GET_SESSION_METADATA]: {
    request: SessionMetadata
    response: SessionMetadata
  }

  [IRacingIPCMessageType.TYPE_SET_SUBSCRIPTIONS]: {
    request: IRacingIPCSetSubscriptions
    response: IRacingIPCSetSubscriptions
  }

  [IRacingIPCMessageType.TYPE_GET_SESSION_DATA_HEADERS]: {
    request: IRacingIPCSessionDataVarHeaders
    response: IRacingIPCSessionDataVarHeaders
  }
}

export const IRacingIPCRequestResponseMap: Record<
  number,
  {
    request: MessageType<any>
    response: MessageType<any>
  }
> = {
  [IRacingIPCMessageType.TYPE_SET_CLIENT_METADATA]: {
    request: IRacingIPCClientMetadata,
    response: IRacingIPCClientMetadata
  },
  [IRacingIPCMessageType.TYPE_GET_DATA_PROVIDER_ID]: {
    request: null!,
    response: IRacingIPCDataProviderId
  },
  [IRacingIPCMessageType.TYPE_GET_SESSION_METADATA]: {
    request: null!,
    response: SessionMetadata
  },
  [IRacingIPCMessageType.TYPE_SET_SUBSCRIPTIONS]: {
    request: IRacingIPCSetSubscriptions,
    response: null!
  },
  [IRacingIPCMessageType.TYPE_GET_SESSION_DATA_HEADERS]: {
    request: null!, //IRacingIPCSessionDataVarHeaders,
    response: IRacingIPCSessionDataVarHeaders
  }
}

// export type IRacingIPCRequestResponseMapType = typeof
// IRacingIPCRequestResponseMap
export type IRacingIPCRequestResponseMapKey = keyof IRacingIPCRequestResponseMapType

class PendingRequestResponse<RequestMessage extends {}, ResponseMessage extends {}> {
  public responseMessage: ResponseMessage = null!

  constructor(
    public readonly id: number,
    public readonly type: IRacingIPCMessageType,
    public readonly requestMessage: RequestMessage,
    public readonly requestMessageType: MessageType<RequestMessage>,
    public readonly responseMessageType: MessageType<ResponseMessage>,
    public readonly transportMessage = IRacingIPCMessage.create({
      type,
      payload: Any.pack(requestMessage, requestMessageType)
    }),
    public readonly deferred: Deferred<ResponseMessage> = new Deferred<ResponseMessage>()
  ) {}

  get error() {
    return this.deferred.isRejected() ? this.deferred.error : null
  }

  get isError() {
    return this.deferred.isRejected()
  }

  get isSettled() {
    return this.deferred.isSettled()
  }

  get promise(): Promise<ResponseMessage> {
    return this.deferred.promise
  }

  get response(): ResponseMessage {
    return this.deferred.isFulfilled() ? this.deferred.value : null!
  }

  checkError(message: IRacingIPCMessage): boolean {
    if (!message.isError && !message.error) {
      return false
    }

    const errDetail = !message.payload ? null : Any.unpack<IRacingIPCError>(message.payload!, IRacingIPCError, {}),
      err = asOption(errDetail)
        .map(
          detail =>
            new IRacingIPCRuntimeError(
              detail!.message ?? "Unknown",
              detail!.code ?? "-1",
              detail!.stackTrace ?? "<no-stack>"
            )
        )
        .getOrCall(() => new IRacingIPCRuntimeError("NO ERROR MESSAGE", "-1", "<no-stack>"))

    if (this.deferred.isSettled()) {
      throw new IRacingIPCRuntimeError("Deferred is already settled")
    }
    this.deferred.reject(err)
    return true
  }

  reject(errOrMsg: string | Error): Promise<ResponseMessage> {
    if (this.deferred.isSettled()) {
      return this.deferred.promise
    }

    const err = match(errOrMsg)
      .with(P.string, messageStr => new IRacingIPCRuntimeError(messageStr))
      .when(isDefined<Error>, err => new IRacingIPCRuntimeError(err.message, err.name, err.stack))
      .otherwise(() => new IRacingIPCRuntimeError("NO VALID ERROR INFORMATION"))

    this.deferred.reject(err)
    return this.promise
  }

  resolve(message: IRacingIPCMessage): Promise<ResponseMessage> {
    if (this.checkError(message)) {
      return this.deferred.promise
    }
    
    if (!this.responseMessageType) {
      debug(`Response message type is not defined for request type: ${this.type}, message:`, message)
      this.deferred.resolve(null!)
    } else if (!message.payload) {
      error(`Response message payload is empty`, message, this.responseMessageType, this)
      this.deferred.reject(new IRacingIPCRuntimeError("Response message payload is empty or response message type is not defined"))
    } else  {
      this.responseMessage =
          Any.unpack(message.payload!, this.responseMessageType, {})
      this.deferred.resolve(this.responseMessage)
    }
    return this.promise
  }
}

export enum IRacingIPCClientEventType {
  CONNECTED = "CONNECTED",
  DISCONNECTED = "DISCONNECTED",
  ERROR = "ERROR"
}

export interface IRacingIPCClientEventArgs {
  [IRacingIPCClientEventType.CONNECTED]: (client: IRacingIPCClient) => any
  [IRacingIPCClientEventType.DISCONNECTED]: (client: IRacingIPCClient) => any
  [IRacingIPCClientEventType.ERROR]: (client: IRacingIPCClient, err: Error) => any
  
  [SessionEventType.DATA_FRAME]: (client: IRacingIPCClient, dataFrame: SessionDataFrame) => any

  [SessionEventType.SESSION_CHANGED]: (client: IRacingIPCClient, metadata: SessionChangedEvent) => any

  [SessionEventType.METADATA_CHANGED]: (client: IRacingIPCClient, metadata: SessionMetadata) => any
}

export type IRacingIPCClientEventKeys = keyof IRacingIPCClientEventArgs

export const IRacingIPCClientEventTypes =
    Array<any>(
        ...Object.values(IRacingIPCClientEventType),
        ...Object.values(SessionEventType).filter(isNumber)
    ) as IRacingIPCClientEventKeys[]

export class IRacingIPCClient extends EventEmitter3<IRacingIPCClientEventArgs> {
  protected static MessageIdCounter: number = 0

  protected namedPipeClient: NamedPipeClient = null!

  protected namedPipeConnectDeferred: Deferred<NamedPipeClient> = null!

  protected readonly pendingRequestResponseMap = new Map<number, PendingRequestResponse<any, any>>()

  protected makeOnConnect(deferred: Deferred<NamedPipeClient>) {
    return (client: NamedPipeClient) => {
      info(`iRacing client service connected (${client.clientId})`)
      if (deferred.isSettled()) {
        error("Deferred is already settled")
        return
      }

      deferred.resolve(client)
      
      this.emit(IRacingIPCClientEventType.CONNECTED, this)
    }
  }

  protected onMessage(_client: NamedPipeClient, readHeader: NamedPipeMessageHeader, readData: Uint8Array) {
    try {
      const msg = IRacingIPCMessage.fromBinary(readData)
      if (msg.type === IRacingIPCMessageType.TYPE_EVENT) {
        const eventType = match(msg.eventType as string | number)
          .with(P.string, it => SessionEventType[it] as SessionEventType)
          .otherwise(identity) as SessionEventType

        const eventMessageType = IRacingIPCSessionEventMap[eventType]
        if (!eventMessageType) {
          warn(`Handling for event type: ${msg.eventType} is not implemented`, msg)
          return
        }
        if (!msg.payload) {
          warn(`Event message payload is empty for event type (${msg.eventType}), was expecting(${eventMessageType.typeName})`, msg)
          return
        }
        const eventMessage = Any.unpack(msg.payload!, eventMessageType)

        return this.emit(eventType as keyof IRacingIPCClientEventArgs, this, eventMessage)
      }

      if (!this.pendingRequestResponseMap.has(readHeader.sourceId)) {
        error(`Message ID not found in message map: ${readHeader.sourceId}`)
        return
      }

      asOption(this.pendingRequestResponseMap.get(readHeader.sourceId)).ifSome(pending => {
        pending.resolve(msg)
        // this.pendingRequestResponseMap.delete(readHeader.sourceId)
      })
    } catch (err) {
      error("Failed to parse message", err)
    }
  }
  
  /**
   * Randomly generated client ID for the iRacing IPC client.
   */
  readonly clientId = UUIDV4()

  async connect(): Promise<NamedPipeClient> {
    if (this.namedPipeConnectDeferred) {
      return await this.namedPipeConnectDeferred.promise
    }

    const deferred = (this.namedPipeConnectDeferred = new Deferred<NamedPipeClient>())
    try {
      this.namedPipeClient = await asOption(new NamedPipeClient(this.pipePath))
        .ifSome(client => {
          client.on("connect", this.makeOnConnect(deferred))
          client.on("error", this.onError.bind(this))
          client.on("message", this.onMessage.bind(this))
          client.on("end", this.onDisconnect.bind(this))
        })
        .map(client => client.connect())
        .getOrThrow()

      if (isDev) {
        Object.assign(global, {
          ircNamedPipeClient: this.namedPipeClient
        })
      }

      deferred.resolve(this.namedPipeClient)
    } catch (err) {
      error(`Failed to connect to iRacing data server`, err)
      this.namedPipeConnectDeferred = null!
      deferred.reject(err)
      throw err
    }

    return deferred.promise
  }

  /**
   * Send a message to the iRacing data server
   *
   * @param type
   * @param requestMessage
   */
  async request<
    Type extends IRacingIPCRequestResponseMapKey,
    RequestMessage extends
      IRacingIPCRequestResponseMapType[Type]["request"] = IRacingIPCRequestResponseMapType[Type]["request"],
    ResponseMessage extends
      IRacingIPCRequestResponseMapType[Type]["response"] = IRacingIPCRequestResponseMapType[Type]["response"]
  >(type: Type, requestMessage: RequestMessage): Promise<ResponseMessage> {
    try {
      await this.connect()
      const id = ++IRacingIPCClient.MessageIdCounter
      const requestMessageType = IRacingIPCRequestResponseMap[type].request as MessageType<RequestMessage>
      const responseMessageType = IRacingIPCRequestResponseMap[type].response as MessageType<ResponseMessage>
      const transportMessage = IRacingIPCMessage.create({
        type,
        payload: !requestMessageType ? Any.create()! : Any.pack(requestMessage, requestMessageType)
      })

      const pendingRequestResponse = new PendingRequestResponse(
        id,
        type,
        requestMessage,
        requestMessageType,
        responseMessageType,
        transportMessage
      )

      try {
        this.pendingRequestResponseMap.set(id, pendingRequestResponse)

        await this.namedPipeClient.write(id, IRacingIPCMessage.toBinary(transportMessage))
        const resPromise = pendingRequestResponse.promise
        const result = await resPromise
        info(`Received response for request ID: ${id}, type: ${type}`, result)
        return result as ResponseMessage
      } catch (err) {
        console.error(`Failed to receive response from iRacing IPC server`, err)
        if (!pendingRequestResponse.isSettled) {
          // noinspection ES6MissingAwait
          pendingRequestResponse.reject(err)
        }
        throw err
      }
    } catch (err) {
      console.error(`Failed request to iRacing IPC server`, err)
      throw err
    }
  }

  /**
   * Cleanup resources on unload
   *
   * @param event
   * @private
   */
  [Symbol.dispose](event: Event) {
    debug(`dispose IRacingIPCClient`)

    this.disconnect()
  }

  /**
   * Service constructor
   *
   */
  constructor(
      readonly pipePath: string
  ) {
    super()

    if (isDev) {
      Object.assign(global, {
        ipc_client: this
      })
    }
  }
  
  /**
   * Handles the error event of the named pipe client.
   * This method logs the error and emits an error event.
   *
   * @param client
   * @param err
   * @protected
   */
  protected onError(client: NamedPipeClient, err:Error) {
    info(`Named pipe client error with path (${client.pipeName})`, err)
    //guard(() => this.disconnect())
    this.emit(IRacingIPCClientEventType.ERROR, this, err)
  }
  
  /**
   * Handles the disconnection event of the named pipe client.
   *
   * @protected
   */
  protected onDisconnect() {
    this.disconnect()
  }
  
  /**
   * Disconnects the named pipe client and cleans up resources.
   */
  disconnect(): void {
    try {
      const deferred = this.namedPipeConnectDeferred
      if (deferred && !deferred.isSettled()) {
        guard(() => deferred.reject(new Error("Disconnected")))
      }
      this.namedPipeConnectDeferred = null!
      this.namedPipeClient?.disconnect()
      this.namedPipeClient = null!
    } catch (err) {
      warn("Failed to cleanly disconnect named pipe client", err)
    }
  }
}

export default IRacingIPCClient
