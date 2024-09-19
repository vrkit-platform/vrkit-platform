import { createSimpleSchema } from "serializr"
import type { ISharedAppState } from "vrkit-app-common/models"
import type { NativeImageSeqSettings } from "vrkit-app-main/utils"


export interface DevSettings {
  imageSequenceCapture: NativeImageSeqSettings | false
}

export const mainSharedAppStateSchema = createSimpleSchema<ISharedAppState>({
  // theme: primitive(),
  // zoomFactor: primitive()
})
