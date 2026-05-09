-- Wave 4 alignment migration (8-M2): notices.visible_from / visible_to
-- promoted from `date` to `timestamptz` so the spec's "노출 기간" range can
-- carry KST midnight semantics with an explicit timezone offset.
--
-- 8-M1 (`faq_categories.slug UNIQUE`/`is_archived`) is already satisfied by
-- 005_content.sql, so this migration only touches `notices`.

ALTER TABLE notices
  ALTER COLUMN visible_from TYPE timestamptz USING visible_from::timestamptz,
  ALTER COLUMN visible_to TYPE timestamptz USING visible_to::timestamptz;
