import { useVocPageController } from '../../features/voc/useVocPageController';
import { VocFilterBar } from './VocFilterBar';
import { VocTable } from './VocTable';
import { VocDrawer } from './VocDrawer';
import { EmptyState } from '../common/EmptyState';
import { ErrorState } from '../common/ErrorState';
import { LoadingState } from '../common/LoadingState';
import { PageTitle } from '../layout/PageTitle';

export function VocListPage() {
  const ctrl = useVocPageController();
  const { list } = ctrl;
  const rows = list.data?.rows ?? [];

  return (
    <div className="flex flex-col gap-3">
      <PageTitle title="VOC" />
      <VocFilterBar value={ctrl.filter} onChange={ctrl.setFilter} />
      {list.isLoading && <LoadingState data-testid="voc-loading" />}
      {list.isError && <ErrorState onRetry={() => list.refetch()} />}
      {!list.isLoading && !list.isError && rows.length === 0 && (
        <EmptyState title="VOC가 없습니다" description="필터를 조정해보세요." />
      )}
      {!list.isLoading && !list.isError && rows.length > 0 && (
        <VocTable rows={rows} onRowClick={ctrl.drawer.open} />
      )}
      <VocDrawer
        vocId={ctrl.drawer.vocId}
        notes={ctrl.notes.data}
        notesLoading={ctrl.notes.isLoading}
        pending={ctrl.pending}
        onClose={ctrl.drawer.close}
        onPatch={ctrl.actions.patch}
        onAddNote={ctrl.actions.addNote}
      />
    </div>
  );
}
