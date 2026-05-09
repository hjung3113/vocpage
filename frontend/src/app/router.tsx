import { lazy, Suspense } from 'react';
import { env } from '@shared/config/env';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell, PageTitle } from '@widgets/app-shell';
import { EmptyState } from '@shared/ui/empty-state';
import { LoadingState } from '@shared/ui/skeleton';

const MockLoginPage = env.AUTH_MODE === 'mock' ? lazy(() => import('@pages/mock-login')) : null;
const VocPage = lazy(() => import('@pages/voc'));
const VocReviewPage = lazy(() => import('@pages/voc-review'));
const NoticePage = lazy(() => import('@pages/notice'));
const FaqPage = lazy(() => import('@pages/faq'));
const AdminTagsPage = lazy(() => import('@pages/admin/tags'));

function VocRoute() {
  return (
    <Suspense fallback={<LoadingState />}>
      <VocPage />
    </Suspense>
  );
}

function VocReviewRoute() {
  return (
    <Suspense fallback={<LoadingState />}>
      <VocReviewPage />
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
      { path: 'voc/:id', element: <VocReviewRoute /> },
      { path: 'dashboard', element: <StubPage title="Dashboard" /> },
      {
        path: 'notice',
        element: (
          <Suspense fallback={<LoadingState />}>
            <NoticePage />
          </Suspense>
        ),
      },
      {
        path: 'faq',
        element: (
          <Suspense fallback={<LoadingState />}>
            <FaqPage />
          </Suspense>
        ),
      },
      { path: 'tags', element: <StubPage title="Tag" /> },
      { path: 'notifications', element: <StubPage title="알림" /> },
      {
        path: 'admin',
        children: [
          {
            path: 'tags',
            element: (
              <Suspense fallback={<LoadingState />}>
                <AdminTagsPage />
              </Suspense>
            ),
          },
          { path: '*', element: <StubPage title="Admin" /> },
          { index: true, element: <StubPage title="Admin" /> },
        ],
      },
      { path: 'health', element: <HealthPage /> },
    ],
  },
  {
    path: '/mock-login',
    element: <MockLoginRoute />,
  },
]);
