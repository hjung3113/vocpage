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
  const [banner, setBanner] = useState<{ message: string; retry?: () => void } | null>(null);

  const rules = data?.rows ?? [];
  // UI-SPEC §Spacing: Modal width 560 → 680 when sub-table N≥3.
  const modalMinWidth = rules.length >= 3 ? '680px' : '560px';

  // Snapshot of keywords currently being submitted — drives the optimistic
  // placeholder row in TagRulesSubTable per UI-SPEC §Optimistic update.
  const [pendingCreateKeywords, setPendingCreateKeywords] = useState<string[] | null>(null);

  function handleAdd(retryKeywords?: string[]) {
    const submitted = retryKeywords ?? keywords;
    setPendingCreateKeywords(submitted);
    createRule.mutate(
      { keywords: submitted, match_mode: 'keyword' },
      {
        onSuccess: () => {
          setKeywords([]);
          setBanner(null);
          setPendingCreateKeywords(null);
        },
        onError: () => {
          // UI-SPEC §Error: retry button must re-fire the failed mutation.
          setBanner({ message: ERROR_COPY.create, retry: () => handleAdd(submitted) });
          setPendingCreateKeywords(null);
        },
      },
    );
  }

  function startEdit(rule: TagRuleT) {
    setEditingRuleId(rule.id);
    setEditKeywords(rule.keywords);
    setBanner(null);
  }

  function cancelEdit() {
    setEditingRuleId(null);
    setEditKeywords([]);
  }

  function saveEdit(ruleId: string, retryKeywords?: string[]) {
    const submitted = retryKeywords ?? editKeywords;
    if (submitted.length === 0) return;
    updateRule.mutate(
      { ruleId, keywords: submitted, match_mode: 'keyword' },
      {
        onSuccess: () => {
          setEditingRuleId(null);
          setEditKeywords([]);
          setBanner(null);
        },
        onError: () =>
          setBanner({
            message: ERROR_COPY.update,
            retry: () => saveEdit(ruleId, submitted),
          }),
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
          setBanner(null);
        },
        onError: () => {
          setConfirming(null);
          setBanner({ message: ERROR_COPY.delete, retry: () => retryDelete(rule) });
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
          setBanner(null);
        },
        onError: () => {
          setConfirming(null);
          setBanner({
            message: ERROR_COPY.update,
            retry: () => retrySuspend(rule, suspended_until),
          });
        },
      },
    );
  }

  function retryDelete(rule: TagRuleT) {
    deleteRule.mutate(rule.id, {
      onSuccess: () => setBanner(null),
      onError: () =>
        setBanner({ message: ERROR_COPY.delete, retry: () => retryDelete(rule) }),
    });
  }

  function retrySuspend(rule: TagRuleT, suspended_until: string | null) {
    suspendRule.mutate(
      { tagId: tag.id, ruleId: rule.id, suspended_until },
      {
        onSuccess: () => setBanner(null),
        onError: () =>
          setBanner({
            message: ERROR_COPY.update,
            retry: () => retrySuspend(rule, suspended_until),
          }),
      },
    );
  }

  return (
    <ModalOverlay onClose={onClose} maxWidth={modalMinWidth}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--sp-4)',
          width: '100%',
          maxHeight: 'min(720px, calc(100vh - 96px))',
        }}
      >
        <div
          style={{
            paddingBottom: 'var(--sp-3)',
            borderBottom: '1px solid var(--border-subtle)',
            flexShrink: 0,
          }}
        >
          <ModalHeader title={`${tag.name} · 규칙 ${tag.rule_ref_count}건`} onClose={onClose} />
          <p
            style={{
              margin: 'var(--sp-1) 0 0',
              fontSize: '12px',
              fontWeight: 400,
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

        {banner && (
          <MutationErrorBanner
            message={banner.message}
            onRetry={banner.retry}
            onDismiss={() => setBanner(null)}
          />
        )}

        <div style={{ flex: '1 1 auto', overflowY: 'auto', minHeight: 0 }}>
        {isLoading ? (
          <RulesSkeletonTable />
        ) : rules.length === 0 && !createRule.isPending ? (
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
            pendingPlaceholderKeywords={
              createRule.isPending ? pendingCreateKeywords ?? undefined : undefined
            }
          />
        )}
        </div>
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

