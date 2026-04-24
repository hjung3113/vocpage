import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

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
    element: <div className="p-4">VOC 관리 시스템</div>,
  },
  {
    path: '/mock-login',
    element: <MockLoginRoute />,
  },
]);
