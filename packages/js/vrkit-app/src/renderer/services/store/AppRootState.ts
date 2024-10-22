// noinspection ES6PreferShortImport

//import type { RouterState } from "connected-react-router"
import type { GlobalState } from "./slices/global"
import type { DataState } from "./slices/data"
import type { ISharedAppState } from "vrkit-shared"
import type { OverlayWindowState } from "./slices/overlay-window"

export interface AppRootState {
  global: GlobalState
  overlayWindow: OverlayWindowState
  shared: ISharedAppState
  data: DataState
}

export type AppRootStateGetter = () => AppRootState
