import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/ui/select';
import { VocStatus, VocPriority, type VocUpdate } from '../../../../../shared/contracts/voc';
import type { Voc } from '../../../../../shared/contracts/voc/entity';

const STATUS_LOCK_TITLE = '결과 검토가 승인되어 상태 변경이 잠겨 있습니다.';
const STATUS_LOCK_LABEL = '상태 변경 잠김: 결과 검토가 승인되었습니다.';

interface Props {
  voc: Voc;
  approvedLock: boolean;
  onPatch: (id: string, patch: VocUpdate) => Promise<unknown>;
}

export function VocStatusPriorityGrid({ voc, approvedLock, onPatch }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <label className="flex flex-col gap-1 text-xs">
        Status
        <Select
          disabled={approvedLock}
          value={voc.status}
          onValueChange={(v) =>
            onPatch(voc.id, { status: v as (typeof VocStatus.options)[number] })
          }
        >
          <SelectTrigger
            data-testid="drawer-status"
            title={approvedLock ? STATUS_LOCK_TITLE : undefined}
            aria-label={approvedLock ? STATUS_LOCK_LABEL : '상태 변경'}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {VocStatus.options.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>
      <label className="flex flex-col gap-1 text-xs">
        Priority
        <Select
          value={voc.priority}
          onValueChange={(v) =>
            onPatch(voc.id, { priority: v as (typeof VocPriority.options)[number] })
          }
        >
          <SelectTrigger data-testid="drawer-priority">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {VocPriority.options.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>
    </div>
  );
}
