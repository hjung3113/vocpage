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
}

const HEADERS = ['상태', '이슈 코드', '제목', '우선순위', '등록일', '기한'];

export function VocList({
  vocs,
  total,
  page,
  limit,
  onPageChange,
  onVocClick,
  isLoading = false,
}: VocListProps) {
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {HEADERS.map((h) => (
                <th
                  key={h}
                  className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide"
                  style={{ color: 'var(--text-muted)', background: 'var(--bg-panel)' }}
                >
                  {h}
                </th>
              ))}
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
