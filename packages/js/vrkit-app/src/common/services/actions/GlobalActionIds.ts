export enum GlobalActionId {
  // TOGGLE EDIT MODE ENABLED WHENEVER A DASHBOARD IS OPEN
  toggleOverlayEditor =  "toggleOverlayEditor",
  
  // IN EDIT MODE - THESE ARE ACTIVE
  switchOverlayFocusNext =  "switchOverlayFocusNext",
  switchOverlayFocusPrevious =  "switchOverlayFocusPrevious",
  
  // TOGGLE X / Y / WIDTH / HEIGHT TARGET PROP
  toggleOverlayPlacementProp =  "toggleOverlayPlacementProp",
  incrementOverlayPlacementProp =  "incrementOverlayPlacementProp",
  decrementOverlayPlacementProp =  "decrementOverlayPlacementProp",
  
}

export type GlobalActionIdName = `${GlobalActionId}` | GlobalActionId