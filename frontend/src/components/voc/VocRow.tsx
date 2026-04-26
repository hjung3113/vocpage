import { UserX } from 'lucide-react';
import type { VocSummary } from '../../api/vocs';
import { StatusBadge } from '../common/StatusBadge';
import { PriorityBadge } from '../common/PriorityBadge';

interface VocRowProps {
  voc: VocSummary;
  onClick: () => void;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

const AVATAR_COLORS = [
  { bg: 'var(--brand)', text: 'white' },
  { bg: 'var(--status-green)', text: 'white' },
  { bg: 'var(--status-purple)', text: 'white' },
  { bg: 'var(--status-amber)', text: 'white' },
  { bg: 'var(--status-red)', text: 'white' },
  { bg: 'var(--status-emerald)', text: 'white' },
];

function avatarColor(name: string) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function getTypeBadgeStyle(typeName: string | null) {
  if (!typeName) return null;
  const n = typeName;
  if (n.includes('버그') || n.includes('오류'))
    return {
      bg: 'var(--status-red-bg)',
      border: 'var(--status-red-border)',
      color: 'var(--status-red)',
    };
  if (n.includes('기능') || n.includes('요청'))
    return { bg: 'var(--brand-bg)', border: 'var(--brand-border)', color: 'var(--brand)' };
  if (n.includes('개선') || n.includes('제안') || n.includes('계산'))
    return {
      bg: 'var(--status-amber-bg)',
      border: 'var(--status-amber-border)',
      color: 'var(--status-amber)',
    };
  if (n.includes('문의'))
    return {
      bg: 'var(--status-purple-bg)',
      border: 'var(--status-purple-border)',
      color: 'var(--status-purple)',
    };
  return {
    bg: 'var(--bg-elevated)',
    border: 'var(--border-subtle)',
    color: 'var(--text-tertiary)',
  };
}

function AssigneeCell({ name }: { name: string | null }) {
  if (!name) {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '12px',
          color: 'var(--text-quaternary)',
        }}
      >
        <UserX size={13} />
        미배정
      </span>
    );
  }
  const { bg, text } = avatarColor(name);
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
      <span
        style={{
          width: '22px',
          height: '22px',
          borderRadius: '50%',
          background: bg,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '11px',
          fontWeight: 700,
          color: text,
          flexShrink: 0,
        }}
      >
        {name.charAt(0)}
      </span>
      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{name}</span>
    </span>
  );
}

export function VocRow({ voc, onClick }: VocRowProps) {
  const typeBadge = getTypeBadgeStyle(voc.voc_type_name ?? null);

  return (
    <tr
      onClick={onClick}
      style={{ borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer' }}
      className="hover:bg-[var(--bg-surface)] transition-colors"
    >
      {/* 이슈 ID */}
      <td
        className="px-4 py-2.5 text-sm"
        style={{
          fontFamily: 'var(--font-code)',
          color: 'var(--text-secondary)',
          whiteSpace: 'nowrap',
          width: '168px',
        }}
      >
        {voc.issue_code ?? '—'}
      </td>

      {/* 제목 (type badge + title + tags) */}
      <td className="px-4 py-2.5" style={{ maxWidth: '0', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
          {typeBadge && voc.voc_type_name && (
            <span
              style={{
                flexShrink: 0,
                display: 'inline-flex',
                alignItems: 'center',
                padding: '1px 7px',
                borderRadius: '9999px',
                fontSize: '11px',
                fontWeight: 600,
                background: typeBadge.bg,
                border: `1px solid ${typeBadge.border}`,
                color: typeBadge.color,
                whiteSpace: 'nowrap',
              }}
            >
              <span style={{ marginRight: '3px', fontSize: '8px', lineHeight: 1 }}>●</span>
              {voc.voc_type_name}
            </span>
          )}
          <span
            className="text-sm font-medium truncate"
            style={{ color: 'var(--text-primary)', flexShrink: 1 }}
          >
            {voc.title}
          </span>
          {voc.tags && voc.tags.length > 0 && (
            <span style={{ display: 'inline-flex', gap: '4px', flexShrink: 0 }}>
              {voc.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag.id}
                  style={{
                    padding: '1px 6px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 500,
                    background: 'var(--bg-elevated)',
                    color: 'var(--text-tertiary)',
                    border: '1px solid var(--border-subtle)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {tag.name}
                </span>
              ))}
            </span>
          )}
        </div>
      </td>

      {/* 상태 */}
      <td className="px-4 py-2.5" style={{ whiteSpace: 'nowrap', width: '100px' }}>
        <StatusBadge status={voc.status} />
      </td>

      {/* 담당자 */}
      <td className="px-4 py-2.5" style={{ whiteSpace: 'nowrap', width: '120px' }}>
        <AssigneeCell name={voc.assignee_name ?? null} />
      </td>

      {/* 우선순위 */}
      <td className="px-4 py-2.5" style={{ whiteSpace: 'nowrap', width: '90px' }}>
        <PriorityBadge priority={voc.priority} />
      </td>

      {/* 등록일 */}
      <td
        className="px-4 py-2.5 text-xs"
        style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap', width: '88px' }}
      >
        {formatDate(voc.created_at)}
      </td>
    </tr>
  );
}
