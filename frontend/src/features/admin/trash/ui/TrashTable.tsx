/**
 * Trash table — admin-only VOC trash list with restore action (W3-5).
 * Columns: issue_code / title / status / system / menu / deleted_at / deleted_by / action
 * ADR 0005: hard-delete button is in RestoreDialog as disabled placeholder only.
 */
import { useState } from 'react';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import { Button } from '@shared/ui/button';
import { RestoreDialog } from './RestoreDialog';
import { TrashTableRow } from './TrashTableRow';
import { useTrashList, useRestoreVoc } from '../api/useTrashApi';
import type { TrashListItem } from '../../../../../../shared/contracts/admin/trash';

const TABLE_HEADERS = ['이슈 코드', '제목', '상태', '시스템', '메뉴', '삭제일시', '삭제자', '작업'];

export function TrashTable() {
  const { data, isPending, isError, refetch } = useTrashList({ page: 1, per_page: 20 });
  const restore = useRestoreVoc();
  const [selectedItem, setSelectedItem] = useState<TrashListItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  function openRestore(item: TrashListItem) {
    setSelectedItem(item);
    setDialogOpen(true);
  }

  async function handleConfirmRestore(id: string) {
    try {
      const result = await restore.mutateAsync(id);
      toast.success('복원 완료', {
        description: `${selectedItem?.issue_code ?? result.voc_id} 이 일반 목록에 복원되었습니다.`,
      });
      setDialogOpen(false);
      setSelectedItem(null);
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      if (status === 409) {
        toast.error('이미 복원된 VOC입니다.');
      } else {
        toast.error('복원에 실패했습니다. 다시 시도해주세요.');
      }
    }
  }

  if (isPending) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '14px' }}>
        불러오는 중…
      </div>
    );
  }

  if (isError) {
    return (
      <div style={{ padding: '48px', textAlign: 'center' }}>
        <p style={{ color: 'var(--status-red)', fontSize: '14px', marginBottom: '12px' }}>
          데이터를 불러오지 못했습니다.
        </p>
        <Button variant="outline" onClick={() => void refetch()}>다시 시도</Button>
      </div>
    );
  }

  const rows = data?.rows ?? [];

  if (rows.length === 0) {
    return (
      <div style={{ padding: '64px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '14px' }}>
        <Trash2 size={32} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
        <p>휴지통이 비어 있습니다.</p>
      </div>
    );
  }

  return (
    <>
      <div
        style={{
          overflowX: 'auto',
          borderRadius: '8px',
          border: '1px solid var(--border-standard)',
          background: 'var(--bg-panel)',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }} aria-label="휴지통 목록">
          <thead>
            <tr
              style={{
                borderBottom: '1px solid var(--border-standard)',
                color: 'var(--text-tertiary)',
                fontWeight: 600,
                fontSize: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.4px',
              }}
            >
              {TABLE_HEADERS.map((h) => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', whiteSpace: 'nowrap' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <TrashTableRow key={row.id} row={row} onRestore={openRestore} />
            ))}
          </tbody>
        </table>
      </div>

      <RestoreDialog
        item={selectedItem}
        open={dialogOpen}
        isPending={restore.isPending}
        onConfirm={(id) => void handleConfirmRestore(id)}
        onClose={() => {
          setDialogOpen(false);
          setSelectedItem(null);
        }}
      />
    </>
  );
}
