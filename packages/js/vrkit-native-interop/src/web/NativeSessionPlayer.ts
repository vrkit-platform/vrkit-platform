// var addon = require('bindings')('SayHello');
// noinspection ES6UnusedImports
import { asOption, Either, Option } from "@3fv/prelude-ts"
import {
  SessionData,
  SessionDataVariable,
  SessionDataVariableHeader,
  SessionEventType,
  SessionTiming
} from "vrkit-models"
import { getLogger } from "@3fv/logger-proxy"

const log = getLogger(__filename)

export interface NativeSessionPlayerEventData {
  type: SessionEventType
  
  payload: Uint8Array
}

export type SessionPlayerId = string | "SESSION_TYPE_LIVE"



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
