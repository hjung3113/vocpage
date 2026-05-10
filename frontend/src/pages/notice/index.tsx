/**
 * Notice page — Wave 4 FE step 2.
 * Spec: docs/specs/requires/feature-notice-faq.md §10.3, §10.5.
 *
 * Decision: 인라인 펼침 (drawer 미채택). 사유:
 *   1. 사이드 drawer 는 VOC 검토 패널이 점유 — 동시 사용 시 z-index/스크롤 충돌.
 *   2. 공지 본문은 짧은 richtext 가 대부분 — list ↔ detail 컨텍스트 분리가 부담.
 *   3. 모바일 폭에서 inline 가 viewport 활용도가 높다.
 * (D-NOTICE-1, 2026-05-09)
 *
 * 관리 모드 진입은 URL `?mode=admin` 으로 제어. 권한이 없는 user/dev 는 '관리'
 * 버튼 자체가 DOM 에 렌더되지 않는다 (§10.5.1 — display:none 이 아닌 미렌더).
 */
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { StickyHeaderLayout, PageHeader } from '@widgets/app-shell';
import { Button } from '@shared/ui/button';
import { EmptyState } from '@shared/ui/empty-state';
import { LoadingState } from '@shared/ui/skeleton';
import { ErrorState } from '@shared/ui/error-state';
import { useRole } from '@entities/user/model/useRole';
import {
  noticeApi,
  noticeQueryKeys,
  useNoticeList,
  useCreateNotice,
  useDeleteNotice,
  useRestoreNotice,
  type Notice,
  type NoticeCreate,
  type NoticeUpdate,
} from '@entities/notice';
import { NoticeRow } from './NoticeRow';
import { NoticeFormDialog } from './NoticeFormDialog';

function isWithinPeriod(n: Notice, now = new Date()): boolean {
  const fromOk = !n.visible_from || new Date(n.visible_from) <= now;
  const toOk = !n.visible_to || new Date(n.visible_to) >= now;
  return fromOk && toOk;
}

export default function NoticePage() {
  const { isAdmin, isManager } = useRole();
  const canManage = isAdmin || isManager;

  const [searchParams, setSearchParams] = useSearchParams();
  const isAdminMode = canManage && searchParams.get('mode') === 'admin';

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Notice | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const qc = useQueryClient();
  const list = useNoticeList(
    isAdminMode ? { mode: 'admin', includeDeleted: true } : { mode: 'user' },
  );
  const createMut = useCreateNotice();
  // id 별 자유 업데이트 — 인라인 토글과 모달 수정 모두에 사용.
  // optimistic update + onError rollback (§10.3.4 인라인 토글 즉시 반영).
  const updateMut = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: NoticeUpdate }) => noticeApi.update(id, patch),
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: noticeQueryKeys.all });
      const snapshots = qc.getQueriesData<{ rows: Notice[] }>({
        queryKey: noticeQueryKeys.lists(),
      });
      snapshots.forEach(([key, data]) => {
        if (!data) return;
        qc.setQueryData(key, {
          ...data,
          rows: data.rows.map((r) => (r.id === id ? { ...r, ...patch } : r)),
        });
      });
      return { snapshots };
    },
    onError: (_err, _vars, ctx) => {
      ctx?.snapshots.forEach(([key, data]) => qc.setQueryData(key, data));
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: noticeQueryKeys.all });
    },
  });
  const deleteMut = useDeleteNotice();
  const restoreMut = useRestoreNotice();

  const visibleRows = useMemo(() => {
    const rows = list.data?.rows ?? [];
    if (isAdminMode) return rows;
    return rows.filter((r) => r.deleted_at === null && r.is_visible && isWithinPeriod(r));
  }, [list.data, isAdminMode]);

  const total = visibleRows.length;

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }
  function openEdit(n: Notice) {
    setEditing(n);
    setFormOpen(true);
  }
  function closeForm() {
    setFormOpen(false);
    setEditing(null);
  }
  async function submitForm(payload: NoticeCreate) {
    if (editing) {
      await updateMut.mutateAsync({ id: editing.id, patch: payload });
    } else {
      await createMut.mutateAsync(payload);
    }
  }
  function toggleAdminMode() {
    const next = new URLSearchParams(searchParams);
    if (isAdminMode) next.delete('mode');
    else next.set('mode', 'admin');
    setSearchParams(next);
  }

  return (
    <StickyHeaderLayout
      header={
        <PageHeader
          title="공지사항"
          count={total}
          actions={
            <>
              {canManage ? (
                <Button
                  type="button"
                  variant={isAdminMode ? 'secondary' : 'outline'}
                  data-testid="notice-admin-toggle"
                  onClick={toggleAdminMode}
                >
                  {isAdminMode ? '읽기 모드' : '관리'}
                </Button>
              ) : null}
              {isAdminMode ? (
                <Button type="button" data-testid="notice-create-button" onClick={openCreate}>
                  + 등록
                </Button>
              ) : null}
            </>
          }
        />
      }
    >
      <div data-testid="notice-page" className="flex flex-col gap-4">
        {list.isPending ? <LoadingState /> : null}
        {list.isError ? <ErrorState message="공지 목록을 불러오지 못했습니다." /> : null}
        {!list.isPending && !list.isError && total === 0 ? (
          <EmptyState title="공지가 없습니다." />
        ) : null}

        {total > 0 ? (
          <ul data-testid="notice-list" className="flex flex-col">
            {visibleRows.map((n) => (
              <NoticeRow
                key={n.id}
                notice={n}
                expanded={expandedId === n.id}
                onToggle={() => setExpandedId((id) => (id === n.id ? null : n.id))}
                isAdminMode={isAdminMode}
                isAdmin={isAdmin}
                onEdit={openEdit}
                onDelete={(x) => deleteMut.mutate(x.id)}
                onRestore={(x) => restoreMut.mutate(x.id)}
                onToggleVisible={(x, next) =>
                  updateMut.mutate({ id: x.id, patch: { is_visible: next } })
                }
              />
            ))}
          </ul>
        ) : null}

        <NoticeFormDialog
          open={formOpen}
          initial={editing}
          onClose={closeForm}
          onSubmit={submitForm}
        />
      </div>
    </StickyHeaderLayout>
  );
}
