/**
 * Admin Trash page — Wave 3 Phase C (W3-5).
 * Route: /admin/vocs/trash (admin only).
 * Spec: requirements.md §15.4 + feature-voc.md §9.4.7.
 */
import { Navigate } from 'react-router-dom';
import { useRole } from '@entities/user/model/useRole';
import { StickyHeaderLayout, PageHeader } from '@widgets/app-shell';
import { TrashTable } from '@features/admin/trash';

export default function AdminTrashPage() {
  const { isAdmin } = useRole();

  // Non-admin → redirect to /voc (FE role guard; BE is the authoritative gate)
  if (!isAdmin) {
    return <Navigate to="/voc" replace />;
  }

  return (
    <StickyHeaderLayout header={<PageHeader title="휴지통" />}>
      <p
        style={{
          fontSize: '12px',
          color: 'var(--text-tertiary)',
          marginBottom: '16px',
        }}
      >
        소프트 삭제된 VOC — Admin만 복원 가능
      </p>
      <TrashTable />
    </StickyHeaderLayout>
  );
}
