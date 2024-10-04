import { toPlainObject } from "lodash"
import {
  createSimpleSchema, custom, list, map, object, primitive, raw
} from "serializr"
import type { ISharedAppState } from "./SharedAppState"
import type { DashboardsState } from "../dashboards"
import { Identity } from "../../utils"

import {
  AppSettings, DashboardConfig, OverlayConfig, SessionData, SessionTiming
} from "vrkit-models"
import type { SessionDetail, SessionsState } from "../sessions"
import { toJS } from "mobx"
import { OverlaysStateSchema } from "../overlays"




export const AppSettingsSchema = createSimpleSchema<AppSettings>({
  themeType: primitive(),
  zoomFactor: primitive(),
  autoconnect: primitive(),
  defaultDashboardConfigId: primitive(),
  customAccelerators: map(primitive())
})


export const SessionDetailSchema = createSimpleSchema<SessionDetail>({
  id: primitive(),
  type: primitive(),
  filePath: primitive(),
  isAvailable: primitive(),
  info: custom(v =>
      toJS(v),
          v => v
  ),
  data: custom(v => !v ? {} :
      SessionData.toJson(toJS(v)),
          v => !v ? {} : SessionData.fromJson(v)),
  timing: custom(v => !v ? {} :
      SessionTiming.create(toJS(v)),
          v => !v ? {} : SessionTiming.create(v)),
})

export const SessionsStateSchema = createSimpleSchema<SessionsState>({
  activeSessionId: primitive(),
  activeSessionType: primitive(),
  liveSession: object(SessionDetailSchema),
  diskSession: object(SessionDetailSchema),
  // componentDataVars: raw()
  
})

export const DashboardsStateSchema = createSimpleSchema<DashboardsState>({
  configs: list(custom(v => DashboardConfig.toJson(v), v => DashboardConfig.fromJson(v))),
  activeConfigId: primitive()
})

export const SharedAppStateSchema = createSimpleSchema<ISharedAppState>({
  appSettings: object(AppSettingsSchema),
  dashboards: object(DashboardsStateSchema),
  sessions: object(SessionsStateSchema),
  overlays: object(OverlaysStateSchema),
  devSettings: custom(toPlainObject, Identity),
})
