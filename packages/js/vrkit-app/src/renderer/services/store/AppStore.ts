import { configureStore, Middleware, Selector } from "@reduxjs/toolkit"
import { assign } from "lodash"
import { isDev } from "../../renderer-constants"
import type { AppRootState } from "./AppRootState"
// noinspection ES6PreferShortImport
import { globalReducer } from "./slices/global/GlobalSlice"
// noinspection ES6PreferShortImport
import { asOption } from "@3fv/prelude-ts"
import { dataReducer } from "./slices/data"
import { getLogger } from "@3fv/logger-proxy"
import { sharedAppReducer } from "./slices/shared-app"
import { overlayWindowReducer } from "./slices/overlay-window"

const log = getLogger(__filename)
const { debug, trace, info, error, warn } = log

const getDevMiddleware = () => {
  if (isDev) {
    // const logger = asOption(require("redux-logger"))
    //   .map(mod => (mod.default ?? mod) as Middleware)
    //   .get()
    // return [logger]
    return []
  } else {
    return []
  }
}

export const appStore = configureStore<AppRootState>({
  preloadedState: asOption(
    import.meta.webpackHot?.data?.state
  ).getOrUndefined(),
  reducer: {
    overlayWindow: overlayWindowReducer,
    data: dataReducer,
    global: globalReducer,
    shared: sharedAppReducer
  },

  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: false
    })
      .prepend(...getDevMiddleware()) as any, //routerMiddleware
  
  devTools: {
    name: "VRKit"
  }
})

if (import.meta.webpackHot) {
  import.meta.webpackHot.addDisposeHandler(data => {
    Object.assign(data, { state: appStore.getState() })
    delete global["appStore"]
  })
}

export type AppStore = typeof appStore
export type AppDispatch = typeof appStore.dispatch
export type AppSelector<T = unknown> = Selector<AppRootState, T>

export default appStore

if (process.env.NODE_ENV !== "production") {
  assign(global, {
    appStore
  })
}
