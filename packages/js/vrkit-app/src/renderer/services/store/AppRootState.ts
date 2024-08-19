// noinspection ES6PreferShortImport

//import type { RouterState } from "connected-react-router"
import type { GlobalState } from "./slices/global"
import type { DataState } from "./slices/data"

export interface AppRootState {
  global: GlobalState
  data: DataState
  
  //router: RouterState<any>

}

export type AppRootStateGetter = () => AppRootState
