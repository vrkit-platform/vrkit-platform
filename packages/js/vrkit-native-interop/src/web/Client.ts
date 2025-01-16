// var addon = require('bindings')('SayHello');
// noinspection ES6UnusedImports

import type { MessageType } from "@protobuf-ts/runtime"
import EventEmitter3 from "eventemitter3"
import { Any, ClientEventType, Envelope, Envelope_Kind, SessionEventData, TestEventData } from "@vrkit-platform/models"

import { asOption, Option } from "@3fv/prelude-ts"
import { getLogger } from "@3fv/logger-proxy"
import { uuidv4 } from "./utils"
import {
  ClientEventArgs,
  ClientEventData,
  CreateNativeClient,
  NativeClient,
  NativeClientEventData
} from "./NativeClient"
import { isDev } from "./constants"
import { Deferred } from "@3fv/deferred"

const log = getLogger(__filename)


const ClientEventPayloadTypes = {
  [ClientEventType.TEST]: TestEventData
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
  private constructor() {
    super()
    
  }
  
  private async initialize() {
    this.nativeClient = await CreateNativeClient(this.onEvent.bind(this))
  }
  
  get isReady() {
    return !!this.nativeClient
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
  
  static async Create(): Promise<Client> {
    const client = new Client()
    await client.initialize()
    if (!client.isReady)
      return null
    
    return client
  }
  
}

let defaultVRKitClientDeferred: Deferred<Client> = null

export async function GetDefaultVRKitClient(): Promise<Client> {
  if (!defaultVRKitClientDeferred) {
    defaultVRKitClientDeferred = new Deferred<Client>()
    try {
      defaultVRKitClientDeferred.resolve(await Client.Create())
    } catch (err) {
      log.error(`Failed to create defaultVRKitClient`, err)
      defaultVRKitClientDeferred.reject(err)
    }
  }
  
  return defaultVRKitClientDeferred.promise
}
