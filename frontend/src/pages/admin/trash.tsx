/**
 * Admin Trash page — Wave 3 Phase C (W3-5).
 * Route: /admin/vocs/trash (admin only).
 * Spec: requirements.md §15.4 + feature-voc.md §9.4.7.
 */
import { Navigate } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { useRole } from '@entities/user/model/useRole';
import { PageTitle } from '@widgets/app-shell';
import { TrashTable } from '@features/admin/trash';

export default function AdminTrashPage() {
  const { isAdmin } = useRole();

  // Non-admin → redirect to /voc (FE role guard; BE is the authoritative gate)
  if (!isAdmin) {
    return <Navigate to="/voc" replace />;
  }

  return (
    <div style={{ padding: '24px 32px' }}>
      <PageTitle title="휴지통" />
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '24px',
        }}
      >
        <Trash2 size={20} style={{ color: 'var(--text-tertiary)' }} aria-hidden />
        <h1
          style={{
            fontSize: '18px',
            fontWeight: 600,
            color: 'var(--text-primary)',
            fontFamily: 'Pretendard Variable, Pretendard, sans-serif',
          }}
        >
          휴지통
        </h1>
        <span
          style={{
            fontSize: '12px',
            color: 'var(--text-tertiary)',
            marginLeft: '4px',
          }}
        >
          소프트 삭제된 VOC — Admin만 복원 가능
        </span>
      </div>
      <TrashTable />
    </div>
  );
}
