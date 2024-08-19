import { lazy, Suspense } from "react"
import {
  IndexRouteObject,
  Navigate,
  NonIndexRouteObject,
  useRoutes
} from "react-router-dom"

import { dashboardRoutes } from "./dashboard"
import { paths } from "../paths"

// ----------------------------------------------------------------------


function makeDefaultRouteConfigs(
  ...routePaths: string[]
): (IndexRouteObject | NonIndexRouteObject)[] {
  /**
   * Skip home page
   * element: <Navigate to={CONFIG.auth.redirectPath} replace />,
   */
  // const element = (
  //   <Suspense fallback={<SplashScreen />}>
  //     <MainLayout>
  //       <HomePage />
  //     </MainLayout>
  //   </Suspense>
  // )
  
  const element = <Navigate to={paths.dashboard.root} replace />

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

    // Dashboard
    ...dashboardRoutes,

    // Main
    //...mainRoutes,

    // Components
    // ...componentsRoutes,

    // No match
    {
      path: "*",
      element: (
        <Navigate
          to="/404"
          replace
        />
      )
    }
  ])
}
