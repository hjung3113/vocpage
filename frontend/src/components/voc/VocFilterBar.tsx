import { useEffect, useState } from 'react';
import type { VocStatus } from '../../contexts/VOCFilterContext';
import { listTags, type Tag } from '../../api/tags';

interface User {
  id: string;
  name: string;
}

const STATUS_OPTIONS: Array<{ label: string; value: VocStatus | null }> = [
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
      className="flex items-center gap-2 px-6 py-2 shrink-0 flex-wrap"
      style={{ background: 'var(--bg-panel)', borderBottom: '1px solid var(--border)' }}
    >
      {STATUS_OPTIONS.map(({ label, value }) => {
        const isActive = activeStatus === value;
        return (
          <button
            key={label}
            onClick={() => onStatusChange(value)}
            className="px-3 py-1 rounded-full text-sm font-medium transition-colors"
            style={{
              background: isActive ? 'var(--brand)' : 'var(--bg-surface)',
              color: isActive ? 'var(--text-on-brand)' : 'var(--text-secondary)',
              border: `1px solid ${isActive ? 'var(--brand)' : 'var(--border)'}`,
            }}
          >
            {label}
          </button>
        );
      })}

      {onTagChange && tags.length > 0 && (
        <select
          value={activeTagId ?? ''}
          onChange={(e) => onTagChange(e.target.value || null)}
          className="text-sm px-2 py-1 rounded"
          style={{
            border: '1px solid var(--border)',
            background: 'var(--bg-surface)',
            color: activeTagId ? 'var(--text-primary)' : 'var(--text-secondary)',
            marginLeft: '4px',
          }}
        >
          <option value="">태그 전체</option>
          {tags.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      )}

      {onAssigneeChange && (
        <select
          value={activeAssigneeId ?? ''}
          onChange={(e) => onAssigneeChange(e.target.value || null)}
          className="text-sm px-2 py-1 rounded"
          style={{
            border: '1px solid var(--border)',
            background: 'var(--bg-surface)',
            color: activeAssigneeId ? 'var(--text-primary)' : 'var(--text-secondary)',
            marginLeft: '4px',
          }}
        >
          <option value="">담당자 전체</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
