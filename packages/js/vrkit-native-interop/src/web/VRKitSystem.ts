// var addon = require('bindings')('SayHello');
// noinspection ES6UnusedImports

import Path from "path"
import { MessageType } from "@protobuf-ts/runtime"
import Bind from "bindings"
import { Envelope, Envelope_Kind } from "./models/RPC/Envelope"
import { Any } from "./models/google/protobuf/any"
// const nativeAddonFile = Path.resolve(__dirname, "..","..","bin","Debug","vrkit_native_interop.node")
// const nativeAddonFileRelative = Path.relative(process.cwd(), nativeAddonFile);
// console.log(`Loading native addon abs >> ${nativeAddonFile}`);
// console.log(`Loading native addon rel >> ${nativeAddonFileRelative}`);

// const addon = require('bindings')(nativeAddonFileRelative);
const vrkSystem = Bind("vrkit_native_interop");



export interface VRKitNativeClient {
  
  
  executeRequest(path: string, requestData: Uint8Array): Promise<Uint8Array>
}

export interface VRKitNativeClientCtor {
  new(): VRKitNativeClient
}

const VRKitNativeClientImpl = vrkSystem.VRKitNativeClient as VRKitNativeClientCtor

let gRequestIdSeq: number = 0

export const VRKitPing = vrkSystem.VRKitPing as () => string

export class VRKitClient {
  readonly nativeClient: VRKitNativeClient
  
  
  
  private nextRequestId(): string {
    // TODO: change to uuid
    
    const id = ++gRequestIdSeq
    return id.toString()
  }
  
  constructor() {
    this.nativeClient =  new VRKitNativeClientImpl();
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
    
    const requestData = requestType.toBinary(request)
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
