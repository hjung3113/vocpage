import { PageTitle } from '@widgets/app-shell';
import { EmptyState } from '@shared/ui/empty-state';

/**
 * Wave 4 FE step 1 — stub. Real list/detail UI lands in step 2.
 */
export default function NoticePage() {
  return (
    <div data-testid="notice-page">
      <PageTitle title="공지사항" />
      <EmptyState title="준비 중입니다." description="Wave 4 step 2에서 데이터가 연결됩니다." />
    </div>
  );
}
