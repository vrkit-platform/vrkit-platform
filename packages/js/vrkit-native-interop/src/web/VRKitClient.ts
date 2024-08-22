// var addon = require('bindings')('SayHello');
// noinspection ES6UnusedImports

import Path from "path"
import EventEmitter3 from "eventemitter3"
import { MessageType } from "@protobuf-ts/runtime"
import Bind from "bindings"
import { Envelope, Envelope_Kind } from "vrkit-models"
import { Any } from "vrkit-models"
// const nativeAddonFile = Path.resolve(__dirname, "..","..","bin","Debug","vrkit_native_interop.node")
// const nativeAddonFileRelative = Path.relative(process.cwd(), nativeAddonFile);
// console.log(`Loading native addon abs >> ${nativeAddonFile}`);
// console.log(`Loading native addon rel >> ${nativeAddonFileRelative}`);

// const addon = require('bindings')(nativeAddonFileRelative);
const vrkNativeClientLib = Bind("vrkit_native_interop");

export enum VRKitNativeClientEventType {
  LiveSessionChanged= "LiveSessionChanged",
  SessionsChanged = "SessionsChanged"
}

export interface VRKitNativeClientEventData {
  type: VRKitNativeClientEventType
  payload: Uint8Array
}

//, PayloadType extends MessageType<T> = MessageType<T>
export interface VRKitClientEventData<T extends {}> {
  type: VRKitNativeClientEventType
  payload: T
}

export type VRKitNativeClientEventTypeArgMap = {[K in VRKitNativeClientEventType]: any}
export interface VRKitNativeClientEventTypeArgs extends VRKitNativeClientEventTypeArgMap {
  LiveSessionChanged: (data: VRKitClientEventData<any>) => void
}

export type VRKitNativeClientEventTypeName = VRKitNativeClientEventType | (keyof VRKitNativeClientEventType)



export type VRKitNativeClientEventCallback = (type: VRKitNativeClientEventType, data: VRKitNativeClientEventData) => void

export interface VRKitNativeClient {
  executeRequest(path: string, requestData: Uint8Array): Promise<Uint8Array>
  
  /**
   * @brief test internal event emitting
   *
   *  > NOTE: If the binary native library was compiled with DEBUG configuration
   *
   * @param type event type being emitted
   * @param args as this is a test, no specific typing is used
   */
  testNativeEventEmit(type: VRKitNativeClientEventType, ...args:any[]): void;
}

/**
 * Class implementation interface definition
 */
export interface VRKitNativeClientCtor {
  new(eventCallback: VRKitNativeClientEventCallback): VRKitNativeClient
}

/**
 * Cast the native addon to the interface defined above
 */
const VRKitNativeClientImpl = vrkNativeClientLib.VRKitNativeClient as VRKitNativeClientCtor



export const VRKitPing = vrkNativeClientLib.VRKitPing as () => string

/**
 * JS/Node/Electron side of the client
 */
export class VRKitClient extends EventEmitter3<VRKitNativeClientEventTypeArgs, VRKitClient> {
  static gRequestIdSeq: number = 0
  
  readonly nativeClient: VRKitNativeClient
  
  private nextRequestId(): string {
    // TODO: change to uuid
    
    const id = ++VRKitClient.gRequestIdSeq
    return id.toString()
  }
  
  private onEvent(type: VRKitNativeClientEventType, nativeData?: VRKitNativeClientEventData): void {
    console.log(`Received event type`, type, nativeData)
    
    //let msg: any = null
    // TODO: Create JSDefaultEvent protobuf and implement encode/decode native & js side
    // if (nativeData?.payload) {
    //   msg = Any.unpack(nativeData?.payload)
    // }
    
    const data: VRKitClientEventData<any> = {
      type,
      payload: null
    }
    
    this.emit(type, data)
  }
  
  constructor() {
    super()
    this.nativeClient =  new VRKitNativeClientImpl(this.onEvent.bind(this));
  }
  
  
  /**
   * Execute an RPC call
   *
   * @param path
   * @param requestType
   * @param request
   * @param responseType
   */
  async executeRequest<Request extends object, Response extends object, RequestType extends MessageType<Request> = MessageType<Request>, ResponseType extends MessageType<Response> = MessageType<Response>>(
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
    
    // requestEnvelope.payload = Any.pack(request, requestType)
    // debugger
    const responseEnvelope = await this.executeRequestInternal(path, requestEnvelope)
    let res: Response = null
    if (responseEnvelope.payload?.value) {
      res = Any.unpack(responseEnvelope.payload,responseType)
    }
    // const res: Response = responseType.fromBinary(responseEnvelope.payload.value) as Response
    
    console.log("Received & parsed response", res)
    return res;
  }
  
  async executeRequestInternal(
      path: string,
      request: Envelope,
  ): Promise<Envelope> {
    
    const requestData = Envelope.toBinary(request)
    // const responseData = requestData
    const responseData = await this.nativeClient.executeRequest(path, requestData)
    const res = Envelope.fromBinary(responseData)
    
    console.log("Received & parsed response envelope", res)
    return res;
  }
}

let defaultVRKitClient:VRKitClient = null
export function getDefaultVRKitClient():VRKitClient {
  if (!defaultVRKitClient) {
    defaultVRKitClient = new VRKitClient()
  }
  
  return defaultVRKitClient;
}