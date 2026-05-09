-- 015: trash audit (W3-2)
--
-- Spec lock:
--   - docs/specs/requires/requirements.md §15.4 (Trash 운영 갭 해소)
--   - docs/specs/requires/feature-voc.md §9.4.7 (휴지통 D23 — restore semantics)
--   - docs/adr/0005-trash-restore-policy.md §5 Audit (column lock)
--
-- Adds:
--   1. vocs.deleted_by uuid FK -> users.id, NULL — recorded together with
--      vocs.deleted_at when an Admin soft-deletes a VOC. Nullable because
--      MVP soft-delete legacy rows pre-date this column and `deleted_at IS
--      NULL` rows must remain unconstrained.
--   2. voc_restore_log table — machine-friendly single audit for restore /
--      hard_delete events. `voc_history` keeps human-friendly 'restore' rows;
--      this table is the join target for actor_id / action analytics.
--      RESTRICT FK to vocs.id is intentional: hard-deleting a VOC must not
--      silently drop its restore audit (PIPA 7y retention, ADR 0005 §3).
--
-- node-pg-migrate runs SQL inside a transaction. Plain CREATE INDEX is fine
-- at current data volume; switch to CONCURRENTLY in a manual step on a
-- live large-data environment if needed (see 018_notice_faq_indexes.sql).

-- Up Migration

ALTER TABLE vocs
  ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES users(id);

CREATE TABLE IF NOT EXISTS voc_restore_log (
  id                  uuid        NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  voc_id              uuid        NOT NULL REFERENCES vocs(id) ON DELETE RESTRICT,
  action              text        NOT NULL CHECK (action IN ('restore','hard_delete')),
  actor_id            uuid        NOT NULL REFERENCES users(id),
  before_deleted_at   timestamptz,
  before_deleted_by   uuid        REFERENCES users(id),
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- Indexes — ADR 0005 §"Consequences" (machine-friendly: actor_id / action).
CREATE INDEX IF NOT EXISTS idx_voc_restore_log_actor
  ON voc_restore_log (actor_id);

CREATE INDEX IF NOT EXISTS idx_voc_restore_log_action
  ON voc_restore_log (action);

CREATE INDEX IF NOT EXISTS idx_voc_restore_log_voc
  ON voc_restore_log (voc_id, created_at DESC);

-- Down Migration

DROP INDEX IF EXISTS idx_voc_restore_log_voc;
DROP INDEX IF EXISTS idx_voc_restore_log_action;
DROP INDEX IF EXISTS idx_voc_restore_log_actor;
DROP TABLE IF EXISTS voc_restore_log;
ALTER TABLE vocs DROP COLUMN IF EXISTS deleted_by;
