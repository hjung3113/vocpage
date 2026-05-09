-- migration 019 — FU-013: vocs.parent_id ON DELETE SET NULL
--
-- Spec: docs/specs/plans/followup-bucket.md FU-013, ADR 0005 §6 case 6.
-- Pre-019 (003_vocs.sql:46): parent_id had no ON DELETE clause → default NO ACTION
-- → hard-deleting a parent VOC with sub-tasks raised FK violation.
-- Post-019: parent hard-delete clears child.parent_id (sub-tasks become root rows).

-- Up Migration
ALTER TABLE vocs DROP CONSTRAINT vocs_parent_id_fkey;
ALTER TABLE vocs
  ADD CONSTRAINT vocs_parent_id_fkey
  FOREIGN KEY (parent_id) REFERENCES vocs(id) ON DELETE SET NULL;

-- Down Migration
ALTER TABLE vocs DROP CONSTRAINT vocs_parent_id_fkey;
ALTER TABLE vocs
  ADD CONSTRAINT vocs_parent_id_fkey
  FOREIGN KEY (parent_id) REFERENCES vocs(id);
