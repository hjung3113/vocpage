// Trailing initializers — must load AFTER all other js/*.js files and after DOM body parsed.

// ── mock auth — prototype demo only ──────────────────────────────────────────
// Fix S1: fail-closed guards in drawer.js / internal-notes.js default to 'user'.
// Inject admin mock here so demo verifier sees notes section rendered.
// Real auth layer replaces this block when wired.
if (!window.currentUser) {
  window.currentUser = { role: 'admin', id: 'u-admin', name: '이분석' };
}

if (window.RoleState && typeof window.RoleState.init === 'function') {
  window.RoleState.init();
}

if (window.AdminMode && typeof window.AdminMode.init === 'function') {
  window.AdminMode.init();
}

lucide.createIcons();
renderSidebar();
renderVOCList();

// ── 내 VOC / 담당 VOC 카운트 배지
(function initNavBadges() {
  const allCount = VOCDATA.length;
  const mineCount = VOCDATA.filter((v) => v.author === CURRENT_USER).length;
  const assignedCount = VOCDATA.filter((v) => v.assignee === CURRENT_USER).length;
  const allEl = document.getElementById('allBadge');
  const mineEl = document.getElementById('mineBadge');
  const assignedEl = document.getElementById('assignedBadge');
  if (allEl) {
    allEl.textContent = allCount;
  }
  if (mineEl) {
    mineEl.textContent = mineCount;
    mineEl.style.display = mineCount ? '' : 'none';
  }
  if (assignedEl) {
    assignedEl.textContent = assignedCount;
    assignedEl.style.display = assignedCount ? '' : 'none';
  }

  const today = new Date().toISOString().slice(0, 10);
  const hasUrgent = NOTICES.some(
    (n) => n.visible && n.level === 'urgent' && n.from <= today && n.to >= today,
  );
  const noticeBadge = document.getElementById('noticeBadge');
  if (noticeBadge && hasUrgent) {
    noticeBadge.textContent = '!';
    noticeBadge.style.cssText =
      'display:inline-block;background:var(--status-red);color:var(--text-on-brand)';
  }
})();

// ── 공지 팝업 초기화 — B-3 (Wave 2): 2-panel modal per uidesign §13.9 + feature-notice-faq §10.3.2.
if (window.NoticePopup && typeof window.NoticePopup.init === 'function') {
  window.NoticePopup.init();
}
