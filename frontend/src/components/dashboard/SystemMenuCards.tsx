import { useQuery } from '@tanstack/react-query';
import { fetchSystemOverview, type DashboardFilters } from '../../api/dashboard';

interface Props {
  apiFilters: DashboardFilters;
}

export function SystemMenuCards({ apiFilters }: Props) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard', 'system-overview', apiFilters],
    queryFn: () => fetchSystemOverview(apiFilters),
  });

  if (isLoading) return <p style={{ color: 'var(--text-muted)' }}>로딩 중...</p>;
  if (isError) return <p style={{ color: 'var(--danger)' }}>데이터를 불러오지 못했습니다.</p>;

  return (
    <div>
      <h3
        style={{
          color: 'var(--text-secondary)',
          fontSize: '13px',
          marginBottom: '12px',
        }}
      >
        시스템별 현황
      </h3>
      <div
        style={{
          display: 'flex',
          gap: '12px',
          overflowX: 'auto',
          paddingBottom: '4px',
        }}
      >
        {(data ?? []).map((sys) => (
          <div
            key={sys.system_id}
            style={{
              background: 'var(--bg-panel)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '16px',
              minWidth: '180px',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                color: 'var(--text-primary)',
                fontWeight: 600,
                fontSize: '14px',
                marginBottom: '12px',
              }}
            >
              {sys.system_name}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{ color: 'var(--text-muted)' }}>전체</span>
                <span style={{ color: 'var(--text-primary)' }}>{sys.total}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{ color: 'var(--text-muted)' }}>미해결</span>
                <span style={{ color: 'var(--danger)' }}>{sys.unresolved}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{ color: 'var(--text-muted)' }}>완료</span>
                <span style={{ color: 'var(--status-green)' }}>{sys.completed}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
