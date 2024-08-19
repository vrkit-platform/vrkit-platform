import { configureStore, Middleware, Reducer, Selector } from "@reduxjs/toolkit"
// import {
//   connectRouter,
//   routerMiddleware as configureRouterMiddleware,
//   RouterState
// } from "connected-react-router"

import { assign } from "lodash"
import { isDev } from "../../constants"
import type { AppRootState } from "./AppRootState"
import { history } from "./History"
// noinspection ES6PreferShortImport
import { globalReducer } from "./slices/global/GlobalSlice"
// noinspection ES6PreferShortImport
// import {
//   configurePendingEffects,
//   includePendingReducer
// } from "redux-pending-effects"

import { asOption } from "@3fv/prelude-ts"
import { dataReducer } from "./slices/data"
import { getLogger } from "@3fv/logger-proxy"


const log = getLogger(__filename)
const { debug, trace, info, error, warn } = log

// const { middlewares: pendingMiddlewares } = configurePendingEffects({
//   promise: false,
//   toolkit: true,
//   saga: false,
//   ignoredActionTypes: ["global/getStatus"]
// })

// const routerMiddleware = configureRouterMiddleware(history) as Middleware<
//   {},
//   AppRootState
// >



const getDevMiddleware = () => {
  if (isDev) {
    const logger = asOption(require("redux-logger"))
      .map(mod => (mod.default ?? mod) as Middleware)
      .get()
    return [logger]
  } else {
    return []
  }
}

export const appStore = configureStore<AppRootState>({
  preloadedState: asOption(
    import.meta.webpackHot?.data?.state
  ).getOrUndefined(),
  reducer: {
    data: dataReducer,
    global: globalReducer,
    // router: connectRouter(history) as Reducer<RouterState<any>>
  },

  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: false
    })
      // .concat(routerMiddleware)
      .prepend(...getDevMiddleware()) as any, //routerMiddleware
  // preloadedState: storageService.get<AppRootState>(StorageKey.settings_state) ?? {},
  devTools: isDev
    ? {
        name: "VRKit"
      }
    : false
})

if (import.meta.webpackHot) {
  import.meta.webpackHot.addDisposeHandler(data =>
    assign(data, { state: appStore.getState() })
  )
}

export type AppStore = typeof appStore
export type AppDispatch = typeof appStore.dispatch
export type AppSelector<T = unknown> = Selector<AppRootState, T>

export default appStore

if (process.env.NODE_ENV !== "production") {
  assign(global, {
    appStore: appStore
  })
}
