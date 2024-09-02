// var addon = require('bindings')('SayHello');
// noinspection ES6UnusedImports
import YAML from "yaml"
import type { IMessageType, MessageType } from "@protobuf-ts/runtime"
import { getValue, guard, isObject, isString } from "@3fv/guard"
import EventEmitter3 from "eventemitter3"
import {
  Any,
  SessionData,
  SessionEventData,
  SessionEventType,
  SessionTiming
} from "vrkit-models"

import { asOption, Option } from "@3fv/prelude-ts"
import { getLogger } from "@3fv/logger-proxy"
import { Deferred } from "@3fv/deferred"
import {
  MessageTypeFromCtor,
  objectKeysLowerFirstReviver,
  uuidv4
} from "./utils"
import { GetNativeExports } from "./NativeBinding"
import {
  SessionDataVariable,
  SessionDataVariableHeader
} from "./SessionDataVariableTypes"
import { flatten, isEmpty, lowerFirst } from "lodash"
import type { SessionInfoMessage } from "./SessionInfoTypes"

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

  readonly sessionInfoYAMLStr: string
  
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

export type SessionPlayerEventDataDefault = SessionPlayerEventData<typeof SessionEventData>

export interface SessionPlayerEventArgs extends SessionPlayerEventArgMap {
  [SessionEventType.INFO_CHANGED]: (
    data: SessionPlayerEventDataDefault
  ) => void

  [SessionEventType.AVAILABLE]: (
    data: SessionPlayerEventDataDefault
  ) => void

  [SessionEventType.DATA_FRAME]: (
    data: SessionPlayerEventDataDefault,
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
    // log.debug(`Received event type`, type, nativeData)

    const data: SessionPlayerEventData<any> = {
      type,
      payload: null
    }
    
    try {
      if (nativeData?.payload) {
        data.payload = SessionEventData.fromBinary(nativeData.payload)
      }
    } catch (err) {
      log.error("Unable to unpack payload",err)
    }

    guard(() => this.emit(type, data), err => log.error("Unable to emit event", err))
  }

  /**
   * Constructor
   */
  constructor(file: string | null = null) {
    super()
    this.nativePlayer = CreateNativeSessionPlayer(this.onEvent.bind(this), file)
  }
  
  /**
   * Is the session currently valid & available
   */
  get isAvailable() {
    return this.nativePlayer?.isAvailable
  }
  
  /**
   * Start the player, `Start != Play`
   */
  start() {
    return this.nativePlayer?.start()
  }
  
  /**
   * Stop the player, `Stop != Pause`
   */
  stop() {
    return this.nativePlayer?.stop()
  }
  
  /**
   * `Resume == Play`
   */
  resume() {
    return this.nativePlayer?.resume()
  }
  
  /**
   * `Pause == Stop`
   */
  pause() {
    return this.nativePlayer?.pause()
  }
  
  /**
   * Go to a specific data sample
   * @param sampleIndex
   */
  seek(sampleIndex: number) {
    return this.nativePlayer?.seek(sampleIndex)
  }
  
  
  
  getDataVariableHeaders(...argNames: Array<string | string[]>): SessionDataVariableHeader[] {
    if (!this.isAvailable)
      return []
    
    this.populateDataVariableHeaders()
    
    const names = flatten(argNames)
    return isEmpty(names) ? Object.values(this.dataVariableHeaderMap) :  names.map(name =>
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
    this.nativePlayer?.destroy()
    delete this.nativePlayer
  }

  get sessionTiming() {
    return this.nativePlayer.sessionTiming
  }

  get sessionData(): SessionData {
    return SessionData.create(this.nativePlayer.sessionData)
  }

  get sessionInfo(): SessionInfoMessage {
    try {
      const yamlStr = this.nativePlayer.sessionInfoYAMLStr
      // log.info("SessionInfoMessage (YAML)", yamlStr)
      return (isEmpty(yamlStr) ? {} : YAML.parse(yamlStr, objectKeysLowerFirstReviver)) as SessionInfoMessage
      
    } catch (err) {
      log.error(`Failed to get session info message`, err)
      return {} as SessionInfoMessage
    }
    //return {} as SessionInfoMessage
    
    
  }
}

let liveVRKitSessionPlayer: SessionPlayer = null

export function GetLiveVRKitSessionPlayer(): SessionPlayer {
  if (!liveVRKitSessionPlayer) {
    liveVRKitSessionPlayer = new SessionPlayer()
  }

  return liveVRKitSessionPlayer
}
