import { SizeF, SizeI } from "@vrkit-platform/models"
import { isEqual } from "../ObjectUtil"
import { pick } from "lodash"

export type SizeKind = SizeI | SizeF | {width: number, height: number}

export function toSize(size: SizeKind): SizeKind {
  return pick(size, ["width", "height"])
}

export function hasEqualSize(s1: SizeKind, s2: SizeKind): boolean {
  return isEqual(toSize(s1), toSize(s2))
}

export const isEqualSize = hasEqualSize