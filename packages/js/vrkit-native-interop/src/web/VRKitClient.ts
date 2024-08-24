// var addon = require('bindings')('SayHello');
// noinspection ES6UnusedImports

import EventEmitter3 from "eventemitter3"
import { MessageType } from "@protobuf-ts/runtime"
import Bind from "bindings"
import {
  ClientEvent as VRKitClientEvent,
  Any,
  Envelope,
  Envelope_Kind,
  SessionEventData, ClientEventTestData
} from "vrkit-models"
import * as Path from "node:path"
import { asOption, Option } from "@3fv/prelude-ts"
import * as Fs from "node:fs"

// const nativeAddonFileRelative = Path.relative(process.cwd(),
// nativeAddonFile); console.log(`Loading native addon abs >>
// ${nativeAddonFile}`); console.log(`Loading native addon rel >>
// ${nativeAddonFileRelative}`);

// const addon = require('bindings')(nativeAddonFileRelative);
const gNativeLib = {
  exports: null as VRKitNativeExports
}
// let gNativeExports: VRKitNativeExports = Bind("vrkit_native_interop")
const kNativeLibTargets = ["Debug", "Release"]

function ReleaseNativeExports(): void {
  if (gNativeLib.exports)
    delete gNativeLib.exports
  
  gNativeLib.exports = null

  if (typeof require !== "undefined") {
    kNativeLibTargets.forEach(target =>
      asOption(target)
        .map(target =>
          Path.resolve(
            __dirname,
            "..",
            "out",
            target,
            "vrkit_native_interop.node"
          )
        )
        .filter(Fs.existsSync)
        .flatMap(targetPath => {
          // console.info("Resolving native module", targetPath)
          return Option.try(() => require.resolve(targetPath))
        })
        .ifSome(resolvedPath => {
          // console.info("Resolved native module", resolvedPath)
          delete require.cache[resolvedPath]
          // console.info("Deleted native module from cache", resolvedPath)
        })
    )
  }
}

function GetNativeExports() {
  if (!gNativeLib.exports) gNativeLib.exports = Bind("vrkit_native_interop")

  return gNativeLib.exports
}

export async function VRKitShutdown() {
  if (gNativeLib.exports)
    gNativeLib.exports.Shutdown()
  
  ReleaseNativeExports()

  await new Promise<void>((resolve) => {
    setTimeout(resolve, 1000)
  })
}

export { VRKitClientEvent }

export interface VRKitNativeClientEventData {
  type: VRKitClientEvent

  payload: Uint8Array
}

//, PayloadType extends MessageType<T> = MessageType<T>
export interface VRKitClientEventData<T extends {}> {
  type: VRKitClientEvent

  payload: T
}

export type VRKitClientEventArgMap = { [K in VRKitClientEvent]: (...args:unknown[]) => void }

export interface VRKitClientEventArgs extends VRKitClientEventArgMap {
  [VRKitClientEvent.TEST]: (data: VRKitClientEventData<ClientEventTestData>) => void
  [VRKitClientEvent.SESSION]: (data: VRKitClientEventData<SessionEventData>) => void
  [VRKitClientEvent.SESSION_DATA_FRAME]: (data: VRKitClientEventData<SessionEventData>) => void
}

export type VRKitClientEventName = VRKitClientEvent | keyof VRKitClientEvent

export type VRKitNativeClientEventCallback = (
  type: VRKitClientEvent,
  data: VRKitNativeClientEventData
) => void

export interface VRKitNativeClient {
  destroy():void
  
  executeRequest(path: string, requestData: Uint8Array): Promise<Uint8Array>

  /**
   * @brief test internal event emitting
   *
   *  > NOTE: If the binary native library was compiled with DEBUG configuration
   *
   * @param type event type being emitted
   * @param args as this is a test, no specific typing is used
   */
  testNativeEventEmit(type: VRKitClientEvent, ...args: any[]): void
}

/**
 * Class implementation interface definition
 */
export interface VRKitNativeClientCtor {
  new (eventCallback: VRKitNativeClientEventCallback): VRKitNativeClient
}

/**
 * Native library exports
 */
export interface VRKitNativeExports {
  NativeClient: VRKitNativeClientCtor

  Shutdown(): void
}

/**
 * Cast the native addon to the interface defined above
 */
// const NativeClientImpl = gNativeExports.NativeClient
// as VRKitNativeClientCtor
function CreateNativeClient(
  eventCallback: VRKitNativeClientEventCallback
): VRKitNativeClient {
  const NativeClient = GetNativeExports().NativeClient
  return new NativeClient(eventCallback)
}

// export const VRKitPing = vrkNative.vrkNativeClientLib.VRKitPing as () =>
// string

/**
 * JS/Node/Electron side of the client
 */
export class VRKitClient extends EventEmitter3<
  VRKitClientEventArgs,
  VRKitClient
> {
  static gRequestIdSeq: number = 0

  private nativeClient: VRKitNativeClient

  private nextRequestId(): string {
    // TODO: change to uuid

    const id = ++VRKitClient.gRequestIdSeq
    return id.toString()
  }

  private onEvent(
    type: VRKitClientEvent,
    nativeData?: VRKitNativeClientEventData
  ): void {
    console.log(`Received event type`, type, nativeData)
    
    const data: VRKitClientEventData<any> = {
      type,
      payload: null
    }
    
    // let payloadMessage:any = null
    if (nativeData?.payload) {
      const payloadAny = Any.fromBinary(nativeData.payload)
      if (type === VRKitClientEvent.TEST) {
        data.payload = Any.unpack(payloadAny, ClientEventTestData)
      }
    }
    //let msg: any = null
    // TODO: Create JSDefaultEvent protobuf and implement encode/decode native
    // & js side if (nativeData?.payload) { msg =
    // Any.unpack(nativeData?.payload) }

    this.emit(type, data)
  }

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

    // requestEnvelope.payload = Any.pack(request, requestType)
    // debugger
    const responseEnvelope = await this.executeRequestInternal(
      path,
      requestEnvelope
    )
    let res: Response = null
    if (responseEnvelope.payload?.value) {
      res = Any.unpack(responseEnvelope.payload, responseType)
    }
    // const res: Response =
    // responseType.fromBinary(responseEnvelope.payload.value) as Response

    console.log("Received & parsed response", res)
    return res
  }
  
  destroy() {
    this.nativeClient.destroy()
    delete this.nativeClient
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

    console.log("Received & parsed response envelope", res)
    return res
  }

  testNativeEventEmit(): void {
    this.nativeClient.testNativeEventEmit(VRKitClientEvent.TEST)
  }
}

let defaultVRKitClient: VRKitClient = null

export function getDefaultVRKitClient(): VRKitClient {
  if (!defaultVRKitClient) {
    defaultVRKitClient = new VRKitClient()
  }

  return defaultVRKitClient
}
