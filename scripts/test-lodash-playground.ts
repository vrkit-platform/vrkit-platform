
import { endsWith } from "lodash/fp"
import { uniq } from "lodash"


export enum OverlayBrowserWindowType {
  SCREEN = "SCREEN",
  VR = "VR"
}

export type OverlayBrowserWindowTypeName = OverlayBrowserWindowType | `${OverlayBrowserWindowType}`
export const OverlayBrowserWindowTypeNames = uniq(Object.values(OverlayBrowserWindowType)) as OverlayBrowserWindowTypeName[]

console.log(OverlayBrowserWindowTypeNames.some(endsWith("overlay1::VR")))