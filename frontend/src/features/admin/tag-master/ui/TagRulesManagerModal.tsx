/**
 * TagRulesManagerModal — modal-based CRUD surface for tag rules.
 *
 * Phase 01 Plan 06 (Wave 3) · Tag Rules consolidation.
 * Spec: 01-UI-SPEC.md §TagRulesManagerModal anatomy + §Copywriting Contract.
 * Decisions: D-01 (modal-based row action) · D-05 (chip array UX)
 *           · D-06 (match_mode select) · D-07 (server-derived created_by)
 *           · D-13 (permission gating).
 * Threats:  T-01-15 — destructive menu items hidden for non-admin (sub-table);
 *           AlertDialog confirmation gate before delete/suspend/resume.
 *
 * Sub-components: TagRulesSubTable + TagRuleConfirmDialog (sibling files for
 * file-size discipline). Reuses ModalOverlay + ModalHeader from
 * TagMasterCreateModal.
 */
import { useState } from 'react';
import {
  useAdminTagRules,
  useCreateTagRule,
  useUpdateTagRule,
  useDeleteTagRule,
  useSuspendTagRule,
} from '../api/tag-master.api';
import { useRole } from '@entities/user/model/useRole';
import { ModalOverlay, ModalHeader } from './TagMasterCreateModal';
import { TagRuleAddForm } from './TagRuleAddForm';
import { TagRulesSubTable } from './TagRulesSubTable';
import { TagRuleConfirmDialog, type TagRuleConfirmKind } from './TagRuleConfirmDialog';
import {
  EmptyRulesState,
  MutationErrorBanner,
  RulesSkeletonTable,
} from './TagRulesModalStates';
import type { TagMasterItem, TagRuleT } from '@contracts/admin/tag';

interface Props {
  tag: TagMasterItem;
  onClose: () => void;
}

const ERROR_COPY = {
  create: '규칙을 추가하지 못했습니다. 잠시 후 다시 시도해 주세요',
  update: '규칙을 변경하지 못했습니다. 잠시 후 다시 시도해 주세요',
  delete: '규칙을 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요',
} as const;

const SUSPEND_FAR_FUTURE_ISO = '2999-12-31T00:00:00.000Z';

export function TagRulesManagerModal({ tag, onClose }: Props) {
  const { isAdmin } = useRole();
  const { data, isLoading } = useAdminTagRules(tag.id);
  const createRule = useCreateTagRule(tag.id);
  const updateRule = useUpdateTagRule(tag.id);
  const deleteRule = useDeleteTagRule(tag.id);
  const suspendRule = useSuspendTagRule();

  const [keywords, setKeywords] = useState<string[]>([]);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [editKeywords, setEditKeywords] = useState<string[]>([]);
  const [confirming, setConfirming] = useState<{ kind: TagRuleConfirmKind; rule: TagRuleT } | null>(
    null,
  );
  const [bannerError, setBannerError] = useState<string | null>(null);

  const rules = data?.rows ?? [];

  function handleAdd() {
    createRule.mutate(
      { keywords, match_mode: 'keyword' },
      {
        onSuccess: () => {
          setKeywords([]);
          setBannerError(null);
        },
        onError: () => setBannerError(ERROR_COPY.create),
      },
    );
  }

  function startEdit(rule: TagRuleT) {
    setEditingRuleId(rule.id);
    setEditKeywords(rule.keywords);
    setBannerError(null);
  }

  function cancelEdit() {
    setEditingRuleId(null);
    setEditKeywords([]);
  }

  function saveEdit(ruleId: string) {
    if (editKeywords.length === 0) return;
    updateRule.mutate(
      { ruleId, keywords: editKeywords, match_mode: 'keyword' },
      {
        onSuccess: () => {
          setEditingRuleId(null);
          setEditKeywords([]);
          setBannerError(null);
        },
        onError: () => setBannerError(ERROR_COPY.update),
      },
    );
  }

  function confirmAction() {
    if (!confirming) return;
    const { kind, rule } = confirming;
    if (kind === 'delete') {
      deleteRule.mutate(rule.id, {
        onSuccess: () => {
          setConfirming(null);
          setBannerError(null);
        },
        onError: () => {
          setConfirming(null);
          setBannerError(ERROR_COPY.delete);
        },
      });
      return;
    }
    const suspended_until = kind === 'suspend' ? SUSPEND_FAR_FUTURE_ISO : null;
    suspendRule.mutate(
      { tagId: tag.id, ruleId: rule.id, suspended_until },
      {
        onSuccess: () => {
          setConfirming(null);
          setBannerError(null);
        },
        onError: () => {
          setConfirming(null);
          setBannerError(ERROR_COPY.update);
        },
      },
    );
  }

  return (
    <ModalOverlay onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: '560px' }}>
        <div>
          <ModalHeader title={`${tag.name} · 규칙 ${tag.rule_ref_count}건`} onClose={onClose} />
          <p
            style={{
              margin: '4px 0 0',
              fontSize: '12px',
              color: 'var(--text-tertiary)',
              lineHeight: 1.4,
            }}
          >
            자동 태깅 규칙 관리
          </p>
        </div>

        <TagRuleAddForm
          keywords={keywords}
          onKeywordsChange={setKeywords}
          onSubmit={handleAdd}
          pending={createRule.isPending}
        />

        {bannerError && (
          <MutationErrorBanner message={bannerError} onDismiss={() => setBannerError(null)} />
        )}

        {isLoading ? (
          <RulesSkeletonTable />
        ) : rules.length === 0 ? (
          <EmptyRulesState />
        ) : (
          <TagRulesSubTable
            rules={rules}
            isAdmin={isAdmin}
            editingRuleId={editingRuleId}
            editKeywords={editKeywords}
            onEditKeywordsChange={setEditKeywords}
            onStartEdit={startEdit}
            onCancelEdit={cancelEdit}
            onSaveEdit={saveEdit}
            onRequestConfirm={(kind, rule) => setConfirming({ kind, rule })}
            updatePending={updateRule.isPending}
          />
        )}
      </div>

      {confirming && (
        <TagRuleConfirmDialog
          kind={confirming.kind}
          pending={deleteRule.isPending || suspendRule.isPending}
          onCancel={() => setConfirming(null)}
          onConfirm={confirmAction}
        />
      )}
    </ModalOverlay>
  );
}

