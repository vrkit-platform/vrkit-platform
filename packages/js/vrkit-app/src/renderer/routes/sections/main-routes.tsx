import { lazy, Suspense } from 'react';
import { getWebPathPart, WebPaths } from "../WebPaths"
import { Navigate, RouteObject } from "react-router-dom"

// ----------------------------------------------------------------------

// Overview
const DashboardsPage = lazy(() => import('../../pages/dashboards/DashboardsPage'));
const DashboardEditPage = lazy(() => import('../../pages/dashboards/DashboardEditPage'));



export const mainRoutes: RouteObject[] = [
  { element: <Navigate to={WebPaths.app.dashboards} replace />, index: true },
  {
    path: getWebPathPart(WebPaths.app.dashboards),
    children: [
      { element: <DashboardsPage />, index: true},
      { path: ":id/edit", element: <DashboardEditPage />},
    ]
  },
  // { element: <FileManagerPage />, path: getWebPathPart(WebPaths.app.tracks) },
  // { element: <FileManagerPage />, path: getWebPathPart(WebPaths.app.laps) },
  // { element: <FileManagerPage />, path: getWebPathPart(WebPaths.app.games) },
  // // {
  //   path: 'product',
  //   children: [
  //     { element: <ProductListPage />, index: true },
  //     { path: 'list', element: <ProductListPage /> },
  //     { path: ':id', element: <ProductDetailsPage /> },
  //     { path: 'new', element: <ProductCreatePage /> },
  //     { path: ':id/edit', element: <ProductEditPage /> },
  //   ],
  // },
  
  
];
