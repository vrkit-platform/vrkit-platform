import type { RectF, RectI, SizeI, VRLayout } from "vrkit-models"
import { GetNativeExports } from "./NativeBinding"

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

export function CreateNativeOverlayManager() {
  const {NativeOverlayManager} = GetNativeExports()
  return new NativeOverlayManager()
}