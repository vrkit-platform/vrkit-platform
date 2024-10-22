import { assign, Pair, RectangleLayoutTool } from "vrkit-shared"
import {
  OverlayAnchor, PositionF, PositionI, RectF, RectI, SizeF, SizeI
} from "vrkit-models"
import { screen } from "electron"
import { asOption } from "@3fv/prelude-ts"
import { flow } from "lodash"
import { match } from "ts-pattern"

const VRPerEyeDefaultDimension = 1
export const MaxOverlayWindowDimension = 2048
export const MaxOverlayWindowDimensionPadding = 256

export const MinOverlayWindowDimension = 32

export function GetAnchorPosition(anchor: OverlayAnchor, rect: RectF | RectI) {
  const [widthPercent, heightPercent] = match(anchor)
    .with(OverlayAnchor.CENTER, () => [0.5, 0.5])
    .with(OverlayAnchor.TOP_LEFT, () => [0.25, 0.25])
    .with(OverlayAnchor.TOP_RIGHT, () => [0.75, 0.25])
    .with(OverlayAnchor.BOTTOM_RIGHT, () => [0.75, 0.75])
    .with(OverlayAnchor.BOTTOM_LEFT, () => [0.25, 0.75])
    .run() as Pair<number, number>

  return {
    x: rect.position.x + (widthPercent * rect.size.width),
    y: rect.position.y + (heightPercent * rect.size.height)
  }
}

export interface RectangleToolOptions {
  anchor: OverlayAnchor

  dimension?: number
}

export type ScreenRectangleToolOptions = Omit<RectangleToolOptions, "dimension">

const RectangleToolDefaults: RectangleToolOptions = {
  anchor: OverlayAnchor.CENTER
}

const VRRectangleToolDefaults: RectangleToolOptions = {
  dimension: VRPerEyeDefaultDimension,
  ...RectangleToolDefaults
}

export function getVRRectangleLayoutTool(options: Partial<RectangleToolOptions> = {}) {
  const { dimension, anchor } = assign({ ...VRRectangleToolDefaults }, options),
    originOffset = 0 - dimension / 2,
    rect = RectF.create({
      position: {
        x: originOffset * 2,
        y: originOffset
      },
      size: {
        width: dimension * 2,
        height: dimension
      }
    })
  return new RectangleLayoutTool(rect, true, PositionF.create(GetAnchorPosition(anchor, rect)))
}

export function getAllDisplaysScreenRect(): RectI {
  let minX = 0,
    maxX = 0,
    minY = 0,
    maxY = 0
  screen.getAllDisplays().forEach(display => {
    const bounds = display.bounds
    minX = Math.min(bounds.x, minX)
    maxX = Math.max(bounds.x + bounds.width, maxX)
    minY = Math.min(bounds.y, minY)
    maxY = Math.max(bounds.y + bounds.height, maxY)
  })

  return RectI.create({
    position: { x: minX, y: minY },
    size: {
      width: maxX - minX,
      height: maxY - minY
    }
  })
}

export function getScreenDisplayAnchorPosition(
  anchor: OverlayAnchor,
  display: Electron.Display = screen.getPrimaryDisplay()
): PositionI {
  return asOption(display)
    .orElse(asOption(screen.getPrimaryDisplay()))
    .map(display => display.bounds)
    .map(({ x, y, width, height }) =>
      PositionI.create(GetAnchorPosition(anchor, {position:{x,y},size:{width,height}}))
    )
    .getOrThrow()
}

export function getScreenRectangleLayoutTool(anchor: OverlayAnchor = OverlayAnchor.CENTER) {
  const rect = getAllDisplaysScreenRect(),
    anchorPosition = flow(({ x, y }) =>
      PositionI.create({
        x, //: Math.abs(Math.min(0,rect.position.x)) + x,
        y //: Math.abs(Math.min(0,rect.position.y)) + y,
      })
    )(getScreenDisplayAnchorPosition(anchor))

  return new RectangleLayoutTool(rect, false, anchorPosition as PositionI)
}

export function isValidOverlayScreenSize(size: Electron.Size | SizeI | SizeF) {
  return size.width && size.height && size.width < MaxOverlayWindowDimension && size.height < MaxOverlayWindowDimension
}

export function adjustScreenRect(rect: RectI | RectF) {
  return asOption(rect)
      .ifSome(rect => {
        assign(rect.size, {
          width: Math.max(Math.min(rect.size.width, MaxOverlayWindowDimension - MaxOverlayWindowDimensionPadding), MinOverlayWindowDimension),
          height: Math.max(Math.min(rect.size.height, MaxOverlayWindowDimension - MaxOverlayWindowDimensionPadding), MinOverlayWindowDimension)
        })
      })
      .getOrThrow()
}