import { PositionF, PositionI, RectF, RectI } from "vrkit-models"
import type Electron from "electron"
import { getLogger } from "@3fv/logger-proxy"
import { asOption } from "@3fv/prelude-ts"
const log = getLogger(__filename)

export function electronRectangleToRectI(rect: Electron.Rectangle): RectI {
  return asOption(rect).map(({ x, y, width, height }) =>
    RectI.create({
      position: { x, y },
      size: {width, height}
    })
  ).getOrNull()
}

export class RectangleLayoutTool<
  R extends RectI | RectF,
  P extends PositionI | PositionF = R["position"]
> extends Array<RectangleLayoutTool.Rectangle> {
  static calculateDistance(x1: number, y1: number, x2: number, y2: number): number {
    return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2))
  }

  readonly increment: number

  readonly positionType: typeof PositionI | typeof PositionF

  readonly preferredPosition: R["position"]

  get centerPosition() {
    return this.positionType.create({
      x: this.position.x + (this.totalWidth / 2.0),
      y: this.position.y + (this.totalHeight / 2.0)
    })
  }

  get position() {
    return this.rect.position
  }

  get totalSize() {
    return this.rect.size
  }

  get totalWidth() {
    return this.rect.size.width
  }

  get totalHeight() {
    return this.rect.size.height
  }

  /**
   * Constructor for initializing the object.
   *
   * @param {RectI | RectF} rect - The containing rectangle of all member
   *     rects.
   * @param {boolean} isFloating - A flag to indicate whether `integral` or
   *     `floating` values should be used.
   * @param {PositionI | PositionF} [preferredPosition=null] - The preferred
   *     position optionally provided; default is null.
   */
  constructor(
    readonly rect: R,
    readonly isFloating: boolean,
    preferredPosition: R["position"] = null
  ) {
    super()

    this.increment = this.isFloating ? 0.1 : 1
    this.positionType = this.isFloating ? PositionF : PositionI
    this.preferredPosition = asOption(preferredPosition).getOrElse(this.centerPosition)
  }

  /**
   * Find the position closest to the anchor that
   * does not intersect with any other rectangle
   * in the `RectangleLayoutTool`
   *
   * @param targetWidth
   * @param targetHeight
   */
  findPositionClosestToAnchor(targetWidth: number, targetHeight: number): P {
    const { x: anchorX, y: anchorY } = this.preferredPosition

    const pointsToCheck: RectangleLayoutTool.MeasuredPoint<P>[] = []
    for (let i = 0.0; i <= this.totalWidth - targetWidth; i += this.increment) {
      for (let j = 0.0; j <= this.totalHeight - targetHeight; j += this.increment) {
        const x = this.position.x + i,
            y = this.position.y + j
        
        const distance = RectangleLayoutTool.calculateDistance(
          x + (targetWidth / 2.0),
          y + (targetHeight / 2.0),
          anchorX,
          anchorY
        )
        pointsToCheck.push({
          position: { x, y } as P,
          distanceToCenter: distance
        })
      }
    }

    pointsToCheck.sort((a, b) => a.distanceToCenter - b.distanceToCenter)

    for (const point of pointsToCheck) {
      const newRect = new RectangleLayoutTool.Rectangle(point.position.x, point.position.y, targetWidth, targetHeight)

      if (!this.some(shape => newRect.intersects(shape))) {
        const adjustedPoint = this.positionType.create({
          x: point.position.x,
          y: point.position.y
        }) as P

        log.info(`Optimal position is`, this.positionType.toJson(adjustedPoint))
        return adjustedPoint
      }
    }

    return null // No available space found
  }
}

export namespace RectangleLayoutTool {
  export interface MeasuredPoint<P extends PositionI | PositionF> {
    position: P

    distanceToCenter?: number
  }

  export class Rectangle {
    x: number

    y: number

    width: number

    height: number

    constructor(x: number, y: number, width: number, height: number) {
      this.x = x
      this.y = y
      this.width = width
      this.height = height
    }

    intersects(other: Rectangle): boolean {
      return !(
        this.x + this.width <= other.x ||
        other.x + other.width <= this.x ||
        this.y + this.height <= other.y ||
        other.y + other.height <= this.y
      )
    }

    containsPoint(px: number, py: number): boolean {
      return px >= this.x && px < this.x + this.width && py >= this.y && py < this.y + this.height
    }
  }
}
