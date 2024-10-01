import type {
  LapTrajectory,
  OverlayInfo,
  SessionDataVariableValueMap,
  SessionTiming, TrackMap
} from "vrkit-models"
import type { SessionInfoMessage } from "./SessionInfoTypes"

export enum PluginClientEventType {
  SESSION_ID_CHANGED = "SESSION_ID_CHANGED",
  SESSION_INFO_CHANGED = "SESSION_INFO_CHANGED",
  DATA_FRAME = "DATA_FRAME"
}

export interface PluginClientEventArgs {
  [PluginClientEventType.DATA_FRAME]: (
    sessionId: string,
    timing: SessionTiming,
    dataVarValues: SessionDataVariableValueMap
  ) => void
  [PluginClientEventType.SESSION_ID_CHANGED]: (sessionId: string, info: SessionInfoMessage) => void
  [PluginClientEventType.SESSION_INFO_CHANGED]: (sessionId: string, info: SessionInfoMessage) => void
}

export type PluginClientEventHandler<Type extends keyof PluginClientEventArgs> = PluginClientEventArgs[Type]


export interface PluginClient {
  inActiveSession(): boolean
  getOverlayInfo(): OverlayInfo
  
  getSessionInfo(): SessionInfoMessage
  
  getSessionTiming(): SessionTiming
  
  getLapTrajectory(trackLayoutId: string): Promise<LapTrajectory>
  
  getTrackMap(trackLayoutId: string): Promise<TrackMap>
  
  on<T extends keyof PluginClientEventArgs, Fn extends PluginClientEventArgs[T] = PluginClientEventArgs[T]>(type: T, handler: Fn): void

  off<T extends keyof PluginClientEventArgs, Fn extends PluginClientEventArgs[T] = PluginClientEventArgs[T]>(type: T, handler?: Fn): void
}

export interface PluginClientComponentProps {
  client: PluginClient
  width: number
  height: number
}

declare global {
  function getVRKitPluginClient(): PluginClient
}
