import type {} from "@vrkit-platform/shared"
import { Suspense } from "react"
import { IndexRouteObject, Navigate, NonIndexRouteObject, Outlet, RouteObject, useRoutes } from "react-router-dom"

import { PageLayout } from "../page/PageLayout"
import { LoadingScreen, SplashScreen } from "vrkit-app-renderer/components/loading-screen"

// import { DashboardsPage, DashboardEditPage } from "vrkit-app-renderer/pages/dashboards"
import { PluginsPage } from "vrkit-app-renderer/pages/plugins"

import Page403 from "vrkit-app-renderer/pages/error/403"
import Page404 from "vrkit-app-renderer/pages/error/404"
import Page500 from "vrkit-app-renderer/pages/error/500"
import { getWebPathPart, WebPaths, WebRootPath } from "vrkit-app-renderer/routes/WebPaths"
import React from "react"

const DashboardsPage = React.lazy(() => import("vrkit-app-renderer/pages/dashboards/DashboardsPage"))
const DashboardEditPage = React.lazy(() => import("vrkit-app-renderer/pages/dashboards/DashboardEditPage"))

const SettingsPage = React.lazy(() => import("vrkit-app-renderer/pages/settings/SettingsPage"))
const DashboardVRLayoutPage = React.lazy(() => import("vrkit-app-renderer/pages/dashboard-vr-layout/DashboardVRLayoutPage"))

function makeDefaultRouteConfigs(...routePaths: string[]): (IndexRouteObject | NonIndexRouteObject)[] {
  const
    initialRoute = VRKitWindowConfig?.initialRoute ?? WebPaths.main.dashboards,
    element = (
      <Navigate
          to={initialRoute}
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
 * Main routes
 */
export const mainRoutes: RouteObject[] = [
  {
    element: (
        <Navigate
            to={WebPaths.main.dashboards}
            replace
        />
    ),
    index: true
  },
  {
    path: getWebPathPart(WebPaths.main.dashboards),
    children: [
      { element: <DashboardsPage />, index: true },
      {
        path: ":id",
        element: <DashboardEditPage />
      }
    ]
  },
  {
    path: getWebPathPart(WebPaths.main.plugins),
    children: [
      { element: <PluginsPage />, index: true },
    ]
  }
]

/**
 * Main routes
 */
export const settingsRoutes: RouteObject[] = [
  {
    element: (
      <Navigate
        to={WebPaths.settings.general}
        replace
      />
    ),
    index: true
  },
  {
    path: getWebPathPart(WebPaths.settings.general),
    children: [
      { element: <SettingsPage />, index: true }
    ]
  }
]

export const dashboardVRLayoutRoutes: RouteObject[] = [
  {
    path: getWebPathPart(WebPaths.dashboardVRLayout),
    element: (
        <DashboardVRLayoutPage />
    ),
    index: true
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
      path: WebRootPath.main,
      element: (
          <PageLayout>
            <Suspense fallback={<LoadingScreen />}>
              <Outlet />
            </Suspense>
          </PageLayout>
      ),
      children: [...mainRoutes]
    },
    {
      path: WebRootPath.settings,
      element: (
        <PageLayout>
          <Suspense fallback={<LoadingScreen />}>
            <Outlet />
          </Suspense>
        </PageLayout>
      ),
      children: [...settingsRoutes]
    },
    {
      path: WebRootPath.dashboardVRLayout,
      element: (
          <PageLayout>
            <Suspense fallback={<LoadingScreen />}>
              <Outlet />
            </Suspense>
          </PageLayout>
      ),
      children: [...dashboardVRLayoutRoutes]
    },
    
    ...errorRoutes
  ])
}

export default AppRouter