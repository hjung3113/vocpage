import { useEffect, useState } from 'react';
import {
  SlidersHorizontal,
  Layers,
  Circle,
  Search,
  Zap,
  PauseCircle,
  CheckCircle2,
} from 'lucide-react';
import type { VocStatus } from '../../contexts/VOCFilterContext';
import { listTags, type Tag } from '../../api/tags';

interface User {
  id: string;
  name: string;
}

const STATUS_OPTIONS: Array<{ label: string; value: VocStatus | null; icon: React.ReactNode }> = [
  { label: '전체', value: null, icon: <Layers size={11} /> },
  { label: '접수', value: '접수', icon: <Circle size={11} /> },
  { label: '검토중', value: '검토중', icon: <Search size={11} /> },
  { label: '처리중', value: '처리중', icon: <Zap size={11} /> },
  { label: '드랍', value: '드랍', icon: <PauseCircle size={11} /> },
  { label: '완료', value: '완료', icon: <CheckCircle2 size={11} /> },
];

const PRIORITY_OPTIONS: Array<{ label: string; value: string; color: string }> = [
  { label: 'Urgent', value: 'urgent', color: 'var(--priority-urgent)' },
  { label: 'High', value: 'high', color: 'var(--priority-high)' },
  { label: 'Medium', value: 'medium', color: 'var(--text-tertiary)' },
  { label: 'Low', value: 'low', color: 'var(--text-quaternary)' },
];

const VOC_TYPE_OPTIONS: Array<{ label: string; value: string }> = [
  { label: '버그', value: '버그' },
  { label: '기능 요청', value: '기능 요청' },
  { label: '개선 제안', value: '개선 제안' },
  { label: '문의', value: '문의' },
];

interface VocFilterBarProps {
  activeStatus: VocStatus | null;
  onStatusChange: (status: VocStatus | null) => void;
  activeTagId?: string | null;
  onTagChange?: (tagId: string | null) => void;
  activeAssigneeId?: string | null;
  onAssigneeChange?: (id: string | null) => void;
  activePriority?: string | null;
  onPriorityChange?: (priority: string | null) => void;
  activeVocType?: string | null;
  onVocTypeChange?: (type: string | null) => void;
  onReset?: () => void;
}

