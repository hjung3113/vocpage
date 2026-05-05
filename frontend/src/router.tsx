import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { EmptyState } from '@shared/ui/empty-state';
import { LoadingState } from '@shared/ui/skeleton';
import { PageTitle } from './components/layout/PageTitle';

const MockLoginPage =
  import.meta.env.VITE_AUTH_MODE === 'mock' ? lazy(() => import('./pages/MockLoginPage')) : null;

const VocPage = lazy(() => import('./pages/VocPage'));

function VocRoute() {
  return (
    <Suspense fallback={<LoadingState />}>
      <VocPage />
    </Suspense>
  );
}

function MockLoginRoute() {
  if (!MockLoginPage) return <Navigate to="/" replace />;
  return (
    <Suspense fallback={<LoadingState />}>
      <MockLoginPage />
    </Suspense>
  );
}

function StubPage({ title }: { title: string }) {
  return (
    <div>
      <PageTitle title={title} />
      <EmptyState title="준비 중입니다." description="Wave 1에서 데이터가 연결됩니다." />
    </div>
  );
}

function HealthPage() {
  return (
    <div>
      <PageTitle title="Health Check" />
      <EmptyState
        title="/api/health — MSW stub"
        description="Wave 1에서 실제 fetch가 연결됩니다."
      />
    </div>
  );
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/voc" replace /> },
      { path: 'voc', element: <VocRoute /> },
      { path: 'dashboard', element: <StubPage title="Dashboard" /> },
      { path: 'notice', element: <StubPage title="공지" /> },
      { path: 'faq', element: <StubPage title="FAQ" /> },
      { path: 'tags', element: <StubPage title="Tag" /> },
      { path: 'notifications', element: <StubPage title="알림" /> },
      { path: 'admin/*', element: <StubPage title="Admin" /> },
      { path: 'health', element: <HealthPage /> },
    ],
  },
  {
    path: '/mock-login',
    element: <MockLoginRoute />,
  },
]);
