/**
 * /admin/tags — Tag Master page (W3-4)
 * Route guard: sidebar already filters by role; BE returns 403 as secondary guard.
 */
import { PageTitle } from '@widgets/app-shell';
import { TagMasterTable } from '@features/admin/tag-master/TagMasterTable';

export default function AdminTagsPage() {
  return (
    <div style={{ padding: '24px', maxWidth: '1200px' }}>
      <PageTitle title="태그 마스터" />
      <TagMasterTable />
    </div>
  );
}
