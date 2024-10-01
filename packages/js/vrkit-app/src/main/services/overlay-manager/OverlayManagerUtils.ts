import { OverlayInfo, OverlayKind } from "vrkit-models"
import { OverlayBrowserWindowKind } from "./OverlayBrowserWindow"
import { asOption } from "@3fv/prelude-ts"
import { isNumber,isString } from "@3fv/guard"


export function overlayInfoToComponentId(overlayInfo: OverlayInfo): string
export function overlayInfoToComponentId(id: string, kind: OverlayBrowserWindowKind): string
export function overlayInfoToComponentId(idOrInfo: OverlayInfo | string, kindArg?: OverlayBrowserWindowKind ): string {
  let [id, kind] = isString(idOrInfo) ? [idOrInfo, kindArg] : asOption(idOrInfo as OverlayInfo)
      .map(overlayInfo => [overlayInfo.id, isNumber(overlayInfo.kind) ? OverlayKind[overlayInfo.kind] : overlayInfo.kind])
      .getOrThrow()
  return `overlay-${id}-${kind}`
}
