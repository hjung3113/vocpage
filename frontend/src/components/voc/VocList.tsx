import { ChevronDown, ChevronUp } from 'lucide-react';
import type { VocSummary } from '../../api/vocs';
import { VocRow } from './VocRow';
import { Pagination } from '../common/Pagination';

interface VocListProps {
  vocs: VocSummary[];
  total: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  onVocClick: (id: string) => void;
  isLoading?: boolean;
  sortColumn?: string | null;
  sortOrder?: 'asc' | 'desc';
  onSort?: (col: string) => void;
}

interface HeaderDef {
  label: string;
  sortKey?: string;
}

const HEADERS: HeaderDef[] = [
  { label: '상태' },
  { label: '이슈 코드' },
  { label: '제목' },
  { label: '우선순위', sortKey: 'priority' },
  { label: '등록일', sortKey: 'created_at' },
  { label: '기한', sortKey: 'due_date' },
];

export function VocList({
  vocs,
  total,
  page,
  limit,
  onPageChange,
  onVocClick,
  isLoading = false,
  sortColumn = null,
  sortOrder = 'desc',
  onSort,
}: VocListProps) {
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {HEADERS.map(({ label, sortKey }) => {
                const isSortable = Boolean(sortKey && onSort);
                const isActive = sortKey === sortColumn;
                return (
                  <th
                    key={label}
                    className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide"
                    style={{
                      color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                      background: 'var(--bg-panel)',
                      cursor: isSortable ? 'pointer' : 'default',
                      userSelect: 'none',
                      whiteSpace: 'nowrap',
                    }}
                    onClick={isSortable ? () => onSort!(sortKey!) : undefined}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                      {label}
                      {isActive &&
                        (sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-12 text-center text-sm"
                  style={{ color: 'var(--text-muted)' }}
                >
                  불러오는 중...
                </td>
              </tr>
            ) : vocs.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-12 text-center text-sm"
                  style={{ color: 'var(--text-muted)' }}
                >
                  VOC가 없습니다
                </td>
              </tr>
            ) : (
              vocs.map((voc) => (
                <VocRow key={voc.id} voc={voc} onClick={() => onVocClick(voc.id)} />
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={page} total={total} limit={limit} onChange={onPageChange} />
    </div>
  );
}
