// noinspection ES6PreferShortImport

//import type { RouterState } from "connected-react-router"
import type { GlobalState } from "./slices/global"
import type { DataState } from "./slices/data"
import type { SessionManagerState } from "./slices/session-manager"

export interface AppRootState {
  global: GlobalState
  data: DataState
  
  sessionManager: SessionManagerState
  //router: RouterState<any>

}

export type AppRootStateGetter = () => AppRootState
