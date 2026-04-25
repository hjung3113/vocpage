interface PaginationProps {
  page: number;
  total: number;
  limit: number;
  onChange: (page: number) => void;
}

export function Pagination({ page, total, limit, onChange }: PaginationProps) {
  const totalPages = Math.ceil(total / limit);

  if (totalPages <= 1) return null;

  return (
    <div
      className="flex items-center gap-2 justify-center py-4"
      style={{ color: 'var(--text-secondary)' }}
    >
      <button
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className="px-3 py-1 rounded text-sm"
        style={{
          background: page <= 1 ? 'transparent' : 'var(--bg-surface)',
          color: page <= 1 ? 'var(--text-muted)' : 'var(--text-primary)',
          border: '1px solid var(--border)',
          cursor: page <= 1 ? 'not-allowed' : 'pointer',
        }}
      >
        이전
      </button>

      <span className="text-sm px-2">
        {page} / {totalPages}
      </span>

      <button
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        className="px-3 py-1 rounded text-sm"
        style={{
          background: page >= totalPages ? 'transparent' : 'var(--bg-surface)',
          color: page >= totalPages ? 'var(--text-muted)' : 'var(--text-primary)',
          border: '1px solid var(--border)',
          cursor: page >= totalPages ? 'not-allowed' : 'pointer',
        }}
      >
        다음
      </button>
    </div>
  );
}
