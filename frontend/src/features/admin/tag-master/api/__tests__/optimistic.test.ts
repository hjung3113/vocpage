/**
 * useCreateTagRule — D-11 optimistic update contract (Phase 1 Wave 0 RED).
 *
 * The hook itself does NOT exist yet — Plan 05 implements it. This file is
 * staged in Wave 0 so:
 *   1. The optimistic-update contract is captured in code (not just prose)
 *      before any implementation work begins.
 *   2. Plan 05 flips each `test.todo` to `it(...)` and the suite turns RED→GREEN
 *      against the real hook + MSW handler.
 *
 * Contract reference: .planning/phases/01-tag-rules-consolidation/01-CONTEXT.md
 *   D-11 — onMutate ±1 on admin-tags cache rule_ref_count, onError rollback,
 *   onSettled invalidate ['admin','tags'] + ['admin','tags',tagId,'rules'].
 *
 * Pitfall reference: .planning/phases/01-tag-rules-consolidation/01-RESEARCH.md
 *   Pitfall 5 — concurrent double-fire must `cancelQueries` first; onSettled
 *   invalidate is the ground truth.
 *
 * NOTE: imports must remain valid TypeScript (typecheck-clean) without the
 * hook existing. We therefore import only the QueryClient surface and keep
 * test bodies inside `test.todo` (no body executes).
 */
import { describe, test } from 'vitest';

// Marker for grep-based audits (acceptance criterion):
// hook = useCreateTagRule
// queryKey = ['admin', 'tags']
// queryKey = ['admin', 'tags', tagId, 'rules']

describe('useCreateTagRule — D-11 optimistic update', () => {
  test.todo(
    'onMutate increments rule_ref_count for the targeted tag in admin-tags cache by +1 — Plan 05 implements useCreateTagRule',
  );

  test.todo(
    'onError restores prev cache snapshot — Plan 05 implements useCreateTagRule',
  );

  test.todo(
    "onSettled invalidates ['admin','tags'] and ['admin','tags',tagId,'rules'] — Plan 05 implements useCreateTagRule",
  );

  test.todo(
    'concurrent double-fire — both onMutate paths cancelQueries first; onSettled invalidate is the ground truth (Pitfall 5) — Plan 05 implements useCreateTagRule',
  );
});
