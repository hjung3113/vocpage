import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAgingVocs } from '../../api/dashboard';
import type { DashboardQueryParams, AgingVoc } from '../../api/dashboard';
import type { DashboardFilterState } from '../../hooks/useDashboardFilter';
import { DimSelector } from './DimSelector';
import './AgingVocList.css';

export interface AgingVocListProps {
  filter: DashboardFilterState;
  buildQueryParams: () => DashboardQueryParams;
  onOpenDrawer: (vocId: string) => void;
}

function agingBadgeClass(days: number): string {
  if (days >= 30) return 'd-badge d-badge-red';
  if (days >= 14) return 'd-badge d-badge-amber';
  return '';
}

const PRIORITY_LABELS: Record<string, string> = {
  urgent: '긴급',
  high: '높음',
  medium: '보통',
  low: '낮음',
};

export function AgingVocList({ filter, buildQueryParams, onOpenDrawer }: AgingVocListProps) {
  const isAllTab = filter.globalTab === 'all';
  const [dim, setDim] = useState<string>('all');
  const params = useMemo(() => buildQueryParams(), [buildQueryParams]);

  const dimOptions = isAllTab
    ? [
        { label: '전체', value: 'all' },
        { label: '시스템별', value: 'system' },
      ]
    : [
        { label: '전체', value: 'all' },
        { label: '메뉴별', value: 'menu' },
      ];

  const { data = [] } = useQuery<AgingVoc[]>({
    queryKey: ['dashboard-aging-vocs', dim, params],
    queryFn: () => getAgingVocs({ ...params, limit: 10 }),
    staleTime: 5 * 60 * 1000,
  });

  const dimLabel = isAllTab ? '시스템' : '메뉴';

  return (
    <div className="widget">
      <div className="widget-header">
        <span className="widget-title">장기 미처리 VOC Top 10</span>
        <DimSelector options={dimOptions} value={dim} onChange={setDim} />
      </div>

      <table className="aging-table">
        <thead>
          <tr>
            <th>이슈ID</th>
            <th>제목</th>
            <th>{dimLabel}</th>
            <th>우선순위</th>
            <th>경과일</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => {
            const badgeClass = agingBadgeClass(row.daysSinceCreated);
            const dimValue = isAllTab ? row.systemName : row.menuName;
            const priorityLabel = PRIORITY_LABELS[row.priority] ?? row.priority;
            const isUrgentOrHigh = row.priority === 'urgent' || row.priority === 'high';

            return (
              <tr key={row.id} onClick={() => onOpenDrawer(row.id)}>
                <td className="code">{row.issue_code ?? '—'}</td>
                <td className="title-col">{row.title}</td>
                <td>{dimValue}</td>
                <td>
                  {isUrgentOrHigh ? (
                    <span
                      className={`d-badge d-badge-${row.priority === 'urgent' ? 'urgent' : 'high'}`}
                    >
                      {priorityLabel}
                    </span>
                  ) : (
                    priorityLabel
                  )}
                </td>
                <td>
                  {badgeClass ? (
                    <span className={badgeClass}>{row.daysSinceCreated}일</span>
                  ) : (
                    `${row.daysSinceCreated}일`
                  )}
                </td>
              </tr>
            );
          })}
          {data.length === 0 && (
            <tr>
              <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-quaternary)' }}>
                데이터 없음
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
