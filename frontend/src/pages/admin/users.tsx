/**
 * /admin/users — Admin Users page (W3-7 Phase E)
 * Role guard: admin only. Non-admin → /voc redirect.
 * BE 404 is secondary defense (existence hiding, mirrors trash pattern).
 * Spec: requirements.md §15.2
 */
import { Navigate } from 'react-router-dom';
import { PageLayout, PageHeader } from '@widgets/app-shell';
import { useRole } from '@entities/user/model/useRole';
import { UsersTable } from '@features/admin/users';
import { Button } from '@shared/ui/button';

function InviteButton() {
  return (
    <Button
      variant="outline"
      size="sm"
      disabled
      title="사용자 초대는 NextGen에서 활성화 예정입니다."
      aria-label="사용자 초대 (비활성)"
    >
      사용자 초대
    </Button>
  );
}

export default function AdminUsersPage() {
  const { isAdmin } = useRole();

  // Non-admin → redirect to /voc (FE role guard; BE is the authoritative gate)
  if (!isAdmin) {
    return <Navigate to="/voc" replace />;
  }

  return (
    <PageLayout
      header={
        <PageHeader
          title="사용자"
          actions={<InviteButton />}
        />
      }
    >
      <UsersTable />
    </PageLayout>
  );
}
