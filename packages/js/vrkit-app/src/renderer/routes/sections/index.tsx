import { lazy, Suspense } from "react"
import {
  IndexRouteObject,
  Navigate,
  NonIndexRouteObject,
  useRoutes
} from "react-router-dom"
import { Outlet } from 'react-router-dom';

import { AppLayout } from '../../layouts/app';
import { LoadingScreen } from 'vrkit-app-renderer/components/loading-screen';

import { mainRoutes } from "./main-routes"
import { WebPaths, WebRootPath } from "../WebPaths"
import { errorRoutes } from "./error-routes"

function makeDefaultRouteConfigs(
  ...routePaths: string[]
): (IndexRouteObject | NonIndexRouteObject)[] {
  const element = <Navigate to={WebPaths.app.root} replace />

  return [
    { index: true, element },
    ...routePaths.map(path => ({
      path,
      element
    }))
  ]
}

const layoutContent = <AppLayout>
  <Suspense fallback={<LoadingScreen />}>
    <Outlet />
  </Suspense>
</AppLayout>

export function Router() {
  
  return useRoutes([
    ...makeDefaultRouteConfigs("", "/", "/index.html"),

    // Main
    {
      path: WebRootPath.app,
      element: <>{layoutContent}</>,
      children: [
        ...mainRoutes,
      ]
    },
    
    ...errorRoutes,

    
  ])
}
