// var addon = require('bindings')('SayHello');
// noinspection ES6UnusedImports

import type {MessageType,IMessageType} from "@protobuf-ts/runtime"
import EventEmitter3 from "eventemitter3"
import {
  Any,
  SessionEventData,
} from "vrkit-models"

import * as Path from "node:path"
import { asOption, Option } from "@3fv/prelude-ts"
import {getLogger} from "@3fv/logger-proxy"
import * as Fs from "node:fs"
import { Deferred } from "@3fv/deferred"
import { SessionData, SessionEventType, SessionTiming } from "vrkit-models"
import { MessageTypeFromCtor, uuidv4 } from "./utils"
import {
  GetNativeExports
} from "./NativeBinding"

const log = getLogger(__filename)
const isDev = process.env.NODE_ENV !== "production"


export interface NativeSessionPlayerEventData {
  type: SessionEventType
  payload: Uint8Array
}


export type SessionPlayerEventName = SessionEventType | keyof SessionEventType

export type NativeSessionPlayerEventCallback = (
    type: SessionEventType,
    data: NativeSessionPlayerEventData
) => void

export interface NativeSessionPlayer {
  
  readonly sessionData:SessionData;
  readonly sessionTiming:SessionTiming;
  readonly sessionInfo: any
  
  play(): void;
  stop(): void;
  seek(index: number): void;
  
  /**
   * Destroy the native client instance
   */
  destroy():void
}

/**
 * Class implementation interface definition
 */
export interface NativeSessionPlayerCtor {
  new (eventCallback: NativeSessionPlayerEventCallback, file?: string | null): NativeSessionPlayer
}


/**
 * Event data
 */
export interface SessionPlayerEventData<M extends IMessageType<any>, T extends MessageTypeFromCtor<M> = MessageTypeFromCtor<M>> {
  type: SessionEventType

  payload: T
}

export type SessionPlayerEventArgMap = { [K in SessionEventType]: (...args:unknown[]) => void }

export interface SessionPlayerEventArgs extends SessionPlayerEventArgMap {
  [SessionEventType.AVAILABLE]: (data: SessionPlayerEventData<typeof SessionEventData>) => void
  [SessionEventType.DATA_FRAME]: (data: SessionPlayerEventData<typeof SessionEventData>) => void
}

const SessionPlayerEventPayloadTypes = {
  [SessionEventType.DATA_FRAME]: SessionEventData,
  [SessionEventType.AVAILABLE]: SessionEventData,
  
}

/**
 * Cast the native addon to the interface defined above
 */
function CreateNativeSessionPlayer(
  eventCallback: NativeSessionPlayerEventCallback,
  file: string | null = null
): NativeSessionPlayer {
  const NativeSessionPlayer = GetNativeExports().NativeSessionPlayer
  return new NativeSessionPlayer(eventCallback, file)
}

/**
 * JS/Node/Electron side of the client
 */
export class SessionPlayer extends EventEmitter3<
  SessionPlayerEventArgs,
  SessionPlayer
> {
  
  private nativePlayer: NativeSessionPlayer
  
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
    type: SessionEventType,
    nativeData?: NativeSessionPlayerEventData
  ): void {
    log.info(`Received event type`, type, nativeData)
    
    const data: SessionPlayerEventData<any> = {
      type,
      payload: null
    }
    
    if (nativeData?.payload) {
      const payloadAny = Any.fromBinary(nativeData.payload)
      const messageType = SessionPlayerEventPayloadTypes[type]
      if (messageType) {
        data.payload = Any.unpack(payloadAny, messageType)
      }
    }

    this.emit(type, data)
  }
  
  /**
   * Constructor
   */
  constructor(file: string | null = null) {
    super()
    this.nativePlayer = CreateNativeSessionPlayer(this.onEvent.bind(this), file)
  }
  
  /**
   * Synonym for destroy
   */
  close() {
    this.destroy()
  }
  
  /**
   * Destroy this client & underlying `this.nativeClient`
   */
  destroy() {
    this.nativePlayer.destroy()
    delete this.nativePlayer
  }
  
  get sessionTiming() {
    return this.nativePlayer.sessionTiming
  }
  
  get sessionData(): SessionData {
    return SessionData.create(this.nativePlayer.sessionData)
  }
  
  get sessionInfo() {
    return this.nativePlayer.sessionInfo
  }
  
}

let liveVRKitSessionPlayer: SessionPlayer = null

export function GetLiveVRKitSessionPlayer(): SessionPlayer {
  if (!liveVRKitSessionPlayer) {
    liveVRKitSessionPlayer = new SessionPlayer()
  }

  return liveVRKitSessionPlayer
}
