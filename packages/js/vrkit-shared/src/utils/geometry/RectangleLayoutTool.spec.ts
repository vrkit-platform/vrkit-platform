import "jest"
import { PositionF, PositionI, RectF, RectI } from "vrkit-models"
import { RectangleLayoutTool } from "./RectangleLayoutTool"

describe("RectangleLayoutTool", () => {
  const screenRect: RectI = {
    position: { x: 0, y: 0 },
    size: { width: 100, height: 100 }
  }
  
  const vrRect: RectF = {
    position: { x: -1.0, y: -1.0 },
    size: { width: 2.0, height: 2.0 }
  }
  
  const vrShapes = [[-0.2,-0.2, 0.4, 0.4]]
      .map(([x,y,w,h]) => new RectangleLayoutTool.Rectangle(x,y,w,h))
  
  
  it("should find the optimal position closest to the anchor", () => {
    const tool = new RectangleLayoutTool<RectI>(screenRect, false, { x: 50, y: 50 })
    const result = tool.findPositionClosestToAnchor(10, 10)
    expect(result).toBeTruthy()
    expect(result.x).toBeGreaterThanOrEqual(0)
    expect(result.y).toBeGreaterThanOrEqual(0)
    expect(result.x).toBeLessThanOrEqual(tool.totalWidth - 10)
    expect(result.y).toBeLessThanOrEqual(tool.totalHeight - 10)
  })
  
  it("should avoid other windows using floating point mathmatics", () => {
    const tool = new RectangleLayoutTool<RectF>(vrRect, true, { x: 0.0, y: 0.0 })
    const res1 = tool.findPositionClosestToAnchor(1.0,1.0)
    expect(res1.x).toBe(-0.5)
    expect(res1.y).toBe(-0.5)
    
    tool.push(...vrShapes)
    const res2 = tool.findPositionClosestToAnchor(1.0,1.0)
    console.log(`Res2`, res2)
    expect(res2).toBeNull()
    
    const res3 = tool.findPositionClosestToAnchor(0.5,0.5)
    console.log(`Res3`, res3)
    expect(res3.x).not.toBe(-0.5)
    expect(res3.y).not.toBe(-0.5)
    
  })
  
  // it("should return null if no position is found", () => {
  //   for (let i = 0; i <= 90; i += 10) {
  //     tool.push(new RectangleLayoutTool.Rectangle(i, i, 10, 10))
  //   }
  //   const result = tool.findPositionClosestToAnchor(10, 10)
  //   console.log(`result`, result)
  //   expect(result).toBeNull()
  // })
  //
  it("should sort points by distance to center", () => {
    const tool = new RectangleLayoutTool<RectI>(screenRect, false, { x: 50, y: 50 })
    const points = [
      { position: { x: 10, y: 10 }, distanceToCenter: 10 },
      { position: { x: 5, y: 5 }, distanceToCenter: 5 }
    ]
    points.sort((a, b) => a.distanceToCenter - b.distanceToCenter)
    expect(points[0].distanceToCenter).toBe(5)
    expect(points[1].distanceToCenter).toBe(10)
  })
  
  it("should calculate the distance correctly", () => {
    const tool = new RectangleLayoutTool<RectI>(screenRect, false, { x: 50, y: 50 })
    const distance = RectangleLayoutTool.calculateDistance(0, 0, 3, 4)
    expect(distance).toBe(5) // 3-4-5 triangle
  })
  
  // Add more tests as necessary for different behaviours
})
