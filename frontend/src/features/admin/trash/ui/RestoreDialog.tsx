/**
 * Restore confirmation dialog for the admin trash screen (W3-5).
 * Includes a disabled 영구삭제 button (ADR 0005 §3 NextGen placeholder).
 */
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@shared/ui/dialog';
import { Button } from '@shared/ui/button';
import type { TrashListItem } from '../../../../../../shared/contracts/admin/trash';

interface Props {
  item: TrashListItem | null;
  open: boolean;
  isPending: boolean;
  onConfirm: (id: string) => void;
  onClose: () => void;
}

export function RestoreDialog({ item, open, isPending, onConfirm, onClose }: Props) {
  if (!item) return null;
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>VOC 복원</DialogTitle>
        </DialogHeader>
        <p
          style={{
            fontSize: '14px',
            color: 'var(--text-secondary)',
            lineHeight: '1.6',
          }}
        >
          <strong style={{ color: 'var(--text-primary)' }}>{item.issue_code}</strong>를 복원하시겠습니까?
          <br />
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{item.title}</span>
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            취소
          </Button>
          <Button
            onClick={() => onConfirm(item.id)}
            disabled={isPending}
            style={{ background: 'var(--accent)', color: 'var(--bg-elevated)' }}
          >
            {isPending ? '복원 중…' : '복원'}
          </Button>
          {/* 영구삭제: MVP 비활성화 (ADR 0005 §3 NextGen placeholder) */}
          <Button
            variant="outline"
            disabled
            title="MVP는 영구삭제 미지원"
            style={{ color: 'var(--text-muted)', cursor: 'not-allowed' }}
          >
            영구삭제
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
