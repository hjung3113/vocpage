import { useEffect, useState } from 'react';
import { listAdminSystems } from '../api/admin';
import { getDashboardAssignees, getDashboardMenus } from '../api/dashboard';
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { FilterContextBanner } from '../components/dashboard/FilterContextBanner';
import { GlobalTabs } from '../components/dashboard/GlobalTabs';
import { useDashboardFilter } from '../hooks/useDashboardFilter';
import './DashboardPage.css';

export function DashboardPage() {
  const { filter, setGlobalTab, setActiveMenu, setActiveAssignee, setDatePreset, setDateRange } =
    useDashboardFilter();

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

  const [systems, setSystems] = useState<{ id: string; name: string }[]>([]);
  const [menus, setMenus] = useState<{ id: string; name: string }[]>([]);
  const [assignees, setAssignees] = useState<{ id: string; name: string }[]>([]);

  void widgetVisibility;
  void setWidgetVisibility;

  useEffect(() => {
    listAdminSystems()
      .then((items) => setSystems(items.map((s) => ({ id: s.id, name: s.name }))))
      .catch(() => {});
    getDashboardAssignees()
      .then(setAssignees)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (filter.globalTab !== 'all') {
      getDashboardMenus(filter.globalTab)
        .then(setMenus)
        .catch(() => {});
    } else {
      setMenus([]);
    }
  }, [filter.globalTab]);

  return (
    <div id="page-dashboard" className={editMode ? 'edit-mode' : ''}>
      <DashboardHeader
        filter={filter}
        systems={systems}
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
      <div className="dash-body" style={{ padding: '16px 24px' }}>
        <p style={{ color: 'var(--text-tertiary)' }}>Dashboard — widgets coming in next steps</p>
      </div>
    </div>
  );
}