export function VocFilterBar({
  activeStatus,
  onStatusChange,
  activeTagId,
  onTagChange,
  activeAssigneeId,
  onAssigneeChange,
  activePriority,
  onPriorityChange,
  activeVocType,
  onVocTypeChange,
  onReset,
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
    fetch('/api/users', { credentials: 'include' })
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

        {STATUS_OPTIONS.map(({ label, value, icon }) => {
          const isActive = activeStatus === value;
          return (
            <button
              key={label}
              onClick={() => onStatusChange(value)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full transition-colors"
              style={{
                fontSize: '13px',
                fontWeight: isActive ? 600 : 400,
                color: isActive ? 'var(--accent)' : 'var(--text-tertiary)',
                background: isActive ? 'var(--brand-bg)' : 'transparent',
                border: `1px solid ${isActive ? 'var(--brand-border)' : 'transparent'}`,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {icon}
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
        <div className="px-6 pb-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          {/* Assignee chips row */}
          {onAssigneeChange && (
            <div className="flex items-center gap-2 pt-2 flex-wrap">
              <span
                style={{
                  fontSize: '12px',
                  color: 'var(--text-quaternary)',
                  whiteSpace: 'nowrap',
                  minWidth: '48px',
                }}
              >
                담당자
              </span>
              <button
                onClick={() => onAssigneeChange(null)}
                className="flex items-center px-3 py-1 rounded-full text-sm transition-colors"
                style={{
                  color: activeAssigneeId == null ? 'var(--accent)' : 'var(--text-tertiary)',
                  background: activeAssigneeId == null ? 'var(--brand-bg)' : 'transparent',
                  border: `1px solid ${activeAssigneeId == null ? 'var(--brand-border)' : 'transparent'}`,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                전체
              </button>
              {users.map((u) => {
                const isActive = activeAssigneeId === u.id;
                return (
                  <button
                    key={u.id}
                    onClick={() => onAssigneeChange(isActive ? null : u.id)}
                    className="flex items-center px-3 py-1 rounded-full text-sm transition-colors"
                    style={{
                      color: isActive ? 'var(--accent)' : 'var(--text-tertiary)',
                      background: isActive ? 'var(--brand-bg)' : 'transparent',
                      border: `1px solid ${isActive ? 'var(--brand-border)' : 'transparent'}`,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {u.name}
                  </button>
                );
              })}
            </div>
          )}

          {/* Priority chips row */}
          <div className="flex items-center gap-2 pt-2 flex-wrap">
            <span
              style={{
                fontSize: '12px',
                color: 'var(--text-quaternary)',
                whiteSpace: 'nowrap',
                minWidth: '48px',
              }}
            >
              우선순위
            </span>
            {PRIORITY_OPTIONS.map(({ label, value, color }) => {
              const isActive = activePriority === value;
              return (
                <button
                  key={value}
                  onClick={() => onPriorityChange?.(isActive ? null : value)}
                  className="flex items-center px-3 py-1 rounded-full text-sm transition-colors"
                  style={{
                    color: isActive ? color : 'var(--text-tertiary)',
                    background: isActive ? 'var(--brand-bg)' : 'transparent',
                    border: `1px solid ${isActive ? 'var(--brand-border)' : 'transparent'}`,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    fontWeight: isActive ? 600 : 400,
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* VOC type chips row */}
          {onVocTypeChange && (
            <div className="flex items-center gap-2 pt-2 flex-wrap">
              <span
                style={{
                  fontSize: '12px',
                  color: 'var(--text-quaternary)',
                  whiteSpace: 'nowrap',
                  minWidth: '48px',
                }}
              >
                유형
              </span>
              <button
                onClick={() => onVocTypeChange(null)}
                className="flex items-center px-3 py-1 rounded-full text-sm transition-colors"
                style={{
                  color: activeVocType == null ? 'var(--accent)' : 'var(--text-tertiary)',
                  background: activeVocType == null ? 'var(--brand-bg)' : 'transparent',
                  border: `1px solid ${activeVocType == null ? 'var(--brand-border)' : 'transparent'}`,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                전체
              </button>
              {VOC_TYPE_OPTIONS.map(({ label, value }) => {
                const isActive = activeVocType === value;
                return (
                  <button
                    key={value}
                    onClick={() => onVocTypeChange(isActive ? null : value)}
                    className="flex items-center px-3 py-1 rounded-full text-sm transition-colors"
                    style={{
                      color: isActive ? 'var(--accent)' : 'var(--text-tertiary)',
                      background: isActive ? 'var(--brand-bg)' : 'transparent',
                      border: `1px solid ${isActive ? 'var(--brand-border)' : 'transparent'}`,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Tag chips row + reset button */}
          {onTagChange && tags.length > 0 && (
            <div className="flex items-center gap-2 pt-2 flex-wrap">
              <span
                style={{
                  fontSize: '12px',
                  color: 'var(--text-quaternary)',
                  whiteSpace: 'nowrap',
                  minWidth: '48px',
                }}
              >
                태그
              </span>
              <button
                onClick={() => onTagChange(null)}
                className="flex items-center px-3 py-1 rounded-full text-sm transition-colors"
                style={{
                  color: activeTagId == null ? 'var(--accent)' : 'var(--text-tertiary)',
                  background: activeTagId == null ? 'var(--brand-bg)' : 'transparent',
                  border: `1px solid ${activeTagId == null ? 'var(--brand-border)' : 'transparent'}`,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                전체
              </button>
              {tags.map((t) => {
                const isActive = activeTagId === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => onTagChange(isActive ? null : t.id)}
                    className="flex items-center px-3 py-1 rounded-full text-sm transition-colors"
                    style={{
                      color: isActive ? 'var(--accent)' : 'var(--text-tertiary)',
                      background: isActive ? 'var(--brand-bg)' : 'transparent',
                      border: `1px solid ${isActive ? 'var(--brand-border)' : 'transparent'}`,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {t.name}
                  </button>
                );
              })}
              {onReset && (
                <button
                  onClick={onReset}
                  className="flex items-center px-3 py-1 rounded-lg text-sm ml-auto"
                  style={{
                    color: 'var(--text-tertiary)',
                    background: 'transparent',
                    border: '1px solid var(--border-standard)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  초기화
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
