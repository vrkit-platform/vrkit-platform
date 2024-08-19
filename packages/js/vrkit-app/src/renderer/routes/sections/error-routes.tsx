import { lazy, Suspense } from 'react';
import { Navigate, Outlet } from "react-router-dom"

import { SplashScreen } from 'vrkit-app-renderer/components/loading-screen';

// Error
const Page500 = lazy(() => import('vrkit-app-renderer/pages/error/500'));
const Page403 = lazy(() => import('vrkit-app-renderer/pages/error/403'));
const Page404 = lazy(() => import('vrkit-app-renderer/pages/error/404'));

// ----------------------------------------------------------------------

export const errorRoutes = [
  {
    element: (
      <Suspense fallback={<SplashScreen />}>
        <Outlet />
      </Suspense>
    ),
    children: [
      { path: '500', element: <Page500 /> },
      { path: '404', element: <Page404 /> },
      { path: '403', element: <Page403 /> },
      {
        path: "*",
        element: (
            <Navigate
                to="/404"
                replace
            />
        )
      }
    ],
  },
];
