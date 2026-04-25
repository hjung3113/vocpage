import { useQuery } from '@tanstack/react-query';
import { fetchAging, fetchAgingVocs, type DashboardFilters } from '../../api/dashboard';

interface Props {
  apiFilters: DashboardFilters;
}

interface AgingVoc {
  id: string;
  title?: string;
  issue_code?: string;
  status?: string;
  created_at?: string;
  days_open?: number;
}

export function AgingVocList({ apiFilters }: Props) {
  const { data: aging, isLoading: agingLoading } = useQuery({
    queryKey: ['dashboard', 'aging', apiFilters],
    queryFn: () => fetchAging(apiFilters),
  });

  const { data: agingVocs, isLoading: vocsLoading } = useQuery({
    queryKey: ['dashboard', 'aging-vocs', apiFilters],
    queryFn: () => fetchAgingVocs(apiFilters, 10),
  });

  const bars = aging
    ? [
        { label: '≤7일', count: aging.le7, color: 'var(--status-green)' },
        { label: '8-30일', count: aging.d8to30, color: 'var(--status-amber)' },
        { label: '31일+', count: aging.gt30, color: 'var(--danger)' },
      ]
    : [];

  const total = bars.reduce((s, b) => s + b.count, 0);

  return (
    <div
      style={{
        background: 'var(--bg-panel)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        padding: '16px',
      }}
    >
      <h3 style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '12px' }}>
        미처리 VOC 에이징
      </h3>

      {agingLoading && <p style={{ color: 'var(--text-muted)' }}>로딩 중...</p>}

      {aging && (
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
          {bars.map((bar) => {
            const pct = total > 0 ? (bar.count / total) * 100 : 0;
            return (
              <div key={bar.label} style={{ flex: 1 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '12px',
                    marginBottom: '4px',
                  }}
                >
                  <span style={{ color: 'var(--text-muted)' }}>{bar.label}</span>
                  <span style={{ color: bar.color, fontWeight: 600 }}>{bar.count}</span>
                </div>
                <div
                  style={{
                    height: '8px',
                    borderRadius: '4px',
                    background: 'var(--bg-surface)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${pct}%`,
                      height: '100%',
                      background: bar.color,
                      borderRadius: '4px',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {vocsLoading && (
        <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>목록 로딩 중...</p>
      )}

      {agingVocs && agingVocs.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div
            style={{
              color: 'var(--text-muted)',
              fontSize: '11px',
              marginBottom: '4px',
              fontWeight: 600,
            }}
          >
            장기 미처리 VOC (상위 10)
          </div>
          {(agingVocs as AgingVoc[]).map((voc) => (
            <div
              key={voc.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 10px',
                background: 'var(--bg-surface)',
                borderRadius: '4px',
                fontSize: '12px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                  flex: 1,
                  minWidth: 0,
                }}
              >
                <span
                  style={{
                    color: 'var(--text-primary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {voc.title ?? '—'}
                </span>
                {voc.issue_code && (
                  <span style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                    {voc.issue_code}
                  </span>
                )}
              </div>
              {voc.days_open !== undefined && (
                <span
                  style={{
                    color: voc.days_open > 30 ? 'var(--danger)' : 'var(--status-amber)',
                    fontWeight: 600,
                    marginLeft: '12px',
                    flexShrink: 0,
                  }}
                >
                  {voc.days_open}일
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
