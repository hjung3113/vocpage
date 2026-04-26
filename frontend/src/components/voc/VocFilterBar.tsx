import { useEffect, useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import type { VocStatus } from '../../contexts/VOCFilterContext';
import { listTags, type Tag } from '../../api/tags';

interface User {
  id: string;
  name: string;
}

const STATUS_OPTIONS: Array<{ label: string; value: VocStatus | null; icon?: string }> = [
  { label: '전체', value: null },
  { label: '접수', value: '접수' },
  { label: '검토중', value: '검토중' },
  { label: '처리중', value: '처리중' },
  { label: '드랍', value: '드랍' },
  { label: '완료', value: '완료' },
];

interface VocFilterBarProps {
  activeStatus: VocStatus | null;
  onStatusChange: (status: VocStatus | null) => void;
  activeTagId?: string | null;
  onTagChange?: (tagId: string | null) => void;
  activeAssigneeId?: string | null;
  onAssigneeChange?: (id: string | null) => void;
}

export function VocFilterBar({
  activeStatus,
  onStatusChange,
  activeTagId,
  onTagChange,
  activeAssigneeId,
  onAssigneeChange,
}: VocFilterBarProps) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [showExtended, setShowExtended] = useState(false);

  useEffect(() => {
    listTags()
      .then(setTags)
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch('/api/users')
      .then((r) => r.json())
      .then((data: unknown) => {
        if (Array.isArray(data)) setUsers(data as User[]);
        else if (
          data &&
          typeof data === 'object' &&
          'data' in data &&
          Array.isArray((data as { data: unknown }).data)
        )
          setUsers((data as { data: User[] }).data);
      })
      .catch(() => {});
  }, []);

  return (
    <div
      style={{
        background: 'var(--bg-panel)',
        borderBottom: '1px solid var(--border-subtle)',
        flexShrink: 0,
      }}
    >
      {/* Status filter row */}
      <div className="flex items-center gap-1 px-6 py-2">
        <span
          style={{
            fontSize: '12px',
            fontWeight: 500,
            color: 'var(--text-quaternary)',
            marginRight: '8px',
            whiteSpace: 'nowrap',
          }}
        >
          필터
        </span>

        {STATUS_OPTIONS.map(({ label, value }) => {
          const isActive = activeStatus === value;
          return (
            <button
              key={label}
              onClick={() => onStatusChange(value)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-sm transition-colors"
              style={{
                fontWeight: isActive ? 600 : 400,
                color: isActive ? 'var(--accent)' : 'var(--text-tertiary)',
                background: isActive ? 'var(--brand-bg)' : 'transparent',
                border: `1px solid ${isActive ? 'var(--brand-border)' : 'transparent'}`,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  border: `1.5px solid ${isActive ? 'var(--accent)' : 'var(--text-quaternary)'}`,
                  background: isActive ? 'var(--accent)' : 'transparent',
                  flexShrink: 0,
                  display: 'inline-block',
                }}
              />
              {label}
            </button>
          );
        })}

        <button
          onClick={() => setShowExtended((p) => !p)}
          className="flex items-center gap-1.5 ml-auto px-3 py-1 rounded-lg text-sm"
          style={{
            color: showExtended ? 'var(--accent)' : 'var(--text-tertiary)',
            background: showExtended ? 'var(--brand-bg)' : 'transparent',
            border: `1px solid ${showExtended ? 'var(--brand-border)' : 'var(--border-standard)'}`,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            fontWeight: 500,
          }}
        >
          <SlidersHorizontal size={13} />
          필터 더보기
        </button>
      </div>

      {/* Extended filters */}
      {showExtended && (
        <div
          className="flex items-center gap-3 px-6 pb-2"
          style={{ borderTop: '1px solid var(--border-subtle)' }}
        >
          {onTagChange && (
            <div className="flex items-center gap-2 pt-2">
              <span
                style={{ fontSize: '12px', color: 'var(--text-quaternary)', whiteSpace: 'nowrap' }}
              >
                태그
              </span>
              <select
                value={activeTagId ?? ''}
                onChange={(e) => onTagChange(e.target.value || null)}
                style={{
                  fontSize: '13px',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-standard)',
                  background: 'var(--bg-surface)',
                  color: activeTagId ? 'var(--text-primary)' : 'var(--text-tertiary)',
                  cursor: 'pointer',
                }}
              >
                <option value="">전체</option>
                {tags.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {onAssigneeChange && (
            <div className="flex items-center gap-2 pt-2">
              <span
                style={{ fontSize: '12px', color: 'var(--text-quaternary)', whiteSpace: 'nowrap' }}
              >
                담당자
              </span>
              <select
                value={activeAssigneeId ?? ''}
                onChange={(e) => onAssigneeChange(e.target.value || null)}
                style={{
                  fontSize: '13px',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-standard)',
                  background: 'var(--bg-surface)',
                  color: activeAssigneeId ? 'var(--text-primary)' : 'var(--text-tertiary)',
                  cursor: 'pointer',
                }}
              >
                <option value="">전체</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
