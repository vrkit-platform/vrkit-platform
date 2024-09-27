import { lazy, Suspense } from 'react';
import { getWebPathPart, WebPaths } from "../WebPaths"
import { Navigate } from "react-router-dom"

// ----------------------------------------------------------------------

// Overview
const DashboardsPage = lazy(() => import('../../pages/dashboards'));



export const mainRoutes = [
  { element: <Navigate to={WebPaths.app.dashboards} replace />, index: true },
  { element: <DashboardsPage />, path: getWebPathPart(WebPaths.app.dashboards) },
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
