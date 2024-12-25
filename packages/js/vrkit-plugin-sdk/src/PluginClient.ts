import type {
  LapTrajectory,
  OverlayInfo,
  PluginComponentDefinition,
  PluginManifest,
  SessionDataVariableValueMap,
  SessionTiming,
  TrackMap
} from "@vrkit-platform/models"
import type { SessionInfoMessage } from "./SessionInfoTypes"
import React from "react"
import { Container } from "@3fv/ditsy"

export type ISessionTimeAndDuration = Omit<SessionTiming, "currentTimeMillis" | "sampleIndex" | "sampleCount">

export enum PluginClientEventType {
  SESSION_ID_CHANGED = "SESSION_ID_CHANGED",
  SESSION_INFO_CHANGED = "SESSION_INFO_CHANGED",
  DATA_FRAME = "DATA_FRAME"
}

export interface IPluginClientEventArgs {
  [PluginClientEventType.DATA_FRAME]: (
    sessionId: string,
    timing: SessionTiming,
    dataVarValues: SessionDataVariableValueMap
  ) => void
  [PluginClientEventType.SESSION_ID_CHANGED]: (sessionId: string, info: SessionInfoMessage) => void
  [PluginClientEventType.SESSION_INFO_CHANGED]: (sessionId: string, info: SessionInfoMessage) => void
}

export type PluginClientEventHandler<Type extends keyof IPluginClientEventArgs> = IPluginClientEventArgs[Type]

/**
 * Provides all the functions required for a renderer side plugin to function.
 *
 */
export interface IPluginClient {
  inActiveSession(): boolean
  getOverlayInfo(): OverlayInfo
  
  getSessionInfo(): SessionInfoMessage
  
  getSessionTimeAndDuration(): ISessionTimeAndDuration
  
  getLapTrajectory(trackLayoutId: string): Promise<LapTrajectory>
  
  getTrackMap(trackLayoutId: string): Promise<TrackMap>
  
  on<T extends keyof IPluginClientEventArgs>(type: T, handler: IPluginClientEventArgs[T]): void

  off<T extends keyof IPluginClientEventArgs>(type: T, handler?: IPluginClientEventArgs[T]): void
}

export type IPluginComponentFactory = (
    manifest:PluginManifest,
    componentDef: PluginComponentDefinition,
    serviceContainer:Container
) => Promise<TPluginComponentType>

export interface IPluginComponentProps {
  sessionId?: string
  client: IPluginClient
  
  width: number
  height: number
}

export type TPluginComponentType = React.ComponentType<IPluginComponentProps> | Promise<React.ComponentType<IPluginComponentProps>>


declare global {
  function getVRKitPluginClient(): IPluginClient
  
  const isVRKitOverlayWindow: boolean
  const isVRKitEnvVR: boolean
}
