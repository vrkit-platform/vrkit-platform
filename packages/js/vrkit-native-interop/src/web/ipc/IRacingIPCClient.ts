import { guard, isDefined, isString } from "@3fv/guard"
import {
  Any,
  IRacingIPCClientMetadata,
  IRacingIPCError,
  IRacingIPCMessage,
  IRacingIPCMessage_Type,
  IRacingIPCSessionDataVarHeaders,
  IRacingIPCSetSubscriptions, SessionChangedEvent,
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
  [IRacingIPCMessage_Type.SET_CLIENT_METADATA]: {
    request: IRacingIPCClientMetadata
    response: IRacingIPCClientMetadata
  }

  [IRacingIPCMessage_Type.GET_SESSION_METADATA]: {
    request: SessionMetadata
    response: SessionMetadata
  }

  [IRacingIPCMessage_Type.SET_SUBSCRIPTIONS]: {
    request: IRacingIPCSetSubscriptions
    response: IRacingIPCSetSubscriptions
  }

  [IRacingIPCMessage_Type.GET_SESSION_DATA_HEADERS]: {
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
  [IRacingIPCMessage_Type.SET_CLIENT_METADATA]: {
    request: IRacingIPCClientMetadata,
    response: IRacingIPCClientMetadata
  },
  [IRacingIPCMessage_Type.GET_SESSION_METADATA]: {
    request: null!,
    response: SessionMetadata
  },
  [IRacingIPCMessage_Type.SET_SUBSCRIPTIONS]: {
    request: IRacingIPCSetSubscriptions,
    response: IRacingIPCSetSubscriptions
  },
  [IRacingIPCMessage_Type.GET_SESSION_DATA_HEADERS]: {
    request: IRacingIPCSessionDataVarHeaders,
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
    public readonly type: IRacingIPCMessage_Type,
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
    const err = asOption(message.error)
      .map(msg => new IRacingIPCRuntimeError(msg.message, msg.code, msg.stackTrace))
      .getOrNull()

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
    this.responseMessage = Any.unpack(message.payload!, this.responseMessageType, {})

    this.deferred.resolve(this.responseMessage)
    return this.promise
  }
}

interface IRacingIPCSessionEventArgs {
  [SessionEventType.DATA_FRAME]: (dataFrame: SessionDataFrame) => any
  [SessionEventType.SESSION_CHANGED]: (metadata: SessionChangedEvent) => any
  [SessionEventType.METADATA_CHANGED]: (metadata: SessionMetadata) => any
}

export class IRacingIPCClient extends EventEmitter3<IRacingIPCSessionEventArgs> {
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
    }
  }
  
  protected onMessage(_client: NamedPipeClient, readHeader: NamedPipeMessageHeader, readData: Uint8Array) {
    try {
      const msg = IRacingIPCMessage.fromBinary(readData)
      if (msg.type === IRacingIPCMessage_Type.EVENT) {
        const eventType = match(msg.eventType as string | number)
          .with(P.string, it => SessionEventType[it] as SessionEventType)
          .otherwise(identity) as SessionEventType

        const eventMessageType = IRacingIPCSessionEventMap[eventType]
        if (!eventMessageType) {
          warn(`Handling for event type: ${msg.eventType} is not implemented`, msg)
          return
        }
        const eventMessage = Any.unpack(msg.payload!, eventMessageType)

        return this.emit(eventType as keyof IRacingIPCSessionEventArgs, eventMessage)
      }

      if (!this.pendingRequestResponseMap.has(readHeader.sourceId)) {
        error(`Message ID not found in message map: ${readHeader.sourceId}`)
        return
      }

      asOption(this.pendingRequestResponseMap.get(readHeader.sourceId)).ifSome(pending => {
        pending.resolve(msg)
        this.pendingRequestResponseMap.delete(readHeader.sourceId)
      })
    } catch (err) {
      error("Failed to parse message", err)
    }
  }

  async connect(): Promise<NamedPipeClient> {
    if (this.namedPipeConnectDeferred) {
      return await this.namedPipeConnectDeferred.promise
    }

    const deferred = (this.namedPipeConnectDeferred = new Deferred<NamedPipeClient>())
    try {
      this.namedPipeClient = await asOption(new NamedPipeClient("vrkit_iracing_ipc_server"))
        .ifSome(client => {
          client.on("connect", this.makeOnConnect(deferred))
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
    await this.connect()
    const id = ++IRacingIPCClient.MessageIdCounter
    const requestMessageType = IRacingIPCRequestResponseMap[type].request as MessageType<RequestMessage>
    const responseMessageType = IRacingIPCRequestResponseMap[type].response as MessageType<ResponseMessage>
    const transportMessage = IRacingIPCMessage.create({
      type,
      payload: !requestMessageType ? null! : Any.pack(requestMessage, requestMessageType)
    })

    const pendingRequestResponse = new PendingRequestResponse(
      id,
      type,
      requestMessage,
      requestMessageType,
      responseMessageType,
      transportMessage
    )

    this.pendingRequestResponseMap.set(id, pendingRequestResponse)

    try {
      await this.namedPipeClient.write(id, IRacingIPCMessage.toBinary(transportMessage))
      return await pendingRequestResponse.promise
    } catch (err) {
      // noinspection ES6MissingAwait
      pendingRequestResponse.reject(err)
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
  constructor() {
    super()
    
    if (isDev) {
      Object.assign(global, {
        irc: this
      })
    }
  }

  protected onDisconnect() {
    this.disconnect()
  }

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
