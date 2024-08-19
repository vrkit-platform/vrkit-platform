import { asOption } from "@3fv/prelude-ts"

export interface DimensionSize {
  width: number
  height: number
}

export const DimensionSizeProps = Array<
  keyof DimensionSize
>("width", "height")
export type DimensionSizeValues = [
  width: DimensionSize["width"],
  height: DimensionSize["height"]
]

export const sizeToValues = (size: DimensionSize) =>
  DimensionSizeProps.map(
    prop => size[prop]
  ) as DimensionSizeValues

export interface Position {
  x: number
  y: number
}

export interface Bounds extends DimensionSize, Position {}

export type BoundAsQuad = [
  width: number,
  height: number,
  x: number,
  y: number
]

export const boundsToQuad = (bounds: Bounds) =>
  Array<keyof Bounds>("width", "height", "x", "y").map(
    prop => bounds[prop]
  ) as BoundAsQuad

export const boundsToChromeArgs = (bounds: Bounds) =>
  asOption(bounds)
    .map(({ width, height, x, y }) => [
      `--window-position=${x},${y}`,
      `--window-size=${width},${height + 40}`
    ])
    .getOrThrow()
