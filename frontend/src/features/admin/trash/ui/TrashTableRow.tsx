/**
 * TrashTableRow — single row in the trash list table (W3-5).
 * Extracted from TrashTable to stay within the 200-line file limit.
 */
import { RotateCcw } from 'lucide-react';
import { Button } from '@shared/ui/button';
import type { TrashListItem } from '../../../../../../shared/contracts/admin/trash';

interface Props {
  row: TrashListItem;
  onRestore: (item: TrashListItem) => void;
}

export function TrashTableRow({ row, onRestore }: Props) {
  return (
    <tr
      style={{
        borderBottom: '1px solid var(--border-standard)',
        color: 'var(--text-primary)',
      }}
    >
      <td
        style={{
          padding: '10px 14px',
          fontFamily: 'D2Coding, monospace',
          fontSize: '12px',
          whiteSpace: 'nowrap',
          color: 'var(--text-secondary)',
        }}
      >
        {row.issue_code}
      </td>
      <td
        style={{
          padding: '10px 14px',
          maxWidth: '260px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
        title={row.title}
      >
        {row.title}
      </td>
      <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
        <span
          style={{
            display: 'inline-block',
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            background: 'var(--brand-bg)',
            color: 'var(--accent)',
          }}
        >
          {row.status}
        </span>
      </td>
      <td
        style={{
          padding: '10px 14px',
          fontSize: '12px',
          color: 'var(--text-muted)',
          fontFamily: 'D2Coding, monospace',
        }}
      >
        {row.system_id.slice(0, 8)}…
      </td>
      <td
        style={{
          padding: '10px 14px',
          fontSize: '12px',
          color: 'var(--text-muted)',
          fontFamily: 'D2Coding, monospace',
        }}
      >
        {row.menu_id.slice(0, 8)}…
      </td>
      <td
        style={{
          padding: '10px 14px',
          fontSize: '12px',
          color: 'var(--text-secondary)',
          whiteSpace: 'nowrap',
        }}
      >
        {new Date(row.deleted_at).toLocaleString('ko-KR', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        })}
      </td>
      <td
        style={{
          padding: '10px 14px',
          fontSize: '12px',
          color: 'var(--text-muted)',
          fontFamily: 'D2Coding, monospace',
        }}
      >
        {row.deleted_by ? `${row.deleted_by.slice(0, 8)}…` : '—'}
      </td>
      <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRestore(row)}
          aria-label={`${row.issue_code} 복원`}
          style={{ gap: '6px', color: 'var(--accent)' }}
        >
          <RotateCcw size={13} aria-hidden />
          복원
        </Button>
      </td>
    </tr>
  );
}
