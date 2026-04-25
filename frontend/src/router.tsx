import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { VocPage } from './pages/VocPage';

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

export const router = createBrowserRouter([
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
]);
