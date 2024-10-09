import { Pair, pairOf } from "vrkit-app-common/utils"
import type { OverlayEditorController } from "./OverlayEditorController"
import { ActionExecutor } from "vrkit-app-common/services"
import { asOption } from "@3fv/prelude-ts"
import { getService } from "../../ServiceContainer"
import type OverlayManager from "./OverlayManager"

export type EditorExecuteActionFn = ([om, editor]:Pair<OverlayManager, OverlayEditorController>) => void

export function editorExecuteAction(actionFn:EditorExecuteActionFn): ActionExecutor {
  return () => {
    const OverlayManager = require("./OverlayManager").OverlayManager
    asOption(getService(OverlayManager) as OverlayManager)
        .map(om => pairOf(om, om.editorController))
        .ifSome(actionFn)
  }
}
