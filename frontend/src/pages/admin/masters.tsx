/**
 * /admin/masters — External Masters admin page (W3-6)
 * Role guard: admin / manager / dev (OQ-2 Option B). User → /voc redirect.
 * BE 403 is secondary defense.
 * Spec: requirements.md §16.3, external-masters.md §0
 */
import { Navigate } from 'react-router-dom';
import { PageLayout, PageHeader } from '@widgets/app-shell';
import { useRole } from '@entities/user/model/useRole';
import { MastersTable } from '@features/admin/external-masters';

export default function AdminMastersPage() {
  const { isAdmin, isManager, isDev } = useRole();

  // User → redirect; dev gets read-only view (OQ-2 Option B)
  if (!(isAdmin || isManager || isDev)) {
    return <Navigate to="/voc" replace />;
  }

  // Only admin/manager may trigger refresh (dev is read-only)
  const canRefresh = isAdmin || isManager;

  return (
    <PageLayout header={<PageHeader title="외부 마스터" />}>
      <MastersTable canRefresh={canRefresh} />
    </PageLayout>
  );
}
