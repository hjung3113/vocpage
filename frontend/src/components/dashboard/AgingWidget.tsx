import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getAging } from '../../api/dashboard';
import type { DashboardQueryParams } from '../../api/dashboard';
import type { DashboardFilterState } from '../../hooks/useDashboardFilter';
import { DimSelector } from './DimSelector';
import { buildNav } from '../../utils/dashboardNav';
import './AgingWidget.css';

export interface AgingWidgetProps {
  filter: DashboardFilterState;
  buildQueryParams: () => DashboardQueryParams;
}

export function AgingWidget({ filter, buildQueryParams }: AgingWidgetProps) {
  const navigate = useNavigate();
  const [dim, setDim] = useState<'all' | 'system' | 'menu'>('all');
  const params = useMemo(() => buildQueryParams(), [buildQueryParams]);

  const { data } = useQuery({
    queryKey: ['dashboard-aging', dim, params],
    queryFn: () => getAging(params),
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="widget">
      <div className="widget-header">
        <span className="widget-title">VOC 에이징</span>
        <DimSelector
          options={[
            { label: '전체', value: 'all' },
            { label: '시스템별', value: 'system' },
            { label: '메뉴별', value: 'menu' },
          ]}
          value={dim}
          onChange={(v) => setDim(v as 'all' | 'system' | 'menu')}
          hiddenValues={filter.globalTab !== 'all' ? ['system'] : []}
        />
      </div>

      <div className="aging-legend">
        <div className="aging-legend-item">
          <div className="aging-swatch aging-safe" />
          <span>≤7일</span>
        </div>
        <div className="aging-legend-item">
          <div className="aging-swatch aging-warn" />
          <span>8~30일</span>
        </div>
        <div className="aging-legend-item">
          <div className="aging-swatch aging-crit" />
          <span>31일+</span>
        </div>
      </div>

      {(data?.rows ?? []).map((row) => (
        <div className="aging-item" key={row.id}>
          <div className="aging-item-label">
            <span className="aging-item-name">{row.name}</span>
            <div className="aging-item-counts">
              <span className="aging-count-safe">{row.safe}</span>
              <span className="aging-count-warn">{row.warn}</span>
              <span className="aging-count-crit">{row.crit}</span>
            </div>
          </div>
          <div className="aging-bar">
            {row.total > 0 && (
              <>
                {row.safe > 0 && (
                  <div
                    className="aging-seg aging-safe"
                    style={{ width: `${(row.safe / row.total) * 100}%` }}
                    onClick={() =>
                      navigate(
                        buildNav(params, {
                          status: '접수,검토중,처리중',
                          agingRange: 'le7',
                        }),
                      )
                    }
                  />
                )}
                {row.warn > 0 && (
                  <div
                    className="aging-seg aging-warn"
                    style={{ width: `${(row.warn / row.total) * 100}%` }}
                    onClick={() =>
                      navigate(
                        buildNav(params, {
                          status: '접수,검토중,처리중',
                          agingRange: 'd8to30',
                        }),
                      )
                    }
                  />
                )}
                {row.crit > 0 && (
                  <div
                    className="aging-seg aging-crit"
                    style={{ width: `${(row.crit / row.total) * 100}%` }}
                    onClick={() =>
                      navigate(
                        buildNav(params, {
                          status: '접수,검토중,처리중',
                          agingRange: 'gt30',
                        }),
                      )
                    }
                  />
                )}
              </>
            )}
          </div>
        </div>
      ))}

      {(data?.rows ?? []).length === 0 && <p className="aging-empty">데이터 없음</p>}
    </div>
  );
}
