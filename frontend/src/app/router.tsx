import { lazy, Suspense } from 'react';
import { env } from '@shared/config/env';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell, PageLayout, PageHeader } from '@widgets/app-shell';
import { EmptyState } from '@shared/ui/empty-state';
import { LoadingState } from '@shared/ui/skeleton';

const MockLoginPage = env.AUTH_MODE === 'mock' ? lazy(() => import('@pages/mock-login')) : null;
const VocPage = lazy(() => import('@pages/voc'));
const VocReviewPage = lazy(() => import('@pages/voc-review'));
const NoticePage = lazy(() => import('@pages/notice'));
const FaqPage = lazy(() => import('@pages/faq'));
const AdminTagsPage = lazy(() => import('@pages/admin/tags'));
const AdminTrashPage = lazy(() => import('@pages/admin/trash'));
const AdminUsersPage = lazy(() => import('@pages/admin/users'));
const AdminMastersPage = lazy(() => import('@pages/admin/masters'));
const NotificationsPage = lazy(() => import('@pages/notifications'));
const DashboardPage = lazy(() => import('@pages/DashboardPage'));

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
    <PageLayout header={<PageHeader title={title} />}>
      <EmptyState title="준비 중입니다." description="Wave 1에서 데이터가 연결됩니다." />
    </PageLayout>
  );
}

function HealthPage() {
  return (
    <PageLayout header={<PageHeader title="Health Check" />}>
      <EmptyState
        title="/api/health — MSW stub"
        description="Wave 1에서 실제 fetch가 연결됩니다."
      />
    </PageLayout>
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
      {
        path: 'dashboard',
        element: (
          <Suspense fallback={<LoadingState />}>
            <DashboardPage />
          </Suspense>
        ),
      },
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
      {
        path: 'notifications',
        element: (
          <Suspense fallback={<LoadingState />}>
            <NotificationsPage />
          </Suspense>
        ),
      },
      {
        path: 'admin',
        children: [
          { index: true, element: <Navigate to="/voc" replace /> },
          {
            path: 'tags',
            element: (
              <Suspense fallback={<LoadingState />}>
                <AdminTagsPage />
              </Suspense>
            ),
          },
          {
            path: 'vocs/trash',
            element: (
              <Suspense fallback={<LoadingState />}>
                <AdminTrashPage />
              </Suspense>
            ),
          },
          {
            path: 'users',
            element: (
              <Suspense fallback={<LoadingState />}>
                <AdminUsersPage />
              </Suspense>
            ),
          },
          {
            path: 'masters',
            element: (
              <Suspense fallback={<LoadingState />}>
                <AdminMastersPage />
              </Suspense>
            ),
          },
          { path: '*', element: <StubPage title="Admin" /> },
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
