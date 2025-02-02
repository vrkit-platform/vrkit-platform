import { getLogger } from "@3fv/logger-proxy"
import {
  PositionI,
  RectF,
  RectI,
  SizeF,
  SizeI,
  VRLayout,
  VRPose
} from "@vrkit-platform/models"

const log = getLogger(__filename)

export const VRLayoutScreenDimension = 2048
export const VRLayoutMaxWidgets = 8
export const VRLayoutBoundsDiameter = 2
export const VRLayoutBoundsRadius = VRLayoutBoundsDiameter / 2

export const VRLayoutBounds = SizeF.create({
  width: VRLayoutBoundsDiameter,
  height: VRLayoutBoundsDiameter,
})

export const VRScreenSize = SizeI.create({
  width: VRLayoutBoundsDiameter,
  height: VRLayoutBoundsDiameter,
})

export function ConvertVRSizeToScreenRect(vrSize:SizeF | SizeI):RectI {
  const vrScreenScale = VRLayoutScreenDimension / VRLayoutBoundsDiameter
  
  return RectI.create({
    size: {
      width: Math.round(vrSize.width * vrScreenScale),
      height: Math.round(vrSize.height * vrScreenScale)
    },
    position: {
      x: 0,
      y: 0
    }
  })
}

export function ConvertScreenRectToVRLayout(surfaceSize: SizeI, screenRect: RectI): VRLayout {
  const scale = Math.min(surfaceSize.width, surfaceSize.height) / VRLayoutBoundsDiameter,
      vrSize = SizeF.create({
        width: screenRect.size.width / scale,
        height: screenRect.size.height / scale
      }),
      vrPose = VRPose.create({
        x: (screenRect.position.x / scale) - VRLayoutBoundsRadius + (vrSize.width / 2),
        eyeY: (-1 * ((screenRect.position.y / scale) - VRLayoutBoundsRadius)) - (vrSize.height / 2),
        z: -1
      }),
      
      vrLayout = VRLayout.create({
        pose: vrPose,
        size: vrSize,
        screenRect: ConvertVRSizeToScreenRect(vrSize)
      })
  
  if (log.isDebugEnabled())
    log.debug(`Converted screen rect`, screenRect, "to VR layout", vrLayout)
  
  return vrLayout
}

export function ConvertVRLayoutToScreenRect(surfaceSize: SizeI, vrLayout: VRLayout) {
  const
      scale = Math.min(surfaceSize.width,surfaceSize.height) / VRLayoutBoundsDiameter,
      screenSize = SizeI.create({
        width: Math.round(vrLayout.size.width * scale),
        height: Math.round(vrLayout.size.height * scale),
      }),
      // VR Pose is the center of the surface/texture
      // We scale and calculate the correct offset here
      screenPos = PositionI.create({
        x: (vrLayout.pose.x + VRLayoutBoundsRadius - (vrLayout.size.width / 2)) * scale,
        y: ((-1 * vrLayout.pose.eyeY) + VRLayoutBoundsRadius - (vrLayout.size.height / 2)) * scale,
      }),
      screenRect = RectI.create({
        size: screenSize,
        position: screenPos
      })
  
  if (log.isDebugEnabled())
    log.debug(`Converted VRLayout`, vrLayout, "to screen rect", screenRect)
  
  return screenRect
}

export function getEditorItemSurfaceRectFromVRLayout(surfaceBounds: RectI, vrLayout: VRLayout): RectI {

  return null
}