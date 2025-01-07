import { PositionI, SizeF, SizeI } from "@vrkit-platform/models"
import { defaults, isEqual } from "../ObjectUtil"
import { pick } from "lodash"

export type SizeKind = SizeI | SizeF | {width: number, height: number}

export function toSize(size: SizeKind): SizeKind {
  return pick(size, ["width", "height"])
}

export function hasEqualSize(s1: SizeKind, s2: SizeKind): boolean {
  return isEqual(toSize(s1), toSize(s2))
}

export const isEqualSize = hasEqualSize

export function toSizeI(size: SizeKind) {
  defaults(size, {
    width: 0,
    height: 0
  })
  return SizeI.create({
    width: Math.floor(size.width),
    height: Math.floor(size.height)
  })
}

export function toPositionI(pos: {x:number, y: number}) {
  defaults(pos, {
    x: 0,
    y: 0
  })
  return PositionI.create({
    x: Math.floor(pos.x),
    y: Math.floor(pos.y)
  })
}