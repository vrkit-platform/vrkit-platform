export enum GlobalActionId {
  // TOGGLE EDIT MODE ENABLED WHENEVER A DASHBOARD IS OPEN
  toggleOverlayEditor =  "toggleOverlayEditor",
  
  // IN EDIT MODE - THESE ARE ACTIVE
  switchOverlayVREditorInfoAnchor = "switchOverlayVREditorInfoAnchor",
  switchOverlayScreenEditorInfoAnchor = "switchOverlayScreenEditorInfoAnchor",
  switchOverlayFocusNext =  "switchOverlayFocusNext",
  switchOverlayFocusPrevious =  "switchOverlayFocusPrevious",
  
  // TOGGLE X / Y / WIDTH / HEIGHT TARGET PROP
  toggleOverlayPlacementProp =  "toggleOverlayPlacementProp",
  incrementOverlayPlacementProp =  "incrementOverlayPlacementProp",
  decrementOverlayPlacementProp =  "decrementOverlayPlacementProp",
  
}



export type GlobalActionIdName = `${GlobalActionId}` | GlobalActionId


export const OverlayEditorGlobalActionIds = Array<GlobalActionIdName>(
    // TOGGLE EDIT MODE ENABLED WHENEVER A DASHBOARD IS OPEN
    GlobalActionId.toggleOverlayEditor,
    
    // IN EDIT MODE - THESE ARE ACTIVE
    GlobalActionId.switchOverlayVREditorInfoAnchor,
    GlobalActionId.switchOverlayScreenEditorInfoAnchor,
    
    GlobalActionId.switchOverlayFocusNext,
    GlobalActionId.switchOverlayFocusPrevious,
    
    // TOGGLE X / Y / WIDTH / HEIGHT TARGET PROP
    GlobalActionId.toggleOverlayPlacementProp,
    GlobalActionId.incrementOverlayPlacementProp,
    GlobalActionId.decrementOverlayPlacementProp
)