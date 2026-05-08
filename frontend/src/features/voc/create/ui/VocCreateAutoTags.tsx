import { useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';

// feature-voc.md §8.4 — 자동 태그 추천. tag_rules API 미구현 시 client-side stub.
const TAG_RULES: ReadonlyArray<{ keywords: string[]; tag: string }> = [
  { keywords: ['버그', 'bug', 'crash', '깨짐'], tag: 'bug' },
  { keywords: ['오류', 'error', '에러', '실패'], tag: 'error' },
  { keywords: ['느림', 'slow', '지연', 'lag'], tag: 'performance' },
  { keywords: ['개선', '요청', 'request', 'feature'], tag: 'enhancement' },
  { keywords: ['로그인', 'login', 'auth', '인증'], tag: 'auth' },
];

function suggest(body: string): string[] {
  if (!body.trim()) return [];
  const lower = body.toLowerCase();
  const out = new Set<string>();
  for (const rule of TAG_RULES) {
    for (const kw of rule.keywords) {
      if (lower.includes(kw.toLowerCase())) {
        out.add(rule.tag);
        break;
      }
    }
  }
  return Array.from(out);
}

interface VocCreateAutoTagsProps {
  body: string;
}

export function VocCreateAutoTags({ body }: VocCreateAutoTagsProps) {
  const [seed, setSeed] = useState(0);
  // seed 변경 시 재계산을 위해 의도적으로 의존성에 포함
  const tags = useMemo(() => {
    void seed;
    return suggest(body);
  }, [body, seed]);
  if (tags.length === 0) return null;

  return (
    <div
      data-testid="voc-create-auto-tags"
      className="flex items-center gap-2 px-4 py-2 shrink-0"
      style={{ borderTop: '1px solid var(--border-subtle)' }}
    >
      <span
        className="text-[10.5px] font-semibold uppercase tracking-[0.07em]"
        style={{ color: 'var(--text-quaternary)', fontFamily: 'var(--font-ui)' }}
      >
        추천 태그
      </span>
      <div className="flex items-center gap-1.5 flex-wrap flex-1 min-w-0">
        {tags.map((t) => (
          <span
            key={t}
            className="rounded-full px-2 py-0.5 text-[11px] font-medium"
            style={{
              background: 'var(--bg-hover)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-subtle)',
              fontFamily: 'var(--font-ui)',
            }}
          >
            {t}
          </span>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setSeed((s) => s + 1)}
        aria-label="태그 새로고침"
        className="rounded p-1 transition-opacity"
        style={{ color: 'var(--text-quaternary)' }}
      >
        <RefreshCw size={12} aria-hidden />
      </button>
    </div>
  );
}
