import { useContext, useEffect, useState } from 'react';
import { listSystems } from '../api/masters';
import { getDashboardAssignees, getDashboardMenus, putDashboardSettings } from '../api/dashboard';
import type { DashboardSettingsPayload } from '../api/dashboard';
import { AuthContext } from '../contexts/AuthContext';
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { FilterContextBanner } from '../components/dashboard/FilterContextBanner';
import { GlobalTabs } from '../components/dashboard/GlobalTabs';
import { KpiSection } from '../components/dashboard/KpiSection';
import { DistributionWidget } from '../components/dashboard/DistributionWidget';
import { PriorityStatusMatrix } from '../components/dashboard/PriorityStatusMatrix';
import { DrilldownHeatmap } from '../components/dashboard/DrilldownHeatmap';
import { WeeklyTrendChart } from '../components/dashboard/WeeklyTrendChart';
import { TagDistributionChart } from '../components/dashboard/TagDistributionChart';
import { ProcessingSpeedWidget } from '../components/dashboard/ProcessingSpeedWidget';
import { AgingWidget } from '../components/dashboard/AgingWidget';
import { AssigneeTable } from '../components/dashboard/AssigneeTable';
import { AgingVocList } from '../components/dashboard/AgingVocList';
import { LayoutEditPanel } from '../components/dashboard/LayoutEditPanel';
import { WidgetEditBar } from '../components/dashboard/WidgetEditBar';
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

  const authCtx = useContext(AuthContext);
  const userRole = authCtx?.user?.role;

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

  function toggleWidget(key: string) {
    setWidgetVisibility((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function handleSaveSettings(payload: DashboardSettingsPayload) {
    putDashboardSettings(payload).catch(() => {});
    setEditMode(false);
  }

  const [systems, setSystems] = useState<{ id: string; name: string }[]>([]);
  const [menus, setMenus] = useState<{ id: string; name: string }[]>([]);
  const [assignees, setAssignees] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    let cancelled = false;
    listSystems()
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
      <div className="dash-body" style={{ padding: '0 0 24px', paddingRight: editMode ? 260 : 0 }}>
        <div style={{ padding: '0 0 8px' }}>
          <div className={`dash-widget${!widgetVisibility['kpi-volume'] ? ' widget-hidden' : ''}`}>
            {editMode && (
              <WidgetEditBar
                name="KPI"
                visible={widgetVisibility['kpi-volume']}
                onToggleVisibility={() => toggleWidget('kpi-volume')}
              />
            )}
            <div className="widget-hidden-overlay">숨겨진 위젯</div>
            <KpiSection filter={filter} buildQueryParams={buildQueryParams} />
          </div>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 12,
            padding: '12px 24px 0',
          }}
        >
          <div
            className={`dash-widget${!widgetVisibility['distribution'] ? ' widget-hidden' : ''}`}
          >
            {editMode && (
              <WidgetEditBar
                name="분포"
                visible={widgetVisibility['distribution']}
                onToggleVisibility={() => toggleWidget('distribution')}
              />
            )}
            <div className="widget-hidden-overlay">숨겨진 위젯</div>
            <DistributionWidget filter={filter} buildQueryParams={buildQueryParams} />
          </div>
          <div className={`dash-widget${!widgetVisibility['matrix'] ? ' widget-hidden' : ''}`}>
            {editMode && (
              <WidgetEditBar
                name="우선순위 매트릭스"
                visible={widgetVisibility['matrix']}
                onToggleVisibility={() => toggleWidget('matrix')}
              />
            )}
            <div className="widget-hidden-overlay">숨겨진 위젯</div>
            <PriorityStatusMatrix filter={filter} buildQueryParams={buildQueryParams} />
          </div>
        </div>
        <div style={{ padding: '12px 24px 0' }}>
          <div className={`dash-widget${!widgetVisibility['heatmap'] ? ' widget-hidden' : ''}`}>
            {editMode && (
              <WidgetEditBar
                name="히트맵"
                visible={widgetVisibility['heatmap']}
                onToggleVisibility={() => toggleWidget('heatmap')}
              />
            )}
            <div className="widget-hidden-overlay">숨겨진 위젯</div>
            <DrilldownHeatmap
              filter={filter}
              buildQueryParams={buildQueryParams}
              onSwitchTab={setGlobalTab}
              systemName={systems.find((s) => s.id === filter.globalTab)?.name}
              menuName={menus.find((m) => m.id === filter.activeMenu)?.name}
            />
          </div>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 12,
            padding: '12px 24px 0',
          }}
        >
          <div
            className={`dash-widget${!widgetVisibility['weekly-trend'] ? ' widget-hidden' : ''}`}
          >
            {editMode && (
              <WidgetEditBar
                name="주간 트렌드"
                visible={widgetVisibility['weekly-trend']}
                onToggleVisibility={() => toggleWidget('weekly-trend')}
              />
            )}
            <div className="widget-hidden-overlay">숨겨진 위젯</div>
            <WeeklyTrendChart filter={filter} buildQueryParams={buildQueryParams} />
          </div>
          <div
            className={`dash-widget${!widgetVisibility['tag-distribution'] ? ' widget-hidden' : ''}`}
          >
            {editMode && (
              <WidgetEditBar
                name="태그 분포"
                visible={widgetVisibility['tag-distribution']}
                onToggleVisibility={() => toggleWidget('tag-distribution')}
              />
            )}
            <div className="widget-hidden-overlay">숨겨진 위젯</div>
            <TagDistributionChart filter={filter} buildQueryParams={buildQueryParams} />
          </div>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 12,
            padding: '12px 24px 0',
          }}
        >
          <div
            className={`dash-widget${!widgetVisibility['processing-speed'] ? ' widget-hidden' : ''}`}
          >
            {editMode && (
              <WidgetEditBar
                name="처리 속도"
                visible={widgetVisibility['processing-speed']}
                onToggleVisibility={() => toggleWidget('processing-speed')}
              />
            )}
            <div className="widget-hidden-overlay">숨겨진 위젯</div>
            <ProcessingSpeedWidget filter={filter} buildQueryParams={buildQueryParams} />
          </div>
          <div className={`dash-widget${!widgetVisibility['aging'] ? ' widget-hidden' : ''}`}>
            {editMode && (
              <WidgetEditBar
                name="에이징"
                visible={widgetVisibility['aging']}
                onToggleVisibility={() => toggleWidget('aging')}
              />
            )}
            <div className="widget-hidden-overlay">숨겨진 위젯</div>
            <AgingWidget filter={filter} buildQueryParams={buildQueryParams} />
          </div>
        </div>
        <div style={{ padding: '12px 24px 0' }}>
          <div className={`dash-widget${!widgetVisibility['assignee'] ? ' widget-hidden' : ''}`}>
            {editMode && (
              <WidgetEditBar
                name="담당자"
                visible={widgetVisibility['assignee']}
                onToggleVisibility={() => toggleWidget('assignee')}
              />
            )}
            <div className="widget-hidden-overlay">숨겨진 위젯</div>
            <AssigneeTable filter={filter} buildQueryParams={buildQueryParams} />
          </div>
        </div>
        <div style={{ padding: '12px 24px 24px' }}>
          <div className={`dash-widget${!widgetVisibility['aging-vocs'] ? ' widget-hidden' : ''}`}>
            {editMode && (
              <WidgetEditBar
                name="장기 미처리 VOC"
                visible={widgetVisibility['aging-vocs']}
                onToggleVisibility={() => toggleWidget('aging-vocs')}
              />
            )}
            <div className="widget-hidden-overlay">숨겨진 위젯</div>
            <AgingVocList
              filter={filter}
              buildQueryParams={buildQueryParams}
              onOpenDrawer={() => {}}
            />
          </div>
        </div>
      </div>
      <LayoutEditPanel
        editMode={editMode}
        widgetVisibility={widgetVisibility}
        onClose={() => setEditMode(false)}
        onSave={handleSaveSettings}
        userRole={userRole}
      />
    </div>
  );
}
