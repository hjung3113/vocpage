/**
 * TagRulesFlatTable — flat all-rules listing for `/admin/tags?view=rules`.
 *
 * Phase 01 Plan 07. UI-SPEC §view=rules flat table.
 *  - Cross-tag listing built by `useQueries` over each tag's nested rule list.
 *  - q is passed in from parent (already debounced by URL state setter).
 *  - 키워드 | 태그 | 매칭 방식 | 상태 | 작성자 | 작업 columns.
 */
import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { apiGet } from '@shared/api/client';
import { useAdminTags } from '../api/tag-master.api';
import { TagRuleListResponse, type TagRuleT, type TagMasterItem } from '@contracts/admin/tag';
import { TagRulesFlatTableEmptyState } from './TagRulesFlatTableEmptyState';
import { TagRulesFlatRow } from './TagRulesFlatRow';

interface FlatRow {
  rule: TagRuleT;
  tag: TagMasterItem;
}

interface Props {
  q: string;
  onJumpToTag: (tagId: string) => void;
  onEditRule: (tag: TagMasterItem) => void;
}

// BE clamps per_page at 100 (shared/contracts/admin/tag.ts).
// Flat table fetches the maximum so the cross-tag listing covers as many tags
// as a single round-trip allows; if the project ever crosses 100 tags, the
// truncation banner below surfaces the gap instead of silently dropping rules.
const TAGS_PER_PAGE = 100;

export function TagRulesFlatTable({ q, onJumpToTag, onEditRule }: Props) {
  const { data: tagsData, isLoading: tagsLoading } = useAdminTags({ per_page: TAGS_PER_PAGE });
  const tags = useMemo<TagMasterItem[]>(() => tagsData?.rows ?? [], [tagsData]);
  const totalTags = tagsData?.total ?? 0;
  const isTruncated = totalTags > tags.length;

  // useQueries — one nested rule list per tag, then flatten.
  const ruleQueries = useQueries({
    queries: tags.map((tag) => {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      const qs = params.toString();
      return {
        queryKey: ['admin', 'tags', tag.id, 'rules', { q }],
        queryFn: ({ signal }: { signal?: AbortSignal }) =>
          apiGet(
            `/api/admin/tags/${tag.id}/rules${qs ? `?${qs}` : ''}`,
            TagRuleListResponse,
            { signal },
          ),
        enabled: Boolean(tag.id),
      };
    }),
  });

  const isLoading = tagsLoading || ruleQueries.some((rq) => rq.isLoading);
  const isError = ruleQueries.some((rq) => rq.isError);

  const rows = useMemo<FlatRow[]>(() => {
    const out: FlatRow[] = [];
    ruleQueries.forEach((rq, idx) => {
      const tag = tags[idx];
      if (!tag) return;
      const rules = rq.data?.rows ?? [];
      rules.forEach((rule) => out.push({ rule, tag }));
    });
    return out;
  }, [ruleQueries, tags]);

  if (isLoading) {
    return (
      <div role="status" style={{ padding: 'var(--sp-5)', color: 'var(--text-muted)', fontSize: '13px' }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            data-testid="flat-skeleton-row"
            style={{
              height: '36px',
              marginBottom: '6px',
              background: 'var(--bg-subtle)',
              borderRadius: '4px',
              opacity: 0.6,
            }}
          />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div role="alert" style={{ padding: 'var(--sp-5)', color: 'var(--status-red)', fontSize: '13px' }}>
        규칙 목록을 불러오지 못했습니다.
      </div>
    );
  }

  if (rows.length === 0) {
    if (q !== '') {
      return (
        <TagRulesFlatTableEmptyState
          heading="검색 결과가 없습니다"
          body="다른 키워드로 다시 검색하거나 검색어를 비워 전체 규칙을 확인하세요"
        />
      );
    }
    return (
      <TagRulesFlatTableEmptyState
        heading="등록된 규칙이 없습니다"
        body="태그 탭에서 태그별로 규칙을 추가할 수 있습니다"
      />
    );
  }

  return (
    <table
      style={{
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '13px',
        color: 'var(--text-primary)',
      }}
    >
      <thead>
        <tr style={{ borderBottom: '1px solid var(--border-standard)' }}>
          {['키워드', '태그', '매칭 방식', '상태', '작성자', '작업'].map((h) => (
            <th
              key={h}
              style={{
                padding: 'var(--sp-2) var(--sp-3)',
                textAlign: 'left',
                fontSize: '11px',
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                color: 'var(--text-muted)',
              }}
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map(({ rule, tag }) => (
          <TagRulesFlatRow
            key={rule.id}
            rule={rule}
            tag={tag}
            onJumpToTag={onJumpToTag}
            onEditRule={onEditRule}
          />
        ))}
        {isTruncated && (
          <tr>
            <td
              colSpan={6}
              role="note"
              data-testid="flat-truncated-notice"
              style={{
                padding: 'var(--sp-3)',
                fontSize: '12px',
                color: 'var(--text-muted)',
                background: 'var(--bg-subtle)',
                borderTop: '1px solid var(--border-standard)',
              }}
            >
              표시 가능한 {tags.length}개 태그까지의 규칙만 표시했습니다 (전체 {totalTags}개).
              태그 탭에서 검색해 좁혀 주세요.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

