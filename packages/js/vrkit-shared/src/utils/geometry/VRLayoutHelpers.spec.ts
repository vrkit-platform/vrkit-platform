import "jest"
import {
  PositionF, PositionI, RectF, RectI, SizeI, VRLayout
} from "@vrkit-platform/models"
import {
  ConvertScreenRectToVRLayout,
  ConvertVRLayoutToScreenRect,
  VRLayoutBoundsDiameter
} from "./VRLayoutHelpers"

describe("VRLayoutHelpers", () => {
  const kSurfaceSize: SizeI = {
     width: 1024, height: 1024
  }
  const kVRLayout: VRLayout = {
    "pose": {
      "x": 0.0,
      "eyeY": 0.8000000000000002,
      "z": -1
    },
    "size": {
      "width": 0.5,
      "height": 0.06
    },
  }
  
  const kVRLayout2: VRLayout = {
    "pose": {
      "x": -0.5,
      "eyeY": -0.8000,
      "z": -1
    },
    "size": {
      "width": 0.5,
      "height": 0.06
    },
  }
  
  const kVRLayouts = [kVRLayout, kVRLayout2]
  
  // const vrRect: RectF = {
  //   position: { x: -1.0, y: -1.0 },
  //   size: { width: 2.0, height: 2.0 }
  // }
  
  it("should convert VRLayout to screen rect", () => {
    const vrRect = ConvertVRLayoutToScreenRect(kSurfaceSize, kVRLayout)
    expect(vrRect.size.width).toBe(kVRLayout.size.width * (kSurfaceSize.width / VRLayoutBoundsDiameter)) // 3-4-5 triangle
  })
  
  it("should convert VRLayout to screen rect and back to original VRLayout", () => {
    for (const srcVRLayout of kVRLayouts) {
      const screenRect = ConvertVRLayoutToScreenRect(kSurfaceSize, srcVRLayout)
      expect(screenRect.size.width).toBe(srcVRLayout.size.width *
          (
              kSurfaceSize.width / VRLayoutBoundsDiameter
          )) // 3-4-5 triangle
      
      const vrLayout = ConvertScreenRectToVRLayout(kSurfaceSize, screenRect)
      expect(vrLayout).toEqual(srcVRLayout)
    }
  })
  
  
  
  // Add more tests as necessary for different behaviours
})
