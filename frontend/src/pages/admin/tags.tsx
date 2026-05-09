/**
 * /admin/tags — Tag Master page (W3-4)
 * Role guard: admin/manager/dev (ADR 0004 Option D). User → /voc redirect.
 * BE 403 is secondary defense.
 */
import { Navigate } from 'react-router-dom';
import { PageLayout, PageHeader } from '@widgets/app-shell';
import { useRole } from '@entities/user/model/useRole';
import { TagMasterTable } from '@features/admin/tag-master/TagMasterTable';

export default function AdminTagsPage() {
  const { isAdmin, isManager, isDev } = useRole();
  if (!(isAdmin || isManager || isDev)) {
    return <Navigate to="/voc" replace />;
  }
  return (
    <PageLayout header={<PageHeader title="태그 마스터" />}>
      <TagMasterTable />
    </PageLayout>
  );
}
