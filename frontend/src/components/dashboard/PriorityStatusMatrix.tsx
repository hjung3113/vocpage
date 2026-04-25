import { useQuery } from '@tanstack/react-query';
import { fetchPriorityStatusMatrix, type DashboardFilters } from '../../api/dashboard';

const PRIORITIES = ['urgent', 'high', 'medium', 'low'];
const STATUSES = ['접수', '검토중', '처리중', '완료', '드랍'];

interface Props {
  apiFilters: DashboardFilters;
}

export function PriorityStatusMatrix({ apiFilters }: Props) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard', 'priority-status-matrix', apiFilters],
    queryFn: () => fetchPriorityStatusMatrix(apiFilters),
  });

  const cellMap = new Map<string, number>();
  data?.rows.forEach((r) => cellMap.set(`${r.priority}|${r.status}`, r.count));

  const cellStyle: React.CSSProperties = {
    padding: '8px 12px',
    textAlign: 'center',
    fontSize: '13px',
    border: '1px solid var(--border)',
    color: 'var(--text-primary)',
  };

  const headerStyle: React.CSSProperties = {
    ...cellStyle,
    color: 'var(--text-muted)',
    fontWeight: 600,
    background: 'var(--bg-surface)',
  };

  return (
    <div
      style={{
        background: 'var(--bg-panel)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        padding: '16px',
        overflowX: 'auto',
      }}
    >
      <h3 style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '12px' }}>
        우선순위 × 상태
      </h3>
      {isLoading && <p style={{ color: 'var(--text-muted)' }}>로딩 중...</p>}
      {isError && <p style={{ color: 'var(--danger)' }}>데이터를 불러오지 못했습니다.</p>}
      {data && (
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th style={headerStyle}>우선순위</th>
              {STATUSES.map((s) => (
                <th key={s} style={headerStyle}>
                  {s}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PRIORITIES.map((priority) => (
              <tr key={priority}>
                <td style={{ ...headerStyle, textAlign: 'left' }}>{priority}</td>
                {STATUSES.map((status) => {
                  const count = cellMap.get(`${priority}|${status}`) ?? 0;
                  return (
                    <td key={status} style={cellStyle}>
                      {count > 0 ? count : '—'}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
