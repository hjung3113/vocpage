import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { ErrorBoundary } from '@shared/ui/error-state';
import { Toaster } from '@shared/ui/toast';

const ROUTE_TITLES: Record<string, string> = {
  '/voc': 'VOC',
  '/dashboard': 'Dashboard',
  '/notice': '공지',
  '/faq': 'FAQ',
  '/tags': 'Tag',
  '/notifications': '알림',
  '/admin': 'Admin',
  '/health': 'Health Check',
};

function usePageTitle(): string {
  const { pathname } = useLocation();
  const key = Object.keys(ROUTE_TITLES).find((k) => pathname.startsWith(k));
  return key != null ? (ROUTE_TITLES[key] ?? 'VOC Page') : 'VOC Page';
}

export function AppShell() {
  const title = usePageTitle();

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ fontFamily: 'Pretendard Variable, Pretendard, sans-serif' }}
    >
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar title={title} />
        <main
          className="flex-1 overflow-auto bg-[color:var(--bg-app)]"
          style={{ padding: 'var(--app-main-pad)' }}
        >
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
      <Toaster />
    </div>
  );
}
