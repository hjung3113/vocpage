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

export function TagRulesFlatTable({ q, onJumpToTag, onEditRule }: Props) {
  const { data: tagsData, isLoading: tagsLoading } = useAdminTags();
  const tags = useMemo<TagMasterItem[]>(() => tagsData?.rows ?? [], [tagsData]);

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
      <div role="status" style={{ padding: '24px', color: 'var(--text-muted)', fontSize: '13px' }}>
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
      <div role="alert" style={{ padding: '24px', color: 'var(--status-red)', fontSize: '13px' }}>
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
                padding: '8px 12px',
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
      </tbody>
    </table>
  );
}

