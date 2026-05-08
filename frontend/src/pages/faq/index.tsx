import { PageTitle } from '@widgets/app-shell';
import { EmptyState } from '@shared/ui/empty-state';

/**
 * Wave 4 FE step 1 — stub. Real list/search UI lands in step 3.
 */
export default function FaqPage() {
  return (
    <div data-testid="faq-page">
      <PageTitle title="FAQ" />
      <EmptyState title="준비 중입니다." description="Wave 4 step 3에서 데이터가 연결됩니다." />
    </div>
  );
}
