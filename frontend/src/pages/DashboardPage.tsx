import { useEffect, useState } from 'react';
import { listAdminSystems } from '../api/admin';
import { getDashboardAssignees, getDashboardMenus } from '../api/dashboard';
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { FilterContextBanner } from '../components/dashboard/FilterContextBanner';
import { GlobalTabs } from '../components/dashboard/GlobalTabs';
import { KpiSection } from '../components/dashboard/KpiSection';
import { DistributionWidget } from '../components/dashboard/DistributionWidget';
import { PriorityStatusMatrix } from '../components/dashboard/PriorityStatusMatrix';
import { DrilldownHeatmap } from '../components/dashboard/DrilldownHeatmap';
import { WeeklyTrendChart } from '../components/dashboard/WeeklyTrendChart';
import { TagDistributionChart } from '../components/dashboard/TagDistributionChart';
import { useDashboardFilter } from '../hooks/useDashboardFilter';
import './DashboardPage.css';

export function DashboardPage() {
  const {
    filter,
    setGlobalTab,
    setActiveMenu,
    setActiveAssignee,
    setDatePreset,
    setDateRange,
    buildQueryParams,
  } = useDashboardFilter();

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
  // widgetVisibility/setWidgetVisibility reserved for Step 7 LayoutEditPanel
  void widgetVisibility;
  void setWidgetVisibility;

  const [systems, setSystems] = useState<{ id: string; name: string }[]>([]);
  const [menus, setMenus] = useState<{ id: string; name: string }[]>([]);
  const [assignees, setAssignees] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    let cancelled = false;
    listAdminSystems()
      .then((items) => {
        if (!cancelled) setSystems(items.map((s) => ({ id: s.id, name: s.name })));
      })
      .catch(() => {});
    getDashboardAssignees()
      .then((data) => {
        if (!cancelled) setAssignees(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (filter.globalTab === 'all') {
      setMenus([]);
      return;
    }
    let cancelled = false;
    getDashboardMenus(filter.globalTab)
      .then((data) => {
        if (!cancelled) setMenus(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [filter.globalTab]);

  return (
    <div id="page-dashboard" className={editMode ? 'edit-mode' : ''}>
      <DashboardHeader
        filter={filter}
        menus={menus}
        assignees={assignees}
        onSetDatePreset={setDatePreset}
        onSetDateRange={setDateRange}
        onSetActiveMenu={setActiveMenu}
        onSetActiveAssignee={setActiveAssignee}
        onEditLayout={() => setEditMode(true)}
      />
      <GlobalTabs systems={systems} activeTab={filter.globalTab} onTabChange={setGlobalTab} />
      <FilterContextBanner
        filter={filter}
        systemName={systems.find((s) => s.id === filter.globalTab)?.name}
        menuName={menus.find((m) => m.id === filter.activeMenu)?.name}
        assigneeName={assignees.find((a) => a.id === filter.activeAssignee)?.name}
      />
      <div className="dash-body" style={{ padding: '0 0 24px' }}>
        <div style={{ padding: '0 0 8px' }}>
          <KpiSection filter={filter} buildQueryParams={buildQueryParams} />
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 12,
            padding: '12px 24px 0',
          }}
        >
          <DistributionWidget filter={filter} buildQueryParams={buildQueryParams} />
          <PriorityStatusMatrix filter={filter} buildQueryParams={buildQueryParams} />
        </div>
        <div style={{ padding: '12px 24px 0' }}>
          <DrilldownHeatmap
            filter={filter}
            buildQueryParams={buildQueryParams}
            onSwitchTab={setGlobalTab}
            systemName={systems.find((s) => s.id === filter.globalTab)?.name}
            menuName={menus.find((m) => m.id === filter.activeMenu)?.name}
          />
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 12,
            padding: '12px 24px 0',
          }}
        >
          <WeeklyTrendChart filter={filter} buildQueryParams={buildQueryParams} />
          <TagDistributionChart filter={filter} buildQueryParams={buildQueryParams} />
        </div>
      </div>
    </div>
  );
}
