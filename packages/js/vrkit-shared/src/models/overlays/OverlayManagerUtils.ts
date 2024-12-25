import { OverlayInfo, OverlayKind } from "@vrkit-platform/models"
import { asOption } from "@3fv/prelude-ts"
import { isString } from "@3fv/guard"
import { assert, EnumValueToName } from "../../utils"
import { uniq } from "lodash"

export enum OverlayBrowserWindowType {
  SCREEN = "SCREEN",
  VR = "VR"
}

export type OverlayBrowserWindowTypeName = OverlayBrowserWindowType | `${OverlayBrowserWindowType}`
export const OverlayBrowserWindowTypeNames = uniq(Object.values(OverlayBrowserWindowType)) as OverlayBrowserWindowTypeName[]

export const OverlayIdPrefix = "overlay"
export const OverlayIdSeparator = "::"

export function isValidOverlayIdKind(idKind: string) {
  return idKind.startsWith(OverlayIdPrefix + OverlayIdSeparator)
}

export function assertIsValidOverlayIdKind(uniqueId: string) {
  assert(isValidOverlayIdKind(uniqueId), `Invalid id kind (component or unique) ${uniqueId}`)
  return uniqueId
}

export function isValidOverlayUniqueId(uniqueId: string) {
  return isValidOverlayIdKind(uniqueId) && OverlayBrowserWindowTypeNames.some(name => uniqueId.endsWith(name))
}

export function assertIsValidOverlayUniqueId(uniqueId: string) {
  assert(isValidOverlayUniqueId(uniqueId), `Invalid uniqueId ${uniqueId}`)
  return uniqueId
}

export function overlayInfoToComponentId(overlayInfo: OverlayInfo): string
export function overlayInfoToComponentId(id: string, kind: OverlayKind): string
export function overlayInfoToComponentId(idOrInfo: OverlayInfo | string, kind?: OverlayKind): string {
  const parts: string[] = isString(idOrInfo)
    ? [idOrInfo, EnumValueToName(OverlayKind, kind)]
    : asOption(idOrInfo as OverlayInfo)
        .map(overlayInfo => [overlayInfo.id, EnumValueToName(OverlayKind, overlayInfo.kind)])
        .getOrThrow()

  if (parts[0] !== OverlayIdPrefix) parts.unshift(OverlayIdPrefix)
  return assertIsValidOverlayIdKind(parts.join(OverlayIdSeparator))
}

export function overlayInfoToUniqueId(overlayInfo: OverlayInfo, windowKind: OverlayBrowserWindowType): string
export function overlayInfoToUniqueId(
  idOrComponentId: string,
  windowKind: OverlayBrowserWindowType,
  kind: OverlayKind
): string
export function overlayInfoToUniqueId(
  idOrComponentIdOrInfo: OverlayInfo | string,
  windowKind: OverlayBrowserWindowType,
  kind?: OverlayKind
): string {
  const parts: string[] = isString(idOrComponentIdOrInfo)
    ? [...idOrComponentIdOrInfo.split(OverlayIdSeparator), EnumValueToName(OverlayKind, kind), windowKind]
    : asOption(idOrComponentIdOrInfo as OverlayInfo)
        .map(overlayInfo => [overlayInfo.id, EnumValueToName(OverlayKind, overlayInfo.kind), windowKind])
        .getOrThrow()
  if (parts[0] !== OverlayIdPrefix) parts.unshift(OverlayIdPrefix)
  return assertIsValidOverlayIdKind(parts.join(OverlayIdSeparator))
}
