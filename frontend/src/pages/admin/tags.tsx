/**
 * /admin/tags — Tag Master page (W3-4 + Phase 01 Plan 07).
 *
 * Role guard: admin/manager/dev (ADR 0004 Option D). User → /voc redirect.
 * BE 403 is secondary defense.
 *
 * Phase 01 Plan 07 additions:
 *  - View-mode tabs (태그 / 전체 규칙) + ?view= URL state.
 *  - ?q= URL state for view=rules with 250ms debounce (T-01-16: useSearchParams
 *    encodes; React JSX auto-escapes the rendered query).
 *  - 규칙 N건 row badge in TagMasterTable opens TagRulesManagerModal in-page.
 */
import { useEffect, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { StickyHeaderLayout, PageHeader } from '@widgets/app-shell';
import { useRole } from '@entities/user/model/useRole';
import { TagMasterTable } from '@features/admin/tag-master/ui/TagMasterTable';
import { TagRulesFlatTable } from '@features/admin/tag-master/ui/TagRulesFlatTable';
import { TagRulesManagerModal } from '@features/admin/tag-master/ui/TagRulesManagerModal';
import type { TagMasterItem } from '@contracts/admin/tag';

const SEARCH_DEBOUNCE_MS = 250;

export default function AdminTagsPage() {
  const { isAdmin, isManager, isDev } = useRole();
  const [params, setParams] = useSearchParams();

  const view: 'tags' | 'rules' = params.get('view') === 'rules' ? 'rules' : 'tags';
  const qParam = params.get('q') ?? '';

  const [qDraft, setQDraft] = useState(qParam);
  const [rulesModalTag, setRulesModalTag] = useState<TagMasterItem | null>(null);

  // Keep draft in sync when URL changes externally (deep links / back-nav).
  useEffect(() => {
    setQDraft(qParam);
  }, [qParam]);

  // Debounce qDraft → URL ?q= (250ms). Only runs in rules view; the search
  // input itself is unmounted in tags view, so qDraft cannot diverge there.
  useEffect(() => {
    if (view !== 'rules' || qDraft === qParam) return;
    const id = setTimeout(() => {
      setParams(
        (p) => {
          if (qDraft) p.set('q', qDraft);
          else p.delete('q');
          return p;
        },
        { replace: true },
      );
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [qDraft, qParam, view, setParams]);

  if (!(isAdmin || isManager || isDev)) {
    return <Navigate to="/voc" replace />;
  }

  function setView(next: 'tags' | 'rules') {
    setParams((p) => {
      p.set('view', next);
      if (next === 'tags') p.delete('q');
      return p;
    });
    if (next === 'tags') setQDraft('');
  }

  return (
    <StickyHeaderLayout header={<PageHeader title="태그 관리" />}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 var(--sp-5)',
          height: '44px',
          gap: 'var(--sp-2)',
        }}
      >
        <div role="tablist" aria-label="보기 모드" style={{ display: 'flex', gap: '6px' }}>
          {(
            [
              { v: 'tags' as const, label: '태그' },
              { v: 'rules' as const, label: '전체 규칙' },
            ]
          ).map((t) => {
            const active = view === t.v;
            return (
              <button
                key={t.v}
                type="button"
                role="tab"
                aria-selected={active}
                data-testid={`tab-view-${t.v}`}
                onClick={() => setView(t.v)}
                style={{
                  padding: 'var(--sp-1) var(--sp-3)',
                  borderRadius: '9999px',
                  fontSize: '12.5px',
                  fontWeight: active ? 600 : 500,
                  border: `1px solid ${active ? 'var(--brand-border)' : 'var(--border-standard)'}`,
                  background: active ? 'var(--brand-bg)' : 'transparent',
                  color: active ? 'var(--accent)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  boxShadow: active ? '0 0 0 1px var(--brand-border)' : 'none',
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>
        {view === 'rules' && (
          <input
            type="search"
            value={qDraft}
            onChange={(e) => setQDraft(e.target.value)}
            placeholder="키워드 또는 태그명으로 검색"
            aria-label="규칙 검색"
            data-testid="flat-search-input"
            style={{
              width: '240px',
              height: '32px',
              padding: '0 10px',
              borderRadius: '6px',
              border: '1px solid var(--border-standard)',
              background: 'var(--bg-elevated)',
              color: 'var(--text-primary)',
              fontSize: '12.5px',
            }}
          />
        )}
      </div>
      {view === 'tags' ? (
        <TagMasterTable onOpenRules={setRulesModalTag} />
      ) : (
        <TagRulesFlatTable
          q={qParam}
          onJumpToTag={() => {
            setParams((p) => {
              p.set('view', 'tags');
              p.delete('q');
              return p;
            });
          }}
          onEditRule={(tag) => setRulesModalTag(tag)}
        />
      )}
      {rulesModalTag && (
        <TagRulesManagerModal tag={rulesModalTag} onClose={() => setRulesModalTag(null)} />
      )}
    </StickyHeaderLayout>
  );
}
