import { lazy, Suspense, useContext } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { VocPage } from './pages/VocPage';
import { NoticePopup } from './components/common/NoticePopup';
import { useNoticePopup } from './hooks/useNoticePopup';
import { AuthContext } from './contexts/AuthContext';

const NoticePage = lazy(() =>
  import('./pages/NoticePage').then((m) => ({ default: m.NoticePage })),
);

const FaqPage = lazy(() => import('./pages/FaqPage').then((m) => ({ default: m.FaqPage })));

const AdminPage = lazy(() => import('./pages/AdminPage').then((m) => ({ default: m.AdminPage })));

const DashboardPage = lazy(() =>
  import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })),
);

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

function DashboardGuard() {
  const ctx = useContext(AuthContext);
  if (!ctx || ctx.isLoading) return null;
  const role = ctx.user?.role;
  if (role !== 'admin' && role !== 'manager') return <Navigate to="/" replace />;
  return (
    <Suspense fallback={null}>
      <DashboardPage />
    </Suspense>
  );
}

function RootLayout() {
  const { popupNotices, isVisible, closePopup } = useNoticePopup();
  return (
    <>
      <AppShell />
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
      {
        path: '/dashboard',
        element: <DashboardGuard />,
      },
    ],
  },
]);
