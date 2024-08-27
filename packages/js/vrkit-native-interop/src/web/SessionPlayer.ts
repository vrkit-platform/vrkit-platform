// var addon = require('bindings')('SayHello');
// noinspection ES6UnusedImports

import type { IMessageType, MessageType } from "@protobuf-ts/runtime"
import EventEmitter3 from "eventemitter3"
import {
  Any,
  SessionData,
  SessionEventData,
  SessionEventType,
  SessionTiming
} from "vrkit-models"

import * as Path from "node:path"
import { asOption, Option } from "@3fv/prelude-ts"
import { getLogger } from "@3fv/logger-proxy"
import * as Fs from "node:fs"
import { Deferred } from "@3fv/deferred"
import { MessageTypeFromCtor, uuidv4 } from "./utils"
import { GetNativeExports } from "./NativeBinding"
import {
  SessionDataVariable,
  SessionDataVariableHeader
} from "./SessionDataVariableTypes"
import { flatten } from "lodash"

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
  
  readonly sessionData: SessionData

  readonly sessionTiming: SessionTiming

  readonly sessionInfo: any
  
  readonly isAvailable: boolean
  
  start(): boolean
  stop(): boolean
  resume(): boolean
  pause(): boolean

  seek(index: number): boolean

  /**
   * Destroy the native client instance
   */
  destroy(): void
  
  getDataVariable(name: string): SessionDataVariable
  
  getDataVariableHeaders(): Array<SessionDataVariableHeader>

}

/**
 * Class implementation interface definition
 */
export interface NativeSessionPlayerCtor {
  new (
    eventCallback: NativeSessionPlayerEventCallback,
    file?: string | null
  ): NativeSessionPlayer
}

/**
 * Event data
 */
export interface SessionPlayerEventData<
  M extends IMessageType<any>,
  T extends MessageTypeFromCtor<M> = MessageTypeFromCtor<M>
> {
  type: SessionEventType

  payload: T
}

export type SessionPlayerEventArgMap = {
  [K in SessionEventType]: (...args: unknown[]) => void
}

export interface SessionPlayerEventArgs extends SessionPlayerEventArgMap {
  [SessionEventType.INFO_CHANGED]: (
    data: SessionPlayerEventData<typeof SessionEventData>
  ) => void

  [SessionEventType.AVAILABLE]: (
    data: SessionPlayerEventData<typeof SessionEventData>
  ) => void

  [SessionEventType.DATA_FRAME]: (
    data: SessionPlayerEventData<typeof SessionEventData>,
      vars: SessionDataVariable[]
  ) => void
}

const SessionPlayerEventPayloadTypes = {
  [SessionEventType.INFO_CHANGED]: SessionEventData,
  [SessionEventType.DATA_FRAME]: SessionEventData,
  [SessionEventType.AVAILABLE]: SessionEventData
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
  private dataVariableHeaderCount = -1
  private dataVariableHeaderMap: {[name:string]: SessionDataVariableHeader} = {}
  private dataVariableMap: {[name:string]: SessionDataVariable} = {}
  private dataFrameEventVariables: SessionDataVariable[] = []
  
  /**
   * Populate the data variable header map
   *
   * @private
   */
  private populateDataVariableHeaders() {
    if (this.dataVariableHeaderCount > 0)
      return
    
    const headers = this.nativePlayer.getDataVariableHeaders()
    headers.forEach(dataVarHeader => {
      this.dataVariableHeaderMap[dataVarHeader.name] = dataVarHeader
    })
    
    this.dataVariableHeaderCount = headers.length
  }
  
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
    // log.info(`Received event type`, type, nativeData)

    const data: SessionPlayerEventData<any> = {
      type,
      payload: null
    }
    
    try {
      if (nativeData?.payload) {
        // data.payload = SessionEventData.fromBinary(nativeData.payload)
        data.payload = SessionEventData.fromBinary(nativeData.payload)
        // data.payload = SessionEventData.fromJsonString(nativeData.payload as any)
        // const payloadAny = Any.fromBinary(nativeData.payload)
        // const payloadAny:SessionEventData = SessionEventData.fromBinary(nativeData.payload)
        
        // const messageType = SessionPlayerEventPayloadTypes[type]
        // if (messageType) {
        //   data.payload = Any.unpack(payloadAny, messageType)
        // }
      }
    } catch (err) {
      log.error("Unable to unpack payload",err)
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

  start() {
    return this.nativePlayer.start()
  }
  
  stop() {
    return this.nativePlayer.stop()
  }
  
  resume() {
    return this.nativePlayer.resume()
  }
  
  pause() {
    return this.nativePlayer.pause()
  }
  
  seek(sampleIndex: number) {
    return this.nativePlayer.seek(sampleIndex)
  }
  
  
  
  getDataVariableHeaders(...argNames: Array<string | string[]>): SessionDataVariableHeader[] {
    this.populateDataVariableHeaders()
    
    const names = flatten(argNames)
    return names.map(name =>
        asOption(this.dataVariableHeaderMap[name]).getOrThrow(`Unable to find header for "${name}"`)
    )
  }
  
  getDataVariableHeader(name: string): SessionDataVariableHeader{
    return asOption(this.getDataVariableHeaders(name))
        .map(headers => headers[0])
        .getOrNull()
  }
  
  getDataVariables(...argNames: Array<string | string[]>): Array<SessionDataVariable> {
    const names = flatten(argNames)
    return names.map(name =>
      asOption(this.dataVariableMap[name]).getOrCall(() =>
        asOption<SessionDataVariable>(this.nativePlayer.getDataVariable(name))
          .ifSome(dataVar => {
            this.dataVariableMap[name] = dataVar
          })
          .getOrThrow(`Unable to get data var "${name}"`)
      )
    )
  }
  
  getDataVariable(name: string): SessionDataVariable {
    return asOption(this.getDataVariables(name))
        .map(vars => vars[0])
        .getOrNull()
  }
  
  
  /**
   * Configure which `SessionDataVariable`(s) are collected and passed
   * with each `DATA_FRAME` event
   *
   * @param argNames
   */
  configureDataVariables(...argNames: Array<string | string[]>): boolean {
    this.dataFrameEventVariables = this.getDataVariables(...argNames)
    return true
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
