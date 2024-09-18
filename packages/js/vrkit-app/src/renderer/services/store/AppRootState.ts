// noinspection ES6PreferShortImport

//import type { RouterState } from "connected-react-router"
import type { GlobalState } from "./slices/global"
import type { DataState } from "./slices/data"
import type { SessionManagerState } from "vrkit-app-common/models/session-manager"
import type { ISharedAppState } from "vrkit-app-common/models/app"

export interface AppRootState {
  global: GlobalState
  shared: ISharedAppState
  data: DataState
  
  sessionManager: SessionManagerState
  //router: RouterState<any>

}

export type AppRootStateGetter = () => AppRootState
