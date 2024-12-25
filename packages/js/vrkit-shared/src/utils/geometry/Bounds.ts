import { asOption } from "@3fv/prelude-ts"
import { RectF, RectI } from "@vrkit-platform/models"
import { isDefined, isNumber } from "@3fv/guard"
import { greaterThan } from "../fp"

export interface DimensionSize {
  width: number

  height: number
}

export const DimensionSizeProps = Array<keyof DimensionSize>("width", "height")
export type DimensionSizeValues = [width: DimensionSize["width"], height: DimensionSize["height"]]

export const sizeToValues = (size: DimensionSize) => DimensionSizeProps.map(prop => size[prop]) as DimensionSizeValues

export interface Position {
  x: number

  y: number
}

export interface Bounds extends DimensionSize, Position {}

export type BoundAsQuad = [width: number, height: number, x: number, y: number]

export const boundsToQuad = (bounds: Bounds) =>
  Array<keyof Bounds>("width", "height", "x", "y").map(prop => bounds[prop]) as BoundAsQuad

export const boundsToChromeArgs = (bounds: Bounds) =>
  asOption(bounds)
    .map(({ width, height, x, y }) => [`--window-position=${x},${y}`, `--window-size=${width},${height + 40}`])
    .getOrThrow()

export function isPointInRect(p: Electron.Point, rect: Electron.Rectangle) {
  const { x, y, width, height } = rect
  return p.x >= x && p.x <= x + width && p.y >= y && p.y <= y + height
}


export function isRectValid(rect: RectI | RectF): boolean  {
  return asOption(rect)
      .filter(isDefined)
      .map(({size, position}) => size && position && [...Object.values(size), ...Object.values(position)].every(isNumber) && Object.values(size).every(greaterThan(0)))
      .getOrElse(false)
}