# Requirements (PRDs)

Synthesized from 4 PRD-class documents. Requirement IDs are derived as `REQ-{slug}`.

---

## REQ-voc-system — VOC system master requirements
- source: `docs/specs/requires/requirements.md`
- summary: Final requirements for the VOC (Voice of Customer) sub-system: business/user/admin requirements, tech stack, DB schema, operational settings.
- scope: VOC system, authentication (OIDC / AD SSO), user roles (admin / manager / dev / user), database schema, tech stack, Sub-task hierarchy, auto-tagging, dashboard access, testing strategy
- acceptance: per-section requirements in source; this is the master PRD all feature PRDs trace back to.
- cross_refs: feature-voc.md, feature-notice-faq.md, dashboard.md, uidesign.md
- note: Hybrid document — also contains SPEC-level material (DB schema §4, auth §2.1) cross-referenced from `constraints.md`.

## REQ-voc-dashboard — VOC dashboard
- source: `docs/specs/requires/dashboard.md`
- summary: Requirements for the VOC dashboard: target users, layout, global filters, KPI widgets, drilldown heatmap, admin settings.
- scope: VOC dashboard, global filters, KPI widgets, drilldown heatmap, dashboard_settings, role-based access (Manager / Admin / Dev)
- acceptance: per source v3 (2026-04-23 confirmed); LOCKED via ADR-0006 for `default_date_range='custom'` persistence.
- cross_refs: prototype/prototype.html (visual reference; see context note), dashboard-impl.md

## REQ-notice-faq — Notice & FAQ
- source: `docs/specs/requires/feature-notice-faq.md` (2026-04-21)
- summary: Notice and FAQ feature: sidebar navigation, data fields, login popup behavior, admin/manager management permissions.
- scope: notice, FAQ, sidebar navigation, count badges, login popup, admin permissions
- acceptance: per source.
- cross_refs: requirements.md

## REQ-admin-pages-wave — Admin unimplemented-pages wave plan
- source: `docs/specs/plans/admin-pages-wave.md` (2026-05-10, Status: Draft)
- summary: Phased wave plan to deliver four unimplemented admin pages — tag rules consolidation into `/admin/tags`, `/admin/voc-types`, `/admin/systems`, `/admin/result-review` — across phases A/B/C/D.
- scope: /admin/tags, /admin/voc-types, /admin/systems, /admin/result-review, tag_rules, admin pages
- acceptance: per-phase done-when blocks in source; constrained by LOCKED ADR-0004 (admin permissions) and ADR-0005 (trash policy).
- cross_refs: admin-pages-backlog.md, openapi.yaml, routing-conventions.md, feature-voc.md, ADR-0004, ADR-0005

---

## SPEC-derived requirements (feature-voc.md)

`docs/specs/requires/feature-voc.md` was classified SPEC (technical), but contains user-visible behavior of the VOC core. Treated as constraint authority for VOC core; user-facing requirements roll up to REQ-voc-system. See `constraints.md` for the technical constraints (status state machine, review_status sub-state machine, permission model).
