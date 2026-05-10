/**
 * DashboardPage.tsx — Wave 2 Phase D
 * Route component for /dashboard. Composes DashboardShell + EditModeToggle.
 */
import '../styles/dashboard-rgl.css';
import { StickyHeaderLayout, PageHeader } from '@widgets/app-shell';
import {
  DashboardShell,
  EditModeToggle,
  DashboardSettingsDialog,
  useDashboardDraft,
  DashboardFilterProvider,
} from '@features/dashboard';

export default function DashboardPage() {
  const {
    layouts,
    isEditing,
    isDirty,
    isSaving,
    hiddenWidgetIds,
    setIsEditing,
    onLayoutChange,
    save,
    discard,
  } = useDashboardDraft();

  return (
    <StickyHeaderLayout
      header={
        <PageHeader
          title="대시보드"
          actions={
            <div className="flex items-center gap-1">
              <DashboardSettingsDialog />
              <EditModeToggle
                isEditing={isEditing}
                isDirty={isDirty}
                isSaving={isSaving}
                onToggle={setIsEditing}
                onSave={save}
                onDiscard={discard}
              />
            </div>
          }
        />
      }
    >
      <DashboardFilterProvider>
        <DashboardShell
          layouts={layouts}
          isEditing={isEditing}
          onLayoutChange={onLayoutChange}
          hiddenWidgetIds={hiddenWidgetIds}
        />
      </DashboardFilterProvider>
    </StickyHeaderLayout>
  );
}
