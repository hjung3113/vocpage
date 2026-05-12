## Conflict Detection Report

Synthesis of 31 classified documents (8 ADR, 4 PRD, 12 SPEC, 7 DOC) against precedence ADR > SPEC > PRD > DOC.

### BLOCKERS (0)

No LOCKED-vs-LOCKED contradictions detected. The three LOCKED ADRs (0004 admin-permission, 0005 trash-restore, 0006 custom-date-range default) address disjoint scopes:
- ADR-0004 scope: admin pages role-based access
- ADR-0005 scope: trash retention/restore policy
- ADR-0006 scope: dashboard_settings default_date_range persistence

No cycle detected in cross-reference graph. No UNKNOWN-confidence-low classifications.

### WARNINGS (2)

[WARNING] ADR-0007 timezone semantics is Proposed but ADR-0006 (LOCKED) depends on it
  Found: docs/adr/0006-custom-date-range-default.md (Accepted, LOCKED) defines `custom_start_date`/`custom_end_date` persistence with timezone interpretation deferred.
  Found: docs/adr/0007-custom-date-range-timezone.md is Status: Proposed with explicit open questions on timezone interpretation and cron aggregation day boundary.
  Impact: Downstream dashboard implementation cannot be fully specified until ADR-0007 is Accepted. Roadmap should treat timezone semantics as an open decision blocking dashboard-cron work.
  -> User must drive ADR-0007 to Accepted (or note it as a deferred follow-up) before routing dashboard-cron work.

[WARNING] ADR-0008 Flowline alignment is Proposed but referenced by uidesign.md §16 and a working-queue DOC
  Found: docs/adr/0008-flowline-design-alignment.md is Status: Proposed.
  Found: docs/specs/requires/uidesign.md §16 references new Flowline primitives spec.
  Found: docs/specs/plans/flowline-alignment-cues.md is a working queue assuming the alignment effort proceeds.
  Impact: Visual-surface work is treated as irreversible per project CLAUDE.md (token-definition changes require spec update first). Synthesis cannot route Flowline alignment as a committed wave until ADR-0008 is Accepted.
  -> User must accept or reject ADR-0008 before any Flowline-alignment routing.

### INFO (5)

[INFO] Auto-resolved: closed-wave history references in older ADRs are intentional
  Note: ADR-0005 cross-refs `next-session-tasks.md`; admin-pages-backlog.md and admin-pages-wave.md cross-ref `feature-voc.md`. Per user decision (commit 16d2517, 2026-05-10), `wave-3-admin.md` and `followup-bucket.md` were intentionally retired and history moved to git log + PR descriptions. Historical mentions in older ADRs are not errors.

[INFO] Auto-resolved: requirements.md is hybrid PRD + SPEC
  Note: `docs/specs/requires/requirements.md` was classified PRD with classifier note flagging substantial SPEC content (DB schema §4, auth §2.1). Synthesis preserved both: user-facing requirements summarized in `requirements.md` intel; technical material referenced from `constraints.md`. No data lost.

[INFO] Auto-resolved: feature-voc.md classified SPEC despite user-visible behavior
  Note: `docs/specs/requires/feature-voc.md` was classified SPEC (api-contract + schema + protocol). Its user-visible behavior (status state machine, review_status sub-state) is exposed in `constraints.md` and rolls up to REQ-voc-system in `requirements.md`. No conflict, just dual-surface.

[INFO] Auto-resolved: visual-baselines path correction
  Note: Per task input, visual baselines actually live in `prototype/screenshots/`, not `benchmark/`. Root CLAUDE.md was corrected this session. Recorded in `context.md`.

[INFO] ADRs 0001/0002/0003 lack explicit Status headers
  Note: Three ADRs (0001 field-to-action mapping, 0002 list aggregated fields, 0003 validators seam) have no explicit Status field. Classifier conservatively set locked=false. They function as accepted architectural decisions by convention but are not protected from override. Recommendation: user may want to add `Status: Accepted` headers retroactively.
