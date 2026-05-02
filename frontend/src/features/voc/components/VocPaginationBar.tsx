import { Pagination } from '../../../components/common/Pagination';

export interface VocPaginationBarProps {
  page: number;
  perPage: number;
  total: number;
  onPageChange: (p: number) => void;
}

export function VocPaginationBar({ page, perPage, total, onPageChange }: VocPaginationBarProps) {
  if (total === 0) return null;

  const totalPages = Math.ceil(total / perPage);
  const start = (page - 1) * perPage + 1;
  const end = Math.min(page * perPage, total);

  return (
    <div
      data-pcomp="voc-pagination"
      className="flex items-center justify-between px-6 py-3"
      style={{ borderTop: '1px solid var(--border-subtle)' }}
    >
      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
        {start}-{end} / {total}
      </span>
      <Pagination page={page} totalPages={totalPages} onChange={onPageChange} />
    </div>
  );
}

export default VocPaginationBar;
