/**
 * TagRuleActionMenu — row-action dropdown for a TagRule.
 *
 * Phase 01 Plan 06. D-13 (permission gating) + T-01-15: 일시중지 / 재개 / 삭제
 * are Admin-only and hidden from non-admin DOM. 수정 is always available.
 */
import { MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@shared/ui/dropdown-menu';
import type { TagRuleT } from '@contracts/admin/tag';
import type { TagRuleConfirmKind } from './TagRuleConfirmDialog';

export function TagRuleActionMenu({
  rule,
  isAdmin,
  suspended,
  onStartEdit,
  onRequestConfirm,
}: {
  rule: TagRuleT;
  isAdmin: boolean;
  suspended: boolean;
  onStartEdit: (rule: TagRuleT) => void;
  onRequestConfirm: (kind: TagRuleConfirmKind, rule: TagRuleT) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          data-testid="rule-action-menu"
          aria-label="규칙 작업 메뉴"
          style={{
            background: 'transparent',
            border: '1px solid var(--border-standard)',
            borderRadius: '6px',
            padding: '4px 6px',
            cursor: 'pointer',
            color: 'var(--text-secondary)',
            display: 'inline-flex',
            alignItems: 'center',
          }}
        >
          <MoreHorizontal size={14} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => onStartEdit(rule)}>수정</DropdownMenuItem>
        {isAdmin && !suspended && (
          <DropdownMenuItem onSelect={() => onRequestConfirm('suspend', rule)}>
            일시중지
          </DropdownMenuItem>
        )}
        {isAdmin && suspended && (
          <DropdownMenuItem onSelect={() => onRequestConfirm('resume', rule)}>
            재개
          </DropdownMenuItem>
        )}
        {isAdmin && (
          <DropdownMenuItem onSelect={() => onRequestConfirm('delete', rule)}>
            삭제
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
