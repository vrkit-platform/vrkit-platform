import { Suspense } from "react"
import { IndexRouteObject, Navigate, NonIndexRouteObject, Outlet, RouteObject, useRoutes } from "react-router-dom"

import { AppLayout } from "../app"
import { LoadingScreen, SplashScreen } from "vrkit-app-renderer/components/loading-screen"

import { DashboardsPage, DashboardEditPage } from "vrkit-app-renderer/pages/dashboards"
import { PluginsPage } from "vrkit-app-renderer/pages/plugins"

import Page403 from "vrkit-app-renderer/pages/error/403"
import Page404 from "vrkit-app-renderer/pages/error/404"
import Page500 from "vrkit-app-renderer/pages/error/500"
import { getWebPathPart, WebPaths, WebRootPath } from "vrkit-app-renderer/routes/WebPaths"

function makeDefaultRouteConfigs(...routePaths: string[]): (IndexRouteObject | NonIndexRouteObject)[] {
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

/**
 * App routes
 */
export const appRoutes: RouteObject[] = [
  {
    element: (
        <Navigate
            to={WebPaths.app.dashboards}
            replace
        />
    ),
    index: true
  },
  {
    path: getWebPathPart(WebPaths.app.dashboards),
    children: [
      { element: <DashboardsPage />, index: true },
      {
        path: ":id",
        element: <DashboardEditPage />
      }
    ]
  },
  {
    path: getWebPathPart(WebPaths.app.plugins),
    children: [
      { element: <PluginsPage />, index: true },
      // {
      //   path: ":id",
      //   element: <DashboardEditPage />
      // }
    ]
  }
]

/**
 * Error routes
 */
export const errorRoutes = [
  {
    element: (
        <Suspense fallback={<SplashScreen />}>
          <Outlet />
        </Suspense>
    ),
    children: [
      { path: "500", element: <Page500 /> },
      { path: "404", element: <Page404 /> },
      { path: "403", element: <Page403 /> },
      {
        path: "*",
        element: (
            <Navigate
                to="/404"
                replace
            />
        )
      }
    ]
  }
]


export function AppRouter() {
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
      children: [...appRoutes]
    },
    
    ...errorRoutes
  ])
}

export default AppRouter