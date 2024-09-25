import { toPlainObject } from "lodash"
import {
  createSimpleSchema, custom, list, map, object, primitive, raw
} from "serializr"
import type { ISharedAppState } from "vrkit-app-common/models"
import type { OverlayManagerState } from "vrkit-app-common/models"
import { Identity } from "vrkit-app-common/utils"

import { AppSettings, DashboardConfig } from "vrkit-models"



export const AppSettingsSchema = createSimpleSchema<AppSettings>({
  themeType: primitive(),
  zoomFactor: primitive(),
  autoconnect: primitive(),
  activeDashboardId: primitive(),
  customAccelerators: map(primitive())
})


export const OverlayManagerStateSchema = createSimpleSchema<OverlayManagerState>({
  configs: list(custom(v => DashboardConfig.toJson(v), v => DashboardConfig.fromJson(v))),
  activeSessionId: primitive()
})

export const MainSharedAppStateSchema = createSimpleSchema<ISharedAppState>({
  appSettings: object(AppSettingsSchema),
  overlayManager: object(OverlayManagerStateSchema),
  overlayMode: primitive(),
  devSettings: custom(toPlainObject, Identity),
})
