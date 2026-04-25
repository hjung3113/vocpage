import type { VocSummary } from '../../api/vocs';
import { StatusDot } from '../common/StatusDot';
import { PriorityBadge } from '../common/PriorityBadge';
import { TagChip } from './TagChip';

interface VocRowProps {
  voc: VocSummary;
  onClick: () => void;
  tags?: Array<{ name: string }>;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function VocRow({ voc, onClick, tags }: VocRowProps) {
  return (
    <tr
      onClick={onClick}
      style={{
        borderBottom: '1px solid var(--border)',
        cursor: 'pointer',
      }}
      className="hover:bg-[var(--bg-surface)] transition-colors"
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <StatusDot status={voc.status} />
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {voc.status}
          </span>
        </div>
      </td>
      <td
        className="px-4 py-3 text-sm"
        style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-code)' }}
      >
        {voc.issue_code ?? '—'}
      </td>
      <td
        className="px-4 py-3 text-sm font-medium"
        style={{ color: 'var(--text-primary)', maxWidth: '320px' }}
      >
        <span className="block truncate">{voc.title}</span>
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {tags.map((t) => (
              <TagChip key={t.name} name={t.name} />
            ))}
          </div>
        )}
      </td>
      <td className="px-4 py-3">
        <PriorityBadge priority={voc.priority} />
      </td>
      <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
        {formatDate(voc.created_at)}
      </td>
      <td
        className="px-4 py-3 text-sm"
        style={{ color: voc.due_date ? 'var(--text-secondary)' : 'var(--text-muted)' }}
      >
        {voc.due_date ? formatDate(voc.due_date) : '—'}
      </td>
    </tr>
  );
}
