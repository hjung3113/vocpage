import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { ErrorBoundary } from '@shared/ui/error-state';
import { Toaster } from '@shared/ui/toast';
import { NoticePopupModal } from '@features/notice-popup';

export function AppShell() {
  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ fontFamily: 'Pretendard Variable, Pretendard, sans-serif' }}
    >
      <Sidebar />
      <main
        className="relative flex-1 overflow-hidden bg-[color:var(--bg-app)]"
        style={{ padding: 'var(--app-main-pad)' }}
      >
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
      <Toaster />
      <NoticePopupModal />
    </div>
  );
}
