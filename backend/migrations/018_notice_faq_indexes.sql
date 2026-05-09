-- 018: notices / faqs hot-path indexes (FU-002)
--
-- Hot-path query analysis (backend/src/repository/notices.ts,
--                           backend/src/repository/faqs.ts):
--
-- 1. notices.list() user mode + notices.popup():
--      WHERE deleted_at IS NULL AND is_visible = true
--      [AND is_popup = true]                       ← popup() only
--      AND (visible_from IS NULL OR visible_from <= now())
--      AND (visible_to IS NULL OR visible_to >= now())
--      ORDER BY created_at DESC
--    → partial index on (created_at DESC)
--      WHERE deleted_at IS NULL AND is_visible = true covers user-mode list
--      without leading on low-cardinality is_visible.
--    → separate partial expression index for popup feed ORDER BY.
--      visible_from/visible_to are intentionally not in the partial predicate
--      because now() is not immutable.
--
-- 2. faqs.listFaqs() with category filter:
--      WHERE deleted_at IS NULL AND is_visible = true
--      AND category_id = $1
--      ORDER BY sort_order ASC, created_at DESC
--    → partial composite index on (category_id, sort_order, created_at DESC)
--      WHERE deleted_at IS NULL AND is_visible = true.
--    → also a standalone partial on (sort_order, created_at DESC) for
--      uncategorised listing without category filter.
--
-- 3. faq_categories.listCategories():
--      ORDER BY sort_order ASC, name ASC  (full-table, tiny table)
--    → no index. The table is tiny and slug lookup is already covered by the
--      UNIQUE constraint from 005_content.sql.
--
-- CONCURRENTLY note: node-pg-migrate runs SQL inside a transaction block.
-- CREATE INDEX CONCURRENTLY is not allowed inside a transaction, so we use
-- plain CREATE INDEX. This is safe for the current data volume; add
-- CONCURRENTLY in a manual step on a live large-data environment if needed.

-- Up Migration

-- notices: user-mode list (dominant path)
CREATE INDEX IF NOT EXISTS idx_notices_visible_created
  ON notices (created_at DESC)
  WHERE deleted_at IS NULL AND is_visible = true;

-- notices: popup feed
CREATE INDEX IF NOT EXISTS idx_notices_popup_created
  ON notices (
    (CASE level WHEN 'urgent' THEN 0 WHEN 'important' THEN 1 ELSE 2 END),
    created_at DESC
  )
  WHERE deleted_at IS NULL AND is_visible = true AND is_popup = true;

-- faqs: category-filtered list with sort
CREATE INDEX IF NOT EXISTS idx_faqs_cat_sort_created
  ON faqs (category_id, sort_order ASC, created_at DESC)
  WHERE deleted_at IS NULL AND is_visible = true;

-- faqs: uncategorised listing
CREATE INDEX IF NOT EXISTS idx_faqs_sort_created
  ON faqs (sort_order ASC, created_at DESC)
  WHERE deleted_at IS NULL AND is_visible = true;

-- Down Migration

DROP INDEX IF EXISTS idx_notices_visible_created;
DROP INDEX IF EXISTS idx_notices_popup_created;
DROP INDEX IF EXISTS idx_faqs_cat_sort_created;
DROP INDEX IF EXISTS idx_faqs_sort_created;
