// B-4a `?mode=admin` URL Toggle (Wave 2) — Notice/FAQ 관리 모드 진입 컨트랙트.
// spec: docs/specs/requires/feature-notice-faq.md §10.5.2 (toggle contract),
//       docs/specs/requires/uidesign.md §13.8 (Admin Mode Entry Button).
// Loads BEFORE init.js so init can call AdminMode.init() at startup.
//
// CONTRACT:
// - URL `?mode=admin` 존재 ↔ 관리 모드 ON. 부재 ↔ 읽기 모드 (default).
// - 토글은 history.pushState로 진행 — 페이지 새로고침/뒤로가기/공유 링크 보존.
// - 모드 진입 버튼은 role ∈ {admin, manager} 일 때만 DOM에 렌더 (cosmetic guard;
//   BE는 §10.5.3 별도 검증).
// - 모드 변경 시 `admin-mode:change` CustomEvent 발화, payload = { mode, page }.

(function () {
  'use strict';

  var QUERY_KEY = 'mode';
  var ADMIN_VAL = 'admin';

  function escHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function urlMode() {
    try {
      var p = new URL(window.location.href).searchParams.get(QUERY_KEY);
      return p === ADMIN_VAL ? ADMIN_VAL : null;
    } catch (_) {
      return null;
    }
  }

  function isAdminMode() {
    return urlMode() === ADMIN_VAL;
  }

  function currentRole() {
    return (window.currentUser && window.currentUser.role) || 'user';
  }

  // Only admin/manager are allowed to enter admin mode (uidesign §13.8 line 1051).
  function canEnterAdminMode() {
    var r = currentRole();
    return r === 'admin' || r === 'manager';
  }

  function pushUrl(on) {
    var url = new URL(window.location.href);
    if (on) url.searchParams.set(QUERY_KEY, ADMIN_VAL);
    else url.searchParams.delete(QUERY_KEY);
    var newHref = url.pathname + (url.search ? url.search : '') + url.hash;
    history.pushState({ adminMode: !!on }, '', newHref);
  }

  function dispatchChange(page) {
    document.dispatchEvent(
      new CustomEvent('admin-mode:change', {
        detail: { mode: isAdminMode() ? ADMIN_VAL : null, page: page || null },
      }),
    );
  }

  function setMode(on) {
    var was = isAdminMode();
    if (was === !!on) return;
    // Cosmetic guard: deny user/dev attempting to enable via API call.
    if (on && !canEnterAdminMode()) {
      console.warn('[AdminMode] role', currentRole(), 'cannot enter admin mode');
      return;
    }
    pushUrl(!!on);
    dispatchChange(currentInfoPage());
  }

  function toggleMode() {
    setMode(!isAdminMode());
  }

  // Returns 'notices' | 'faq' | null based on currently active info page.
  function currentInfoPage() {
    var notices = document.getElementById('page-notices');
    var faq = document.getElementById('page-faq');
    if (notices && notices.classList.contains('active')) return 'notices';
    if (faq && faq.classList.contains('active')) return 'faq';
    return null;
  }

  // Renders the entry button into a host slot (caller passes the slot element).
  // Idempotent — safe to call repeatedly on re-render.
  function renderEntryButton(slotEl) {
    if (!slotEl) return;
    if (!canEnterAdminMode()) {
      slotEl.innerHTML = '';
      return;
    }
    var on = isAdminMode();
    slotEl.innerHTML =
      '<button type="button" class="am-entry-btn admin-btn' +
      (on ? ' is-on' : '') +
      '" data-am-toggle="1" aria-pressed="' +
      (on ? 'true' : 'false') +
      '" title="' +
      (on ? '읽기 모드로 돌아가기' : '관리 모드 진입 (?mode=admin)') +
      '">' +
      '<i data-lucide="' +
      (on ? 'eye' : 'settings') +
      '"></i>' +
      '<span class="am-entry-label">' +
      escHtml(on ? '읽기 모드' : '관리 모드') +
      '</span>' +
      '</button>';
    var btn = slotEl.querySelector('.am-entry-btn');
    if (btn) btn.addEventListener('click', toggleMode);
    if (window.lucide && typeof lucide.createIcons === 'function') {
      try {
        lucide.createIcons({ el: slotEl });
      } catch (_) {
        lucide.createIcons();
      }
    }
  }

  // Renders or removes the "현재 관리 모드입니다" banner in the page admin-body.
  function renderModeBanner(bodyEl) {
    if (!bodyEl) return;
    var existing = bodyEl.querySelector('.am-mode-banner');
    if (!isAdminMode()) {
      if (existing) existing.remove();
      return;
    }
    if (existing) return;
    var banner = document.createElement('div');
    banner.className = 'am-mode-banner';
    banner.setAttribute('role', 'status');
    banner.innerHTML =
      '<i data-lucide="shield-check"></i>' +
      '<span>관리 모드 — 등록/수정/삭제 액션이 인라인으로 노출됩니다.</span>' +
      '<button type="button" class="am-banner-exit" data-am-toggle="1" aria-label="읽기 모드로 돌아가기">읽기 모드</button>';
    bodyEl.insertBefore(banner, bodyEl.firstChild);
    var exitBtn = banner.querySelector('.am-banner-exit');
    if (exitBtn) exitBtn.addEventListener('click', toggleMode);
    if (window.lucide && typeof lucide.createIcons === 'function') {
      try {
        lucide.createIcons({ el: banner });
      } catch (_) {}
    }
  }

  // Browser back/forward — re-fire change event so consumers can re-render.
  function onPopState() {
    dispatchChange(currentInfoPage());
  }

  function init() {
    window.addEventListener('popstate', onPopState);
    // Fire one initial event so any subscriber attached before init() can sync.
    setTimeout(function () {
      dispatchChange(currentInfoPage());
    }, 0);
  }

  window.AdminMode = {
    init: init,
    isAdminMode: isAdminMode,
    setMode: setMode,
    toggleMode: toggleMode,
    canEnterAdminMode: canEnterAdminMode,
    renderEntryButton: renderEntryButton,
    renderModeBanner: renderModeBanner,
    QUERY_KEY: QUERY_KEY,
    ADMIN_VAL: ADMIN_VAL,
  };
})();
