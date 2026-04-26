import { useState } from 'react';
import { useDashboardFilter } from '../hooks/useDashboardFilter';
import './DashboardPage.css';

export function DashboardPage() {
  const dashFilter = useDashboardFilter();
  const [editMode, setEditMode] = useState(false);
  const [widgetVisibility, setWidgetVisibility] = useState<Record<string, boolean>>({
    'kpi-volume': true,
    'kpi-quality': true,
    distribution: true,
    matrix: true,
    heatmap: true,
    'weekly-trend': true,
    'tag-distribution': true,
    'processing-speed': true,
    aging: true,
    assignee: true,
    'aging-vocs': true,
  });

  void dashFilter;
  void editMode;
  void setEditMode;
  void widgetVisibility;
  void setWidgetVisibility;

  return (
    <div id="page-dashboard" className={editMode ? 'edit-mode' : ''}>
      {/* Header, tabs, banner, widgets added in later steps */}
      <p style={{ padding: 24, color: 'var(--text-tertiary)' }}>Dashboard — Step 1 skeleton</p>
    </div>
  );
}
