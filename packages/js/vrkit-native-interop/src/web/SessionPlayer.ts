// var addon = require('bindings')('SayHello');
// noinspection ES6UnusedImports
import { asOption, Either, Option } from "@3fv/prelude-ts"
import YAML from "yaml"
import type { IMessageType } from "@protobuf-ts/runtime"
import { guard, isDefined } from "@3fv/guard"
import EventEmitter3 from "eventemitter3"
import {
  SessionData,
  SessionDataVariable,
  SessionDataVariableHeader,
  SessionDataVariableMap,
  SessionDataVariableType,
  SessionDataVariableValue,
  SessionDataVariableValueMap,
  SessionEventData,
  SessionEventType,
  SessionTiming
} from "vrkit-models"
import { getLogger } from "@3fv/logger-proxy"
import { MessageTypeFromCtor, objectKeysLowerFirstReviver } from "./utils"
import { GetNativeExports } from "./NativeBinding"
import { flatten, identity, isEmpty, negate, pick, range } from "lodash"

import type { SessionInfoMessage } from "vrkit-plugin-sdk"

const log = getLogger(__filename)
const isDev = process.env.NODE_ENV !== "production"
const isNotEmpty = negate(isEmpty)

export interface NativeSessionPlayerEventData {
  type: SessionEventType

  payload: Uint8Array
}

export type SessionPlayerId = string | "SESSION_TYPE_LIVE"

const LiveSessionId: SessionPlayerId = "SESSION_TYPE_LIVE"

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

  readonly id: string
  
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
    id: string,
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

export type SessionPlayerEventDataDefault = SessionPlayerEventData<
  typeof SessionEventData
>

export interface SessionPlayerEventArgs extends SessionPlayerEventArgMap {
  [SessionEventType.INFO_CHANGED]: (
    player: SessionPlayer,
    data: SessionPlayerEventDataDefault
  ) => void

  [SessionEventType.AVAILABLE]: (
    player: SessionPlayer,
    data: SessionPlayerEventDataDefault
  ) => void

  [SessionEventType.DATA_FRAME]: (
    player: SessionPlayer,
    data: SessionPlayerEventDataDefault,
    dataVarValues: SessionDataVariableValueMap
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
  id: string,
  file: string | null = null
): NativeSessionPlayer {
  const NativeSessionPlayer = GetNativeExports().NativeSessionPlayer
  return new NativeSessionPlayer(eventCallback, id, file)
}

/**
 * JS/Node/Electron side of the client
 */
export class SessionPlayer extends EventEmitter3<
  SessionPlayerEventArgs,
  SessionPlayer
> {
  readonly id: string

  private nativePlayer: NativeSessionPlayer

  private dataVariableHeaderCount = -1

  private dataVariableHeaderMap: { [name: string]: SessionDataVariableHeader } =
    {}

  private dataVariableMap: SessionDataVariableMap = {}

  // private dataFrameEventVariables: SessionDataVariable[] = []

  /**
   * Populate the data variable header map
   *
   * @private
   */
  private populateDataVariableHeaders() {
    if (this.dataVariableHeaderCount > 0) return

    const headers = this.nativePlayer.getDataVariableHeaders()
    headers.forEach(dataVarHeader => {
      this.dataVariableHeaderMap[dataVarHeader.name] = dataVarHeader
    })

    this.dataVariableHeaderCount = headers.length
  }
  
  getDataVariableValueMap(): SessionDataVariableValueMap {
    return Object.fromEntries(Object.entries(this.dataVariableMap).map(([name, dataVar]) => {
      const { type } = dataVar
      const value = {
        ...pick(dataVar, "count", "valid", "name", "unit"),
        type,
        values: range(dataVar.count).map(idx =>
            type === SessionDataVariableType.Bool
                ? dataVar.getBool(idx)
                : type === SessionDataVariableType.Char
                    ? dataVar.getChar(idx)
                    : type === SessionDataVariableType.Bitmask
                        ? dataVar.getBitmask(idx)
                        : type === SessionDataVariableType.Float
                            ? dataVar.getFloat(idx)
                            : type === SessionDataVariableType.Double
                                ? dataVar.getDouble(idx)
                                : type === SessionDataVariableType.Int32
                                    ? dataVar.getInt(idx)
                                    : null
        )
      } as SessionDataVariableValue
      return [name, value]
    }))
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
      log.error("Unable to unpack payload", err)
    }
    
    const extraArgs:any[] = []
    if (type === SessionEventType.DATA_FRAME) {
      extraArgs.push(this.getDataVariableValueMap())
    }

    guard(
      () => this.emit(type, this, data, ...extraArgs),
      err => log.error("Unable to emit event", err)
    )
  }

  /**
   * Constructor
   */
  constructor(file: string | null = null) {
    super()
    this.id = isNotEmpty(file) ? file : LiveSessionId
    this.nativePlayer = CreateNativeSessionPlayer(
      this.onEvent.bind(this),
      this.id,
      file
    )
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

  getDataVariableHeaders(
    ...argNames: Array<string | string[]>
  ): SessionDataVariableHeader[] {
    if (!this.isAvailable) return []

    this.populateDataVariableHeaders()

    const names = flatten(argNames)
    return isEmpty(names)
      ? Object.values(this.dataVariableHeaderMap)
      : names.map(name =>
          asOption(this.dataVariableHeaderMap[name]).getOrThrow(
            `Unable to find header for "${name}"`
          )
        )
  }

  getDataVariableHeader(name: string): SessionDataVariableHeader {
    return asOption(this.getDataVariableHeaders(name))
      .map(headers => headers[0])
      .getOrNull()
  }

  getDataVariables(
    ...argNames: Array<string | string[]>
  ): Array<SessionDataVariable> {
    const names = flatten(argNames)
    return names.map(name =>
      asOption(this.dataVariableMap[name]).getOrCall(() =>
        asOption<SessionDataVariable>(this.nativePlayer.getDataVariable(name))
          .ifSome(dataVar => {
            this.dataVariableMap[name] = dataVar
          })
          .getOrCall(() => {
            log.error(`Unable to get data var "${name}"`)
            return null
          })
      )
    ).filter(isDefined)
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
    this.getDataVariables(...argNames)
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
    return Either.try(() =>
      SessionData.create(this.nativePlayer.sessionData)
    ).match({
      Left: err => {
        log.error(`Unable to get session data`, err)
        return null
      },
      Right: identity
    })
  }

  get sessionInfo(): SessionInfoMessage {
    try {
      const yamlStr = this.nativePlayer.sessionInfoYAMLStr
      // log.info("SessionInfoMessage (YAML)", yamlStr)
      return (
        isEmpty(yamlStr) ? {} : YAML.parse(yamlStr, objectKeysLowerFirstReviver)
      ) as SessionInfoMessage
    } catch (err) {
      log.error(`Failed to get session info message`, err)
      return {} as SessionInfoMessage
    }
    //return {} as SessionInfoMessage
  }
}

export function isLivePlayer(player: SessionPlayer) {
  return player.id === LiveSessionId;
}

let liveVRKitSessionPlayer: SessionPlayer = null

export function GetLiveVRKitSessionPlayer(): SessionPlayer {
  if (!liveVRKitSessionPlayer) {
    liveVRKitSessionPlayer = new SessionPlayer()
  }

  return liveVRKitSessionPlayer
}
