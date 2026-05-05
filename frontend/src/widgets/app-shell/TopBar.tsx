import { Bell } from 'lucide-react';
import { useRole } from '@entities/user/model/useRole';

interface TopBarProps {
  title: string;
}

const ROLE_LABELS: Record<string, string> = {
  user: 'User',
  dev: 'Dev',
  manager: 'Manager',
  admin: 'Admin',
};

export function TopBar({ title }: TopBarProps) {
  const { role } = useRole();

  return (
    <header className="flex h-12 items-center justify-between border-b border-[color:var(--border-standard)] bg-[color:var(--bg-elevated)] px-4">
      <span className="text-sm font-semibold text-[color:var(--text-primary)]">{title}</span>
      <div className="flex items-center gap-3">
        <span className="rounded-full bg-[color:var(--brand-bg)] px-2.5 py-0.5 text-xs font-medium text-[color:var(--brand)]">
          {ROLE_LABELS[role] ?? role}
        </span>
        <button
          aria-label="알림"
          className="rounded-md p-1 text-[color:var(--text-secondary)] hover:bg-[color:var(--bg-app)] hover:text-[color:var(--text-primary)]"
        >
          <Bell size={18} aria-hidden />
        </button>
      </div>
    </header>
  );
}
