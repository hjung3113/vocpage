// B-3 Login-time Notice Popup (Wave 2) — 2-panel modal per spec.
// spec: docs/specs/requires/feature-notice-faq.md §10.3.2 (behavior),
//       docs/specs/requires/uidesign.md §13.9 (visual) + §13.6.1 (badge).
// Loads BEFORE init.js so init can call NoticePopup.init() at startup.

(function () {
  'use strict';

  var SEVERITY_ORDER = { urgent: 0, important: 1, normal: 2 };
  var SEVERITY_LABEL = { urgent: '긴급', important: '중요', normal: '일반' };

  function escHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function todayStr() {
    return new Date().toISOString().slice(0, 10);
  }

  function tomorrowStr() {
    var d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  }

  function dismissKey() {
    var uid = (window.currentUser && window.currentUser.id) || 'anon';
    return 'notice_dismiss_until_' + uid;
  }

  // True if user previously checked "오늘 하루 보지 않기" and that window is still active.
  function isDismissed() {
    var stored = localStorage.getItem(dismissKey());
    if (!stored) return false;
    return stored >= todayStr();
  }

  function eligibleNotices() {
    // NOTICES is declared at script scope by data.js (classic <script> tag),
    // so it is reachable lexically from this IIFE without window prefix.
    var src = typeof NOTICES !== 'undefined' ? NOTICES : [];
    if (!Array.isArray(src)) return [];
    var t = todayStr();
    return src
      .filter(function (n) {
        return n.visible && n.popup && n.from <= t && n.to >= t;
      })
      .sort(function (a, b) {
        return SEVERITY_ORDER[a.level] - SEVERITY_ORDER[b.level];
      });
  }

  // Selected notice id, kept in module scope so list ↔ detail stay in sync.
  var selectedId = null;
  var notices = [];

  function renderListItem(n) {
    var sel = n.id === selectedId ? ' is-selected' : '';
    return (
      '<button type="button" class="np-item' +
      sel +
      '" role="option" aria-selected="' +
      (n.id === selectedId ? 'true' : 'false') +
      '" data-id="' +
      escHtml(String(n.id)) +
      '">' +
      '<span class="notice-badge notice-badge-' +
      escHtml(n.level) +
      '">' +
      escHtml(SEVERITY_LABEL[n.level] || n.level) +
      '</span>' +
      '<span class="np-item-title">' +
      escHtml(n.title) +
      '</span>' +
      '</button>'
    );
  }

  function renderDetail(n) {
    if (!n) return '<div class="np-detail-empty">표시할 공지가 없습니다.</div>';
    return (
      '<div class="np-detail-header">' +
      '<span class="notice-badge notice-badge-' +
      escHtml(n.level) +
      '">' +
      escHtml(SEVERITY_LABEL[n.level] || n.level) +
      '</span>' +
      '<h3 class="np-detail-title">' +
      escHtml(n.title) +
      '</h3>' +
      '</div>' +
      // SECURITY: content is BE-authored notice HTML (admin/manager only writers).
      // Prototype mock contains <p>/<strong> markup — render as HTML so spec'd
      // formatting works. Phase 8 BE MUST sanitize at write time (DOMPurify or
      // server-side allow-list); FE never sanitizes user content.
      '<div class="np-detail-body">' +
      (n.content || '') +
      '</div>'
    );
  }

  function refreshDetail() {
    var d = document.getElementById('npDetail');
    if (!d) return;
    var n = notices.find(function (x) {
      return x.id === selectedId;
    });
    d.innerHTML = renderDetail(n);
  }

  function refreshList() {
    var l = document.getElementById('npList');
    if (!l) return;
    l.innerHTML = notices.map(renderListItem).join('');
  }

  function selectNotice(id) {
    selectedId = id;
    refreshList();
    refreshDetail();
  }

  function close(saveDismiss) {
    if (saveDismiss) {
      localStorage.setItem(dismissKey(), tomorrowStr());
    }
    var ov = document.getElementById('noticePopupOverlay');
    if (ov && ov.parentNode) ov.parentNode.removeChild(ov);
    document.removeEventListener('keydown', onKey);
  }

  function onKey(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      var cb = document.getElementById('npHideToday');
      close(cb ? cb.checked : false);
    }
  }

  function build() {
    var overlay = document.createElement('div');
    overlay.id = 'noticePopupOverlay';
    overlay.className = 'notice-popup-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'npTitle');

    overlay.innerHTML =
      '<div class="notice-popup-dialog">' +
      '<header class="np-header">' +
      '<h2 id="npTitle" class="np-header-title">공지사항</h2>' +
      '<button type="button" class="np-x" aria-label="닫기" id="npX">✕</button>' +
      '</header>' +
      '<div class="np-body">' +
      '<div class="np-list" id="npList" role="listbox" aria-label="공지 목록"></div>' +
      '<div class="np-detail" id="npDetail" aria-live="polite"></div>' +
      '</div>' +
      '<footer class="np-footer">' +
      '<label class="np-hide-today">' +
      '<input type="checkbox" id="npHideToday">' +
      '<span>오늘 하루 보지 않기</span>' +
      '</label>' +
      '<button type="button" class="admin-btn admin-btn-ghost" id="npClose">닫기</button>' +
      '</footer>' +
      '</div>';

    document.body.appendChild(overlay);
    refreshList();
    refreshDetail();

    document.getElementById('npList').addEventListener('click', function (e) {
      var item = e.target.closest('.np-item');
      if (!item) return;
      var id = Number(item.getAttribute('data-id'));
      if (!Number.isNaN(id)) selectNotice(id);
    });

    var closeBtn = document.getElementById('npClose');
    var xBtn = document.getElementById('npX');
    function doClose() {
      var cb = document.getElementById('npHideToday');
      close(cb ? cb.checked : false);
    }
    closeBtn.addEventListener('click', doClose);
    xBtn.addEventListener('click', function () {
      // Header X is a "non-commit" close — never persists dismissal.
      close(false);
    });
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) close(false);
    });
    document.addEventListener('keydown', onKey);
    setTimeout(function () {
      var firstItem = document.querySelector('#npList .np-item.is-selected');
      if (firstItem) firstItem.focus();
    }, 0);
  }

  function init() {
    if (isDismissed()) return;
    notices = eligibleNotices();
    if (!notices.length) return;
    selectedId = notices[0].id; // Default to highest severity (already sorted desc).
    build();
  }

  window.NoticePopup = {
    init: init,
    close: close,
    isDismissed: isDismissed,
    _eligible: eligibleNotices, // exposed for testing/inspection
  };
})();
