import { lazy, Suspense } from 'react';
import { getWebPathPart, WebPaths } from "../WebPaths"
import { Navigate } from "react-router-dom"

// ----------------------------------------------------------------------

// Overview
const IndexPage = lazy(() => import('vrkit-app-renderer/pages/app'));

// File manager
const FileManagerPage = lazy(() => import('vrkit-app-renderer/pages/app/file-manager'));


export const mainRoutes = [
  { element: <Navigate to={WebPaths.app.root} replace />, index: true },
  { element: <IndexPage />, path: getWebPathPart(WebPaths.app.root) },
  { element: <FileManagerPage />, path: getWebPathPart(WebPaths.app.tracks) },
  // {
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
