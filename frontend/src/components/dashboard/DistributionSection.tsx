import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchDistribution, type DashboardFilters } from '../../api/dashboard';

type DistType = 'status' | 'priority' | 'voc_type' | 'tag';

const TABS: { key: DistType; label: string }[] = [
  { key: 'status', label: '상태' },
  { key: 'priority', label: '우선순위' },
  { key: 'voc_type', label: '유형' },
  { key: 'tag', label: '태그' },
];

interface Props {
  apiFilters: DashboardFilters;
}

export function DistributionSection({ apiFilters }: Props) {
  const [activeType, setActiveType] = useState<DistType>('status');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard', 'distribution', activeType, apiFilters],
    queryFn: () => fetchDistribution(apiFilters, activeType),
  });

  const total = data?.reduce((s, d) => s + d.count, 0) ?? 0;

  return (
    <div
      style={{
        background: 'var(--bg-panel)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        padding: '16px',
      }}
    >
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveType(tab.key)}
            style={{
              padding: '4px 12px',
              borderRadius: '4px',
              border: '1px solid var(--border)',
              background: activeType === tab.key ? 'var(--brand)' : 'transparent',
              color: activeType === tab.key ? 'var(--text-on-brand)' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading && <p style={{ color: 'var(--text-muted)' }}>로딩 중...</p>}
      {isError && <p style={{ color: 'var(--danger)' }}>데이터를 불러오지 못했습니다.</p>}

      {data && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {data.map((item) => {
            const pct = total > 0 ? (item.count / total) * 100 : 0;
            return (
              <div key={item.label}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '13px',
                    marginBottom: '4px',
                  }}
                >
                  <span style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                  <span style={{ color: 'var(--text-primary)' }}>{item.count}</span>
                </div>
                <div
                  style={{
                    height: '6px',
                    borderRadius: '3px',
                    background: 'var(--bg-surface)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${pct}%`,
                      height: '100%',
                      background: 'var(--brand)',
                      borderRadius: '3px',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
