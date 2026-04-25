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

// Status label → CSS token mapping
const STATUS_COLORS: Record<string, string> = {
  접수: 'var(--status-blue)',
  검토중: 'var(--status-amber)',
  처리중: 'var(--status-purple)',
  완료: 'var(--status-green)',
  드랍: 'var(--status-red)',
};

const FALLBACK_COLORS = [
  'var(--brand)',
  'var(--accent)',
  'var(--status-amber)',
  'var(--status-purple)',
  'var(--status-green)',
  'var(--status-red)',
];

interface Props {
  apiFilters: DashboardFilters;
}

function StatusDonut({ data, total }: { data: { label: string; count: number }[]; total: number }) {
  if (total === 0) {
    return (
      <div
        style={{
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          background: 'var(--bg-surface)',
          flexShrink: 0,
        }}
      />
    );
  }

  // Build conic-gradient segments
  let cumulative = 0;
  const segments = data.map((item, i) => {
    const pct = (item.count / total) * 100;
    const color = STATUS_COLORS[item.label] ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length];
    const segment = `${color} ${cumulative}% ${cumulative + pct}%`;
    cumulative += pct;
    return segment;
  });

  return (
    <div style={{ position: 'relative', width: '120px', height: '120px', flexShrink: 0 }}>
      <div
        style={{
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          background: `conic-gradient(${segments.join(', ')})`,
        }}
      />
      {/* Donut hole */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          background: 'var(--bg-panel)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          style={{ color: 'var(--text-primary)', fontSize: '18px', fontWeight: 700, lineHeight: 1 }}
        >
          {total}
        </span>
        <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>전체</span>
      </div>
    </div>
  );
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
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          {activeType === 'status' && <StatusDonut data={data} total={total} />}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
            {data.map((item, i) => {
              const pct = total > 0 ? (item.count / total) * 100 : 0;
              const color =
                activeType === 'status'
                  ? (STATUS_COLORS[item.label] ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length])
                  : 'var(--brand)';
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {activeType === 'status' && (
                        <div
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: color,
                            flexShrink: 0,
                          }}
                        />
                      )}
                      <span style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                    </div>
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
                        background: color,
                        borderRadius: '3px',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
