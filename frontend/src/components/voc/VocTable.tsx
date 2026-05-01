import { VocStatusBadge } from './VocStatusBadge';
import type { VocListResponse } from '../../../../shared/contracts/voc';

type Row = VocListResponse['rows'][number];

interface Props {
  rows: Row[];
  onRowClick: (id: string) => void;
}

export function VocTable({ rows, onRowClick }: Props) {
  return (
    <table className="w-full text-sm" data-testid="voc-table">
      <thead className="border-b" style={{ borderColor: 'var(--border-standard)' }}>
        <tr className="text-left" style={{ color: 'var(--text-secondary)' }}>
          <th className="py-2 pr-2 font-medium">Issue</th>
          <th className="py-2 pr-2 font-medium">Title</th>
          <th className="py-2 pr-2 font-medium">Status</th>
          <th className="py-2 pr-2 font-medium">Priority</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr
            key={r.id}
            className="cursor-pointer border-b transition-colors hover:bg-[var(--bg-row-hover,_var(--bg-panel))]"
            style={{ borderColor: 'var(--border-standard)' }}
            onClick={() => onRowClick(r.id)}
            data-testid={`voc-row-${r.id}`}
          >
            <td className="py-2 pr-2 font-mono text-xs">{r.issue_code}</td>
            <td className="py-2 pr-2">{r.title}</td>
            <td className="py-2 pr-2">
              <VocStatusBadge status={r.status} />
            </td>
            <td className="py-2 pr-2 capitalize">{r.priority}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
