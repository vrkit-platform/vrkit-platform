import { isString } from "@3fv/guard"
import { createSimpleSchema, primitive } from "serializr"


export enum DesktopWindowType {
  normal = "normal",
  settings = "settings"
}

export type DesktopWindowTypeKind = DesktopWindowType | `${DesktopWindowType}`

export function isDesktopWindowKind(o: any): o is DesktopWindowTypeKind {
  return isString(o) && !!DesktopWindowType[o]
}


export interface DesktopWindowConfig {
  id: string
  url: string
  label: string
  type: DesktopWindowTypeKind
}

export const desktopWindowConfigSchema = createSimpleSchema<DesktopWindowConfig>({
  id: primitive(),
  url: primitive(),
  label: primitive(),
  type: primitive()
})