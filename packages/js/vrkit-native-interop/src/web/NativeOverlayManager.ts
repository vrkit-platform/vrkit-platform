import type { RectF, RectI, SizeI, VRLayout } from "@vrkit-platform/models"
import { GetNativeExports, IsNativeOverlaySupported } from "./NativeBinding"

export interface NativeOverlayWindowResourceInfo {
  windowId: number
  overlayId: string
  size: SizeI
}

export interface NativeOverlayManager {
  createOrUpdateResources(overlayId: string, windowId: number, imageSize: SizeI, screenRect: RectI, vrLayout: VRLayout): NativeOverlayWindowResourceInfo
  
  getResourceCount(): number
  
  getResourceInfo(idx: number): NativeOverlayWindowResourceInfo
  getResourceInfoById(overlayIdOrWindowId: number | string): NativeOverlayWindowResourceInfo
  
  releaseResources(...windowOrOverlayIds:Array<string | number>): void
  
  processFrame(overlayId: string, buf: Uint8Array): void
  
  destroy(): void
}

export interface NativeOverlayManagerCtor {
  new(): NativeOverlayManager
}

export async function CreateNativeOverlayManager() {
  if (!await IsNativeOverlaySupported()) {
    return null
  }
  // if (!nativeExports)
  //   throw Error(`Native overlays for VR are not supported on this machine`)
  
  const
    nativeExports = GetNativeExports(),
    {NativeOverlayManager} = nativeExports
  return new NativeOverlayManager()
}