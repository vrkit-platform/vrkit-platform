import { isPlainObject, omit } from "lodash"
import { createSimpleSchema, custom, list, ModelSchema, object, primitive } from "serializr"
import type { ISharedAppState } from "./SharedAppState"
import type { DashboardsState } from "../dashboards"
import { Identity } from "../../utils"

import { AppSettings, DashboardConfig, SessionData } from "vrkit-models"
import type { SessionDetail, SessionsState } from "../sessions"
import { toJS } from "mobx"
import { OverlaysStateSchema } from "../overlays"
import { ActionsStateSchema } from "../actions"
import { PluginsStateSchema } from "../plugins"
import { isFunction } from "@3fv/guard"

// export const AppSettingsSchema = createSimpleSchema<AppSettings>({
//   themeType: primitive(),
//   zoomFactor: primitive(),
//   autoconnect: primitive(),
//   defaultDashboardConfigId: primitive(),
//   openDashboardOnLaunch: primitive(),
//   customAccelerators: map(primitive())
// })

export const AppSettingsSchema = custom(
  v => AppSettings.toJson(v),
  v => AppSettings.fromJson(v)
)

export const SessionDetailSchema = createSimpleSchema<SessionDetail>({
  id: primitive(),
  type: primitive(),
  filePath: primitive(),
  isAvailable: primitive(),
  info: custom(
    v => toJS(v),
    v => v
  ),
  data: custom(
    v => (!v ? {} : SessionData.toJson(toJS(v))),
    v => (!v ? {} : SessionData.fromJson(v))
  ),
  timeAndDuration: custom(
    v => toJS(!v ? {} : isPlainObject(v) ? v : omit(toJS(v), ["sampleIndex", "currentTimeMillis"])),
    v => toJS(!v ? {} : isPlainObject(v) ? v : omit(toJS(v), ["sampleIndex", "currentTimeMillis"]))
  )
})

export const SessionsStateSchema = createSimpleSchema<SessionsState>({
  activeSessionId: primitive(),
  activeSessionType: primitive(),
  liveSession: object(SessionDetailSchema),
  diskSession: object(SessionDetailSchema)
})

export const DashboardsStateSchema = createSimpleSchema<DashboardsState>({
  configs: list(
    custom(
      v => DashboardConfig.toJson(v),
      v => DashboardConfig.fromJson(v)
    )
  ),
  activeConfigId: primitive()
})

export const SharedAppStateSchema = createSimpleSchema<ISharedAppState>({
  appSettings: AppSettingsSchema,
  devSettings: custom(v => toJS(v), Identity),
  plugins: object(PluginsStateSchema),
  dashboards: object(DashboardsStateSchema),
  sessions: object(SessionsStateSchema),
  overlays: object(OverlaysStateSchema),
  actions: object(ActionsStateSchema)
})

export interface IValueSchema {
  serialize(v: any): any

  deserialize(v: any): any
}

export function isValueSchema(schema: any): schema is IValueSchema {
  return isFunction(schema?.serialize) && isFunction(schema?.deserialize)
}

export function createValueSchema<T = any>(serialize: (v: T) => any, deserialize: (v: any) => T) {
  return {
    serialize,
    deserialize
  }
}

export type ISharedAppStateLeaf = keyof ISharedAppState
export const SharedAppStateLeafSchemas: Record<ISharedAppStateLeaf, ModelSchema<any> | IValueSchema> = {
  appSettings: createValueSchema(
    v => AppSettings.toJson(v),
    v => AppSettings.fromJson(v)
  ),
  devSettings: createValueSchema(toJS, v => v),
  plugins: PluginsStateSchema,
  dashboards: DashboardsStateSchema,
  sessions: SessionsStateSchema,
  overlays: OverlaysStateSchema,
  actions: ActionsStateSchema
}
