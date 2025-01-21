import type { WindowMetadata } from "./WindowTypes"

export interface DesktopWindowsState {
  windows: Record<string, WindowMetadata>
}

export const newDesktopWindowsState = (): DesktopWindowsState => ({
  windows: {}
})


