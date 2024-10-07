import { RectangleLayoutTool } from "../../../common/utils"
import { PositionI, RectF, RectI } from "vrkit-models"
import { screen } from "electron"
import { asOption } from "@3fv/prelude-ts"
import { flow } from "lodash"

export function getVRRectangleLayoutTool() {
  return new RectangleLayoutTool(RectF.create({
    position: {
      x: -1.0,
      y: -1.0
    },
    size: {
      width: 2.0,
      height: 2.0,
    }
  }), true)
}

export function getAllDisplaysScreenRect(): RectI {
  let minX = 0, maxX = 0, minY = 0, maxY = 0
  screen.getAllDisplays().forEach((display) => {
    const bounds = display.bounds
    minX = Math.min(bounds.x, minX)
    maxX = Math.max(bounds.x + bounds.width, maxX)
    minY = Math.min(bounds.y, minY)
    maxY = Math.max(bounds.y + bounds.height, maxY)
  })
  
  return RectI.create({
    position: {x: minX, y: minY},
    size: {
      width: maxX - minX,
      height: maxY - minY
    }
  })
}

export function getScreenDisplayCenter(display: Electron.Display = screen.getPrimaryDisplay()): PositionI {
  return asOption(screen.getPrimaryDisplay())
      .map(display => display.bounds)
      .map(({x,y,width,height}) => PositionI.create({
        x: Math.floor((x + width) / 2),
        y: Math.floor((y+ height) / 2)
      })).getOrThrow()
}

export function getScreenRectangleLayoutTool() {
  
  const
      rect = getAllDisplaysScreenRect(),
      anchorPosition = flow(({x,y}) => PositionI.create({
        x,//: Math.abs(Math.min(0,rect.position.x)) + x,
        y//: Math.abs(Math.min(0,rect.position.y)) + y,
      }))(getScreenDisplayCenter())
      
      
  
  return new RectangleLayoutTool(rect, false, anchorPosition as PositionI)
  
}

