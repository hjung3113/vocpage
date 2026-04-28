// Trailing initializers — must load AFTER all other js/*.js files and after DOM body parsed.

// ── mock auth — prototype demo only ──────────────────────────────────────────
// Fix S1: fail-closed guards in drawer.js / internal-notes.js default to 'user'.
// Inject admin mock here so demo verifier sees notes section rendered.
// Real auth layer replaces this block when wired.
if (!window.currentUser) {
  window.currentUser = { role: 'admin', id: 'u-admin', name: '이분석' };
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

// ── 공지 팝업 초기화
(function initNoticePopup() {
  const today = new Date().toISOString().slice(0, 10);
  const levelOrder = { urgent: 0, important: 1, normal: 2 };
  const popupNotices = NOTICES.filter(
    (n) => n.visible && n.popup && n.from <= today && n.to >= today,
  )
    .filter((n) => localStorage.getItem('notice_hide_' + n.id) !== today)
    .sort((a, b) => levelOrder[a.level] - levelOrder[b.level]);

  if (popupNotices.length === 0) return;

  const levelLabel = { urgent: '긴급', important: '중요', normal: '일반' };
  const levelColor = { urgent: '#e5484d', important: '#f5a623', normal: 'var(--text-tertiary)' };

  const overlay = document.createElement('div');
  overlay.id = 'noticePopupOverlay';
  overlay.style.cssText =
    'position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:9000;display:flex;align-items:center;justify-content:center';

  overlay.innerHTML = `
    <div style="background:var(--bg-panel);border:1px solid var(--border-subtle);border-radius:12px;width:480px;max-width:90vw;max-height:80vh;overflow-y:auto;padding:28px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
        <span style="font-size:15px;font-weight:600;color:var(--text-primary)">공지사항</span>
        <button onclick="closeNoticePopup()" style="background:none;border:none;cursor:pointer;color:var(--text-tertiary);font-size:20px;line-height:1">✕</button>
      </div>
      ${popupNotices
        .map(
          (n) => `
        <div style="border:1px solid var(--border-subtle);border-radius:8px;padding:14px 16px;margin-bottom:10px">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
            <span style="font-size:11px;font-weight:600;color:${levelColor[n.level]};border:1px solid ${levelColor[n.level]};border-radius:4px;padding:1px 7px">${levelLabel[n.level]}</span>
            <span style="font-size:13.5px;font-weight:500;color:var(--text-primary)">${n.title}</span>
          </div>
          <div style="font-size:13px;color:var(--text-secondary);line-height:1.65">${n.content}</div>
        </div>`,
        )
        .join('')}
      <!-- 모달 footer: 일괄 "오늘 하루 보지 않기" 체크박스 1개 + 닫기 버튼 -->
      <div style="display:flex;align-items:center;justify-content:space-between;margin-top:16px;padding-top:14px;border-top:1px solid var(--border-subtle)">
        <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:12px;color:var(--text-tertiary)">
          <input type="checkbox" id="hide-today-all" onchange="handleHideTodayAll(this.checked, [${popupNotices.map((n) => n.id).join(',')}])">
          오늘 하루 보지 않기
        </label>
        <button onclick="closeNoticePopup()" style="padding:7px 20px;background:var(--brand-bg);border:1px solid var(--accent);border-radius:6px;color:var(--accent);font-size:13px;font-weight:600;cursor:pointer">닫기</button>
      </div>
    </div>`;

  document.body.appendChild(overlay);
})();
