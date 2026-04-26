import { useEffect, useRef, useState } from 'react';
import { Calendar, LayoutPanelLeft } from 'lucide-react';
import { DashboardFilterState } from '../../hooks/useDashboardFilter';
import './DashboardHeader.css';

interface DashboardHeaderProps {
  filter: DashboardFilterState;
  menus: { id: string; name: string }[];
  assignees: { id: string; name: string }[];
  onSetDatePreset: (preset: '1m' | '3m' | '1y' | 'all' | 'custom') => void;
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
  { label: '1달', value: '1m' as const },
  { label: '3달', value: '3m' as const },
  { label: '1년', value: '1y' as const },
  { label: '전체', value: 'all' as const },
  { label: '커스텀', value: 'custom' as const },
];

export function DashboardHeader({
  filter,
  menus,
  assignees,
  onSetDatePreset,
  onSetDateRange,
  onSetActiveMenu,
  onSetActiveAssignee,
  onEditLayout,
}: DashboardHeaderProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [draftStart, setDraftStart] = useState(filter.dateRange.startDate);
  const [draftEnd, setDraftEnd] = useState(filter.dateRange.endDate);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pickerOpen) return;
    function handleClick(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [pickerOpen]);

  function handlePresetClick(preset: '1m' | '3m' | '1y' | 'all' | 'custom') {
    if (preset === 'custom') {
      setDraftStart(filter.dateRange.startDate);
      setDraftEnd(filter.dateRange.endDate);
      setPickerOpen(true);
      onSetDatePreset('custom');
    } else {
      setPickerOpen(false);
      onSetDatePreset(preset);
    }
  }

  function handleCalendarBtnClick() {
    if (filter.datePreset === 'custom') {
      setDraftStart(filter.dateRange.startDate);
      setDraftEnd(filter.dateRange.endDate);
      setPickerOpen((v) => !v);
    }
  }

  function handleApply() {
    if (!draftStart || !draftEnd || draftStart > draftEnd) return;
    onSetDateRange(draftStart, draftEnd);
    setPickerOpen(false);
  }

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
              onClick={() => handlePresetClick(p.value)}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="date-range-wrap" ref={pickerRef}>
          <button
            className={`date-range-btn${filter.datePreset === 'custom' ? ' custom-active' : ''}`}
            onClick={handleCalendarBtnClick}
          >
            <Calendar size={13} />
            {formatDateRange(filter.dateRange.startDate, filter.dateRange.endDate)}
          </button>

          {pickerOpen && (
            <div className="date-picker-popover">
              <input
                type="date"
                className="date-picker-input"
                value={draftStart}
                max={draftEnd || undefined}
                onChange={(e) => setDraftStart(e.target.value)}
              />
              <span className="date-picker-sep">–</span>
              <input
                type="date"
                className="date-picker-input"
                value={draftEnd}
                min={draftStart || undefined}
                onChange={(e) => setDraftEnd(e.target.value)}
              />
              <button
                className="date-picker-apply"
                disabled={!draftStart || !draftEnd || draftStart > draftEnd}
                onClick={handleApply}
              >
                적용
              </button>
            </div>
          )}
        </div>

        <button className="edit-layout-btn" onClick={onEditLayout}>
          <LayoutPanelLeft size={13} />
          레이아웃 편집
        </button>
      </div>
    </header>
  );
}
