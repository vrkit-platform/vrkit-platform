// var addon = require('bindings')('SayHello');
// noinspection ES6UnusedImports

import type {MessageType,IMessageType} from "@protobuf-ts/runtime"
import EventEmitter3 from "eventemitter3"
import {
  ClientEventType,
  Any,
  Envelope,
  Envelope_Kind,
  SessionEventData,
  TestEventData
} from "vrkit-models"

import { asOption, Option } from "@3fv/prelude-ts"
import {getLogger} from "@3fv/logger-proxy"
import { MessageTypeFromCtor, uuidv4 } from "./utils"
import { GetNativeExports } from "./NativeBinding"

const log = getLogger(__filename)
const isDev = process.env.NODE_ENV !== "production"


/**
 * Event data
 */
export interface ClientEventData<M extends IMessageType<any>, T extends MessageTypeFromCtor<M> = MessageTypeFromCtor<M>> {
  type: ClientEventType

  payload: T
}

export type ClientEventArgMap = { [K in ClientEventType]: (...args:unknown[]) => void }

export interface ClientEventArgs extends ClientEventArgMap {
  [ClientEventType.TEST]: (data: ClientEventData<typeof TestEventData>) => void
}

const ClientEventPayloadTypes = {
  [ClientEventType.TEST]: TestEventData
}

export type ClientEventName = ClientEventType | keyof ClientEventType


/**
 * Internal native client event data structure
 */
export interface NativeClientEventData {
  type: ClientEventType
  payload: Uint8Array
}

export type NativeClientEventCallback = (
    type: ClientEventType,
    data: NativeClientEventData
) => void

export interface NativeClient {
  /**
   * Destroy the native client instance
   */
  destroy():void
  
  /**
   * Execute an RPC request
   *
   * @param path
   * @param requestData
   */
  executeRequest(path: string, requestData: Uint8Array): Promise<Uint8Array>
  
  /**
   * @brief test internal event emitting
   *
   *  > NOTE: If the binary native library was compiled with DEBUG configuration
   *
   * @param type event type being emitted
   * @param args as this is a test, no specific typing is used
   */
  testNativeEventEmit(type: ClientEventType, ...args: any[]): void
}

/**
 * Class implementation interface definition
 */
export interface NativeClientCtor {
  new (eventCallback: NativeClientEventCallback): NativeClient
}

export interface NativeClient {
  /**
   * Destroy the native client instance
   */
  destroy():void
  
  /**
   * Execute an RPC request
   *
   * @param path
   * @param requestData
   */
  executeRequest(path: string, requestData: Uint8Array): Promise<Uint8Array>

  /**
   * @brief test internal event emitting
   *
   *  > NOTE: If the binary native library was compiled with DEBUG configuration
   *
   * @param type event type being emitted
   * @param args as this is a test, no specific typing is used
   */
  testNativeEventEmit(type: ClientEventType, ...args: any[]): void
}

/**
 * Class implementation interface definition
 */
export interface NativeClientCtor {
  new (eventCallback: NativeClientEventCallback): NativeClient
}

/**
 * Native library exports
 */
export interface NativeExports {
  
  /**
   * Native node module client
   */
  NativeClient: NativeClientCtor
  
  /**
   * Shutdown the underlying client
   *
   * @constructor
   */
  Shutdown(): void
}

/**
 * Cast the native addon to the interface defined above
 */
function CreateNativeClient(
  eventCallback: NativeClientEventCallback
): NativeClient {
  const NativeClient = GetNativeExports().NativeClient
  return new NativeClient(eventCallback)
}

/**
 * JS/Node/Electron side of the client
 */
export class Client extends EventEmitter3<
  ClientEventArgs,
  Client
> {
  
  private nativeClient: NativeClient
  
  /**
   * Get the next request id
   *
   * @private
   */
  private nextRequestId(): string {
    return uuidv4()
  }
  
  /**
   * Event handler that is passed to the native client
   * on creation
   *
   * @param type
   * @param nativeData
   * @private
   */
  private onEvent(
    type: ClientEventType,
    nativeData?: NativeClientEventData
  ): void {
    log.info(`Received event type`, type, nativeData)
    
    const data: ClientEventData<any> = {
      type,
      payload: null
    }
    
    if (nativeData?.payload) {
      const payloadAny = Any.fromBinary(nativeData.payload)
      const messageType = ClientEventPayloadTypes[type]
      if (messageType) {
        data.payload = Any.unpack(payloadAny, messageType)
      }
    }

    this.emit(type, data)
  }
  
  /**
   * Constructor
   */
  constructor() {
    super()
    this.nativeClient = CreateNativeClient(this.onEvent.bind(this))
  }
  
  

  /**
   * Execute an RPC call
   *
   * @param path
   * @param requestType
   * @param request
   * @param responseType
   */
  async executeRequest<
    Request extends object,
    Response extends object,
    RequestType extends MessageType<Request> = MessageType<Request>,
    ResponseType extends MessageType<Response> = MessageType<Response>
  >(
    path: string,
    requestType: RequestType,
    responseType: ResponseType,
    request: Request
  ): Promise<Response> {
    let requestEnvelope = Envelope.create({
      id: this.nextRequestId(),
      kind: Envelope_Kind.REQUEST,
      requestPath: path,
      payload: Any.pack(request, requestType)
    })

    const responseEnvelope = await this.executeRequestInternal(
      path,
      requestEnvelope
    )
    
    let res: Response = null
    if (responseEnvelope.payload?.value) {
      res = Any.unpack(responseEnvelope.payload, responseType)
    }
    
    log.info("Received & parsed response", res)
    return res
  }
  
  async executeRequestInternal(
    path: string,
    request: Envelope
  ): Promise<Envelope> {
    const requestData = Envelope.toBinary(request)
    // const responseData = requestData
    const responseData = await this.nativeClient.executeRequest(
      path,
      requestData
    )
    const res = Envelope.fromBinary(responseData)

    log.info("Received & parsed response envelope", res)
    return res
  }
  
  /**
   * Only available in dev mode
   */
  testNativeEventEmit(): void {
    log.assertFatal(isDev, "`testNativeEventEmit` is only available when NODE_ENV is set to development");
    this.nativeClient.testNativeEventEmit(ClientEventType.TEST)
  }
  
  /**
   * Destroy this client & underlying `this.nativeClient`
   */
  destroy() {
    this.nativeClient.destroy()
    delete this.nativeClient
  }
  
}

let defaultVRKitClient: Client = null

export function GetDefaultVRKitClient(): Client {
  if (!defaultVRKitClient) {
    defaultVRKitClient = new Client()
  }

  return defaultVRKitClient
}
