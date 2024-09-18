import { createSimpleSchema, primitive } from "serializr"
import type { ISharedAppState } from "vrkit-app-common/models"

export const sharedAppStateSchema = createSimpleSchema<ISharedAppState>({
  theme: primitive(),
  zoomFactor: primitive()
})
