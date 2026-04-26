import { useState } from 'react';
import { DashboardSettingsPayload } from '../../api/dashboard';
import './LayoutEditPanel.css';

interface LayoutEditPanelProps {
  editMode: boolean;
  widgetVisibility: Record<string, boolean>;
  onClose: () => void;
  onSave: (payload: DashboardSettingsPayload) => void;
  userRole: string | undefined;
}

export function LayoutEditPanel({
  editMode,
  widgetVisibility,
  onClose,
  onSave,
  userRole,
}: LayoutEditPanelProps) {
  const [saveTarget, setSaveTarget] = useState<'user' | 'admin'>('user');
  const [defaultDateRange, setDefaultDateRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [heatmapXAxis, setHeatmapXAxis] = useState<'status' | 'priority' | 'tag'>('status');

  function handleSave() {
    onSave({
      widget_visibility: widgetVisibility,
      default_date_range: defaultDateRange,
      heatmap_default_x_axis: heatmapXAxis,
      target: saveTarget,
    });
  }

  const isAdmin = userRole === 'admin';

  return (
    <div className={`layout-edit-panel${editMode ? ' open' : ''}`}>
      <div className="panel-header">
        <span className="panel-title">레이아웃 편집</span>
        <button className="panel-close" onClick={onClose} type="button">
          ×
        </button>
      </div>
      <p className="panel-desc">위젯을 드래그하여 순서 변경, 눈 아이콘으로 숨기기</p>

      <div className="panel-section-label">저장 대상</div>
      <div className="ds-save-target-group">
        <button
          className={`ds-save-btn${saveTarget === 'user' ? ' active' : ''}`}
          onClick={() => setSaveTarget('user')}
          type="button"
        >
          내 설정 {saveTarget === 'user' ? '✓' : ''}
        </button>
        <button
          className={`ds-save-btn${saveTarget === 'admin' ? ' active' : ''}`}
          onClick={() => isAdmin && setSaveTarget('admin')}
          disabled={!isAdmin}
          type="button"
        >
          기본값 (Admin)
        </button>
      </div>

      <div className="panel-section-label">기본 설정</div>
      <div className="panel-settings-row">
        <label className="panel-settings-label">기본 기간</label>
        <select
          className="panel-select"
          value={defaultDateRange}
          onChange={(e) => setDefaultDateRange(e.target.value as '7d' | '30d' | '90d')}
        >
          <option value="7d">최근 7일</option>
          <option value="30d">최근 30일</option>
          <option value="90d">최근 90일</option>
        </select>
      </div>
      <div className="panel-settings-row">
        <label className="panel-settings-label">히트맵 X축</label>
        <select
          className="panel-select"
          value={heatmapXAxis}
          onChange={(e) => setHeatmapXAxis(e.target.value as 'status' | 'priority' | 'tag')}
        >
          <option value="status">시스템</option>
          <option value="priority">우선순위</option>
          <option value="tag">태그</option>
        </select>
      </div>

      <div className="panel-actions">
        <button className="panel-save-btn" onClick={handleSave} type="button">
          설정 저장
        </button>
        <button className="panel-cancel-btn" onClick={onClose} type="button">
          취소
        </button>
      </div>
    </div>
  );
}
