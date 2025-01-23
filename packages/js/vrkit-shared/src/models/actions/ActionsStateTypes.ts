import { defaults } from "../../utils"
import type { ActionDef } from "../../services/actions"
import { createSimpleSchema, custom, list, primitive } from "serializr"
import { toJS } from "mobx" // ------ OverlayManager events & types

// ------ OverlayManager events & types

// import type { DashboardConfig } from "@vrkit-platform/models"

export interface ActionsState {
  /**
   * Property used when capturing a new shortcut.
   * This should disable any global shortcut registrations temporarily
   */
  captureKeyboardEnabled: boolean
  actions: Record<string, ActionDef>
  enabledGlobalIds: string[]
  enabledAppIds: string[]
}

export function newActionsState(state: Partial<ActionsState> = {}): ActionsState {
  return defaults({...state},{
    captureKeyboardEnabled: false,
    actions: {},
    enabledGlobalIds: [],
    enabledAppIds: []
  }) as ActionsState
}

export const ActionsStateSchema = createSimpleSchema<ActionsState>({
  captureKeyboardEnabled: primitive(),
  actions: custom(v => toJS(v), v => v),
  enabledGlobalIds: list(primitive()),
  enabledAppIds: list(primitive())
})

