import { defaults } from "vrkit-app-common/utils"
import type { ActionDef } from "../../services/actions"
import { createSimpleSchema, custom, primitive } from "serializr"
import { toJS } from "mobx" // ------ OverlayManager events & types

// ------ OverlayManager events & types

// import type { DashboardConfig } from "vrkit-models"

export interface ActionsState {
  actions: Record<string, ActionDef>
}

export function newActionsState(state: Partial<ActionsState> = {}): ActionsState {
  return defaults({...state},{
    actions: {}
  }) as ActionsState
}

export const ActionsStateSchema = createSimpleSchema<ActionsState>({
  actions: custom(v => toJS(v), v => v)
})

