import { lazy, Suspense, useContext } from 'react';
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { VocPage } from './pages/VocPage';
import { NoticePopup } from './components/common/NoticePopup';
import { useNoticePopup } from './hooks/useNoticePopup';
import { AuthContext } from './contexts/AuthContext';

const DashboardPage = lazy(() =>
  import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })),
);

const NoticePage = lazy(() =>
  import('./pages/NoticePage').then((m) => ({ default: m.NoticePage })),
);

const FaqPage = lazy(() => import('./pages/FaqPage').then((m) => ({ default: m.FaqPage })));

const AdminPage = lazy(() => import('./pages/AdminPage').then((m) => ({ default: m.AdminPage })));

const MockLoginPage =
  import.meta.env.VITE_AUTH_MODE === 'mock' ? lazy(() => import('./pages/MockLoginPage')) : null;

function MockLoginRoute() {
  if (!MockLoginPage) return <Navigate to="/" replace />;
  return (
    <Suspense fallback={null}>
      <MockLoginPage />
    </Suspense>
  );
}

function AdminGuard() {
  const ctx = useContext(AuthContext);
  if (!ctx || ctx.isLoading) return null;
  if (ctx.user?.role !== 'admin') return <Navigate to="/" replace />;
  return (
    <Suspense fallback={null}>
      <AdminPage />
    </Suspense>
  );
}

function RootLayout() {
  const { popupNotices, isVisible, closePopup } = useNoticePopup();
  return (
    <>
      <Outlet />
      {isVisible && <NoticePopup notices={popupNotices} onClose={closePopup} />}
    </>
  );
}

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        path: '/',
        element: <VocPage />,
      },
      {
        path: '/mock-login',
        element: <MockLoginRoute />,
      },
      {
        path: '/dashboard',
        element: (
          <Suspense fallback={null}>
            <DashboardPage />
          </Suspense>
        ),
      },
      {
        path: '/notices',
        element: (
          <Suspense fallback={null}>
            <NoticePage />
          </Suspense>
        ),
      },
      {
        path: '/faq',
        element: (
          <Suspense fallback={null}>
            <FaqPage />
          </Suspense>
        ),
      },
      {
        path: '/admin',
        element: <AdminGuard />,
      },
    ],
  },
]);
