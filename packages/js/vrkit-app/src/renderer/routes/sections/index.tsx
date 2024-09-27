import { Suspense } from "react"
import {
  IndexRouteObject,
  Navigate,
  NonIndexRouteObject,
  Outlet,
  useRoutes
} from "react-router-dom"

import { AppLayout } from "../../layouts/app"
import { LoadingScreen } from "vrkit-app-renderer/components/loading-screen"

import { mainRoutes } from "./main-routes"
import { WebPaths, WebRootPath } from "../WebPaths"
import { errorRoutes } from "./error-routes"

function makeDefaultRouteConfigs(
  ...routePaths: string[]
): (IndexRouteObject | NonIndexRouteObject)[] {
  const element = (
    <Navigate
      to={WebPaths.app.dashboards}
      replace
    />
  )

  return [
    { index: true, element },
    ...routePaths.map(path => ({
      path,
      element
    }))
  ]
}

export function Router() {
  return useRoutes([
    ...makeDefaultRouteConfigs("", "/", "/index.html"),

    {
      path: WebRootPath.app,
      element: (
        <AppLayout>
          <Suspense fallback={<LoadingScreen />}>
            <Outlet />
          </Suspense>
        </AppLayout>
      ),
      children: [...mainRoutes]
    },

    ...errorRoutes
  ])
}
