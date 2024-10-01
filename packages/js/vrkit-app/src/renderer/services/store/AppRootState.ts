// noinspection ES6PreferShortImport

//import type { RouterState } from "connected-react-router"
import type { GlobalState } from "./slices/global"
import type { DataState } from "./slices/data"
import type { SessionsState } from "../../../common/models/sessions"
import type { ISharedAppState } from "vrkit-app-common/models/app"

export interface AppRootState {
  global: GlobalState
  shared: ISharedAppState
  data: DataState
  
//  sessionManager: SessionsState
  //router: RouterState<any>

}

export type AppRootStateGetter = () => AppRootState
