import { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@shared/ui/popover';
import { useRole } from '@entities/user/model/useRole';
import type { Role } from '@contracts/common';

const ROLES = [
  { value: 'admin', label: 'Admin', email: 'admin@vocpage.io' },
  { value: 'manager', label: 'Manager', email: 'manager@vocpage.io' },
  { value: 'dev', label: 'Dev', email: 'dev@vocpage.io' },
  { value: 'user', label: 'User', email: 'user@vocpage.io' },
] as const satisfies readonly { value: Role; label: string; email: string }[];

const FALLBACK_USER = ROLES[3];

export function SidebarUserSwitcher() {
  const { role, setRole } = useRole();
  const [open, setOpen] = useState(false);

  const current = ROLES.find((r) => r.value === role) ?? FALLBACK_USER;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          data-testid="sidebar-user-switcher"
          className="flex w-full items-center gap-2 border-t border-[color:var(--border-standard)] text-left transition-colors hover:bg-[color:var(--bg-app)]"
          style={{ padding: '10px 12px' }}
          aria-label="사용자 전환"
        >
          <div
            className="flex shrink-0 items-center justify-center rounded-full text-xs font-semibold"
            style={{
              width: '30px',
              height: '30px',
              background: 'var(--brand-bg)',
              color: 'var(--brand)',
            }}
            aria-hidden
          >
            {current.label.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <div
              className="truncate font-medium"
              style={{ fontSize: '13px', color: 'var(--text-primary)' }}
            >
              {current.label}
            </div>
            <div className="truncate" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {current.email}
            </div>
          </div>
          <ChevronsUpDown
            size={14}
            aria-hidden
            style={{ color: 'var(--text-muted)', flexShrink: 0 }}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side="top"
        className="w-56 p-1"
        data-testid="sidebar-user-switcher-popover"
      >
        <div
          className="px-2 py-1.5"
          style={{
            fontSize: '11px',
            fontWeight: 500,
            letterSpacing: '0.6px',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
          }}
        >
          역할 전환 (Mock)
        </div>
        <ul className="flex flex-col">
          {ROLES.map((r) => {
            const active = r.value === role;
            return (
              <li key={r.value}>
                <button
                  type="button"
                  data-testid={`sidebar-user-switcher-option-${r.value}`}
                  onClick={() => {
                    setRole(r.value);
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-sm transition-colors hover:bg-[color:var(--bg-app)]"
                  style={{
                    padding: '6px 8px',
                    fontSize: '13px',
                    color: 'var(--text-primary)',
                  }}
                >
                  <span className="flex-1 text-left">{r.label}</span>
                  <span
                    className="truncate"
                    style={{ fontSize: '11px', color: 'var(--text-muted)' }}
                  >
                    {r.email}
                  </span>
                  {active && (
                    <Check size={14} aria-hidden style={{ color: 'var(--brand)', flexShrink: 0 }} />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
