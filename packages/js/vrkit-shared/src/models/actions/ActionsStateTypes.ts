import { defaults } from "../../utils"
import type { ActionDef } from "../../services/actions"
import { createSimpleSchema, custom, list, primitive } from "serializr"
import { toJS } from "mobx" // ------ OverlayManager events & types

// ------ OverlayManager events & types

// import type { DashboardConfig } from "@vrkit-platform/models"

export interface ActionsState {
  actions: Record<string, ActionDef>
  enabledGlobalIds: string[]
}

export function newActionsState(state: Partial<ActionsState> = {}): ActionsState {
  return defaults({...state},{
    actions: {},
    enabledGlobalIds: []
  }) as ActionsState
}

export const ActionsStateSchema = createSimpleSchema<ActionsState>({
  actions: custom(v => toJS(v), v => v),
  enabledGlobalIds: list(primitive())
})

