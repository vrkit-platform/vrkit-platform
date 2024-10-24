import type {
  LapTrajectory,
  OverlayInfo,
  PluginComponentDefinition,
  PluginComponentDefinition_OverlayCommonSettings,
  PluginComponentDefinition_OverlayIRacingSettings,
  PluginManifest,
  SessionDataVariableValueMap,
  SessionTiming,
  TrackMap
} from "vrkit-models"
import type { SessionInfoMessage } from "./SessionInfoTypes"
import React from "react"
import { Container } from "@3fv/ditsy"

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
  
  getSessionTiming(): SessionTiming
  
  getLapTrajectory(trackLayoutId: string): Promise<LapTrajectory>
  
  getTrackMap(trackLayoutId: string): Promise<TrackMap>
  
  on<T extends keyof IPluginClientEventArgs>(type: T, handler: IPluginClientEventArgs[T]): void

  off<T extends keyof IPluginClientEventArgs>(type: T, handler?: IPluginClientEventArgs[T]): void
}

export interface IPluginComponentManager {
  getManifest():PluginManifest
  
  
  
  getOverlayCommonSettings(componentId: string)
      :PluginComponentDefinition_OverlayCommonSettings
  
  getOverlayIRacingSettings(componentId: string)
      :PluginComponentDefinition_OverlayIRacingSettings
  
  setOverlayComponent(
      id: string,
      ComponentType: React.ComponentType<IPluginClientComponentProps>
  ):void
  
  removeOverlayComponent(
      id:string
  ):void
}

export type IPluginInitFactory = (
    manifest:PluginManifest,
    componentManager:IPluginComponentManager,
    serviceContainer:Container
) => Promise<void>

export interface IPluginClientComponentProps {
  client: IPluginClient
  manager: IPluginComponentManager
  
  width: number
  height: number
}



declare global {
  function getVRKitPluginClient(): IPluginClient
  
  const isVRKitOverlayWindow: boolean
  const isVRKitEnvVR: boolean
}
