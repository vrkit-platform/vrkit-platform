import { createSimpleSchema, custom, map, primitive, raw } from "serializr"
import { ThemeId } from "vrkit-app-common/models"

export const mainAppStateSchema = createSimpleSchema<IMainAppState>({
  theme: primitive(),
  zoomFactor: primitive()
})

export interface IMainAppState {
  theme: ThemeId
  zoomFactor: number
}
