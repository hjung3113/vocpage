/**
 * DashboardPage.tsx — Wave 2 Phase D
 * Route component for /dashboard. Composes DashboardShell + EditModeToggle.
 */
import '../styles/dashboard-rgl.css';
import { StickyHeaderLayout, PageHeader } from '@widgets/app-shell';
import {
  DashboardShell,
  EditModeToggle,
  useDashboardDraft,
  DashboardFilterProvider,
} from '@features/dashboard';

export default function DashboardPage() {
  const { layouts, isEditing, isDirty, isSaving, setIsEditing, onLayoutChange, save, discard } =
    useDashboardDraft();

  return (
    <StickyHeaderLayout
      header={
        <PageHeader
          title="대시보드"
          actions={
            <EditModeToggle
              isEditing={isEditing}
              isDirty={isDirty}
              isSaving={isSaving}
              onToggle={setIsEditing}
              onSave={save}
              onDiscard={discard}
            />
          }
        />
      }
    >
      <DashboardFilterProvider>
        <DashboardShell
          layouts={layouts}
          isEditing={isEditing}
          onLayoutChange={onLayoutChange}
        />
      </DashboardFilterProvider>
    </StickyHeaderLayout>
  );
}
