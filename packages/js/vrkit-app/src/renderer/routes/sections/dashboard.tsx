import { lazy, Suspense } from 'react';
import { Outlet } from 'react-router-dom';

import { CONFIG } from 'vrkit-app-renderer/config-global';
import { DashboardLayout } from 'vrkit-app-renderer/layouts/dashboard';

import { LoadingScreen } from 'vrkit-app-renderer/components/loading-screen';

import { AuthGuard } from 'vrkit-app-renderer/auth/guard';

// ----------------------------------------------------------------------

// Overview
const IndexPage = lazy(() => import('vrkit-app-renderer/pages/dashboard'));

// File manager
const FileManagerPage = lazy(() => import('vrkit-app-renderer/pages/dashboard/file-manager'));
// App
const CalendarPage = lazy(() => import('vrkit-app-renderer/pages/dashboard/calendar'));
const KanbanPage = lazy(() => import('vrkit-app-renderer/pages/dashboard/kanban'));

// Blank page
const ParamsPage = lazy(() => import('vrkit-app-renderer/pages/dashboard/params'));
const BlankPage = lazy(() => import('vrkit-app-renderer/pages/dashboard/blank'));

// ----------------------------------------------------------------------

const layoutContent = (
  <DashboardLayout>
    <Suspense fallback={<LoadingScreen />}>
      <Outlet />
    </Suspense>
  </DashboardLayout>
);

export const dashboardRoutes = [
  {
    path: 'dashboard',
    element: CONFIG.auth.skip ? <>{layoutContent}</> : <AuthGuard>{layoutContent}</AuthGuard>,
    children: [
      { element: <IndexPage />, index: true },
      
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
      
      { path: 'calendar', element: <CalendarPage/> },
      { path: 'file-manager', element: <FileManagerPage /> },
      { path: 'kanban', element: <KanbanPage /> },
      { path: 'params', element: <ParamsPage /> },
    ],
  },
];
