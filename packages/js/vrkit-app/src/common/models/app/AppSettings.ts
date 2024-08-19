import type { ThemeId } from "./theme"
import { createSimpleSchema, primitive, raw } from "serializr"


export interface AppSettings {
  customAccelerators: Record<string, string>
  theme: ThemeId
  zoomFactor: number
}

export const appSettingsSchema = createSimpleSchema<AppSettings>({
  customAccelerators: raw(),
  theme: primitive(),
  zoomFactor: primitive()
})
