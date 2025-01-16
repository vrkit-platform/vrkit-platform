// var addon = require('bindings')('SayHello');
// noinspection ES6UnusedImports

import type { IMessageType, MessageType } from "@protobuf-ts/runtime"
import { ClientEventType, TestEventData } from "@vrkit-platform/models"

import { asOption, Option } from "@3fv/prelude-ts"
import { getLogger } from "@3fv/logger-proxy"
import { MessageTypeFromCtor, uuidv4 } from "./utils"
import { GetNativeExports } from "./NativeBinding"

const log = getLogger(__filename)


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
export async function CreateNativeClient(
  eventCallback: NativeClientEventCallback
): Promise<NativeClient> {
  const nativeExports = await GetNativeExports()
  if (!nativeExports)
    throw Error("Unable to create native client; is this a VM?")
  
  const NativeClient = nativeExports.NativeClient
  return new NativeClient(eventCallback)
}

