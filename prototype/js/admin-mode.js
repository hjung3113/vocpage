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
// - isAdminMode()는 URL과 role을 AND 평가 — 무권한 deep-link 시 UI flash 방지.
//
// NOTE (R2): prototype은 eager `<script>` 로드. React 이관 시 §13.8/§10.5.2 MUST에
// 따라 admin-only 핸들러 코드는 dynamic import()로 분할되어야 함.

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

  function currentRole() {
    return (window.currentUser && window.currentUser.role) || 'user';
  }

  // Only admin/manager are allowed to enter admin mode (uidesign §13.8 line 1051).
  function canEnterAdminMode() {
    var r = currentRole();
    return r === 'admin' || r === 'manager';
  }

  // R2: AND with role guard — eliminates deep-link UI flash for user/dev pasting
  // ?mode=admin. Spec §10.5.3 still mandates BE re-verification; this is cosmetic.
  function isAdminMode() {
    return urlMode() === ADMIN_VAL && canEnterAdminMode();
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
  // R2: aria-pressed semantically tracks "관리 모드 활성" (true=admin mode ON).
  // Visible label is the *target action* per spec §10.5.2 ("읽기 모드 버튼"), so
  // the button title carries the actual state to disambiguate for SR users.
  function renderEntryButton(slotEl) {
    if (!slotEl) return;
    if (!canEnterAdminMode()) {
      slotEl.innerHTML = '';
      return;
    }
    var on = isAdminMode();
    var title = on
      ? '현재 관리 모드입니다. 클릭하면 읽기 모드로 전환합니다.'
      : '관리 모드 진입 (?mode=admin)';
    slotEl.innerHTML =
      '<button type="button" class="am-entry-btn admin-btn' +
      (on ? ' is-on' : '') +
      '" data-am-toggle="1" aria-pressed="' +
      (on ? 'true' : 'false') +
      '" title="' +
      escHtml(title) +
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
  // R2: explicit role guard — non-admin pasting ?mode=admin no longer sees banner.
  function renderModeBanner(bodyEl) {
    if (!bodyEl) return;
    var existing = bodyEl.querySelector('.am-mode-banner');
    if (!isAdminMode() || !canEnterAdminMode()) {
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
    // R2.1: deep-link cold-start. If user lands with ?mode=admin but no info
    // page is active yet, re-fire after the prototype's default-page activation
    // has had a chance to run. dispatchChange reads URL fresh — idempotent.
    if (document.readyState !== 'complete') {
      window.addEventListener('load', function () {
        dispatchChange(currentInfoPage());
      });
    } else {
      setTimeout(function () {
        dispatchChange(currentInfoPage());
      }, 250);
    }
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
