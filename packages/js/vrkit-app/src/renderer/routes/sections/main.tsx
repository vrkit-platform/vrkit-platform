import { lazy, Suspense } from 'react';
import { Outlet } from 'react-router-dom';

import { SplashScreen } from 'vrkit-app-renderer/components/loading-screen';

// ----------------------------------------------------------------------

const FaqsPage = lazy(() => import('vrkit-app-renderer/pages/faqs'));
const AboutPage = lazy(() => import('vrkit-app-renderer/pages/about-us'));
const ContactPage = lazy(() => import('vrkit-app-renderer/pages/contact-us'));
const ComingSoonPage = lazy(() => import('vrkit-app-renderer/pages/coming-soon'));
const MaintenancePage = lazy(() => import('vrkit-app-renderer/pages/maintenance'));
// Error
const Page500 = lazy(() => import('vrkit-app-renderer/pages/error/500'));
const Page403 = lazy(() => import('vrkit-app-renderer/pages/error/403'));
const Page404 = lazy(() => import('vrkit-app-renderer/pages/error/404'));
// Blank
const BlankPage = lazy(() => import('vrkit-app-renderer/pages/blank'));

// ----------------------------------------------------------------------

export const mainRoutes = [
  {
    element: (
      <Suspense fallback={<SplashScreen />}>
        <Outlet />
      </Suspense>
    ),
    children: [
      // {
      //   element: (
      //     <MainLayout>
      //       <Outlet />
      //     </MainLayout>
      //   ),
      //   children: [
      //     {
      //       path: 'about-us',
      //       element: <AboutPage />,
      //     },
      //     {
      //       path: 'contact-us',
      //       element: <ContactPage />,
      //     },
      //     {
      //       path: 'faqs',
      //       element: <FaqsPage />,
      //     },
      //     {
      //       path: 'blank',
      //       element: <BlankPage />,
      //     },
      //     {
      //       path: 'product',
      //       children: [
      //         { element: <ProductListPage />, index: true },
      //         { path: 'list', element: <ProductListPage /> },
      //         { path: ':id', element: <ProductDetailsPage /> },
      //         { path: 'checkout', element: <ProductCheckoutPage /> },
      //       ],
      //     },
      //     {
      //       path: 'post',
      //       children: [
      //         { element: <PostListPage />, index: true },
      //         { path: 'list', element: <PostListPage /> },
      //         { path: ':title', element: <PostDetailsPage /> },
      //       ],
      //     },
      //   ],
      // },
      { path: '500', element: <Page500 /> },
      { path: '404', element: <Page404 /> },
      { path: '403', element: <Page403 /> },
    ],
  },
];
