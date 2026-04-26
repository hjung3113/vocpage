import { Calendar, LayoutPanelLeft } from 'lucide-react';
import { DashboardFilterState } from '../../hooks/useDashboardFilter';
import './DashboardHeader.css';

interface DashboardHeaderProps {
  filter: DashboardFilterState;
  menus: { id: string; name: string }[];
  assignees: { id: string; name: string }[];
  onSetDatePreset: (preset: '7d' | '30d' | '90d' | 'custom') => void;
  onSetDateRange: (start: string, end: string) => void;
  onSetActiveMenu: (menuId: string | null) => void;
  onSetActiveAssignee: (assigneeId: string | null) => void;
  onEditLayout: () => void;
}

function formatDateRange(start: string, end: string): string {
  if (!start || !end) return '날짜 선택';
  const fmt = (iso: string) => iso.replace(/^\d{4}-/, '').replace(/-/g, '.');
  return `${fmt(start)}–${fmt(end)}`;
}

const DATE_PRESETS = [
  { label: '7일', value: '7d' as const },
  { label: '30일', value: '30d' as const },
  { label: '90일', value: '90d' as const },
  { label: '커스텀', value: 'custom' as const },
];

export function DashboardHeader({
  filter,
  menus,
  assignees,
  onSetDatePreset,
  onSetActiveMenu,
  onSetActiveAssignee,
  onEditLayout,
}: DashboardHeaderProps) {
  return (
    <header className="dashboard-header">
      <span className="dashboard-header-title">대시보드</span>
      <div className="dashboard-header-controls">
        {filter.globalTab !== 'all' && (
          <div className="menu-selector-wrap">
            <span className="menu-selector-sep">›</span>
            <select
              className="filter-select"
              value={filter.activeMenu ?? ''}
              onChange={(e) => onSetActiveMenu(e.target.value || null)}
            >
              <option value="">전체</option>
              {menus.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <select
          className="filter-select"
          value={filter.activeAssignee ?? ''}
          onChange={(e) => onSetActiveAssignee(e.target.value || null)}
        >
          <option value="">담당자: 전체</option>
          {assignees.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>

        <div className="date-btn-group">
          {DATE_PRESETS.map((p) => (
            <button
              key={p.value}
              className={filter.datePreset === p.value ? 'active' : ''}
              onClick={() => onSetDatePreset(p.value)}
            >
              {p.label}
            </button>
          ))}
        </div>

        <button className="date-range-btn">
          <Calendar size={13} />
          {formatDateRange(filter.dateRange.startDate, filter.dateRange.endDate)}
        </button>

        <button className="edit-layout-btn" onClick={onEditLayout}>
          <LayoutPanelLeft size={13} />
          레이아웃 편집
        </button>
      </div>
    </header>
  );
}
