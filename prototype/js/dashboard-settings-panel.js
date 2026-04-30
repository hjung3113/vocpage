// B-17 Dashboard 설정 패널 슬라이드인
// spec: docs/specs/reviews/b-17-dashboard-settings-panel-design.md
// 두 모드: "내 설정" (모든 사용자) | "기본값" (Admin only)
// 의존: dom-utils.js (escHtml, showToast), role-state.js (currentUser)

(function () {
  'use strict';

  // ── Mock widget list (8 widgets matching dashboard.md)
  var DEFAULT_WIDGETS = [
    { id: 'kpi-volume',   name: 'KPI — Volume',           visible: true,  order: 1 },
    { id: 'kpi-quality',  name: 'KPI — Quality',          visible: true,  order: 2 },
    { id: 'dist-matrix',  name: '분포 & 매트릭스',         visible: true,  order: 3 },
    { id: 'heatmap',      name: '드릴다운 히트맵',         visible: true,  order: 4 },
    { id: 'trend-tag',    name: '주간 트렌드 & 태그 분포', visible: true,  order: 5 },
    { id: 'sla-aging',    name: '처리속도 & 에이징',       visible: true,  order: 6 },
    { id: 'assignee',     name: '담당자별 처리 현황',      visible: true,  order: 7 },
    { id: 'aging-top10',  name: '장기 미처리 VOC Top 10', visible: false, order: 8 },
  ];

  // ── Mock state store
  var DASHBOARD_DEFAULTS = null;           // admin system defaults
  var MY_SETTINGS = {};                    // per-user: MY_SETTINGS[userId]

  function getDefaultWidgets() {
    return DEFAULT_WIDGETS.map(function (w) { return Object.assign({}, w); });
  }

  function getUserSettings(userId) {
    if (!MY_SETTINGS[userId]) {
      MY_SETTINGS[userId] = getDefaultWidgets();
    }
    return MY_SETTINGS[userId].map(function (w) { return Object.assign({}, w); });
  }

  function getAdminDefaults() {
    if (!DASHBOARD_DEFAULTS) {
      DASHBOARD_DEFAULTS = getDefaultWidgets();
    }
    return DASHBOARD_DEFAULTS.map(function (w) { return Object.assign({}, w); });
  }

  // ── Active tab state
  var _activeTab = 'personal';  // 'personal' | 'admin'
  var _draft = [];              // working copy being edited

  // ── Panel DOM IDs
  var PANEL_ID   = 'dspPanel';
  var BACKDROP_ID = 'dspBackdrop';
  var _prevFocus = null; // R2: return-focus on close (a11y WCAG 2.4.3)

  function isAdminRole() {
    return (window.currentUser && window.currentUser.role) === 'admin';
  }

  // ── Open
  function openPanel() {
    _prevFocus = document.activeElement;
    var panel    = document.getElementById(PANEL_ID);
    var backdrop = document.getElementById(BACKDROP_ID);
    if (!panel) { _buildPanel(); panel = document.getElementById(PANEL_ID); backdrop = document.getElementById(BACKDROP_ID); }
    _activeTab = 'personal';
    _loadDraft();
    _renderContent();
    panel.setAttribute('data-open', 'true');
    backdrop.setAttribute('data-open', 'true');
    panel.focus();
  }

  // ── Close
  function closePanel() {
    var panel    = document.getElementById(PANEL_ID);
    var backdrop = document.getElementById(BACKDROP_ID);
    if (panel)    panel.setAttribute('data-open', 'false');
    if (backdrop) backdrop.setAttribute('data-open', 'false');
    // R2: restore focus to the trigger element
    if (_prevFocus && typeof _prevFocus.focus === 'function') {
      try { _prevFocus.focus(); } catch (_) {}
    }
    _prevFocus = null;
  }

  // ── Load draft for active tab
  function _loadDraft() {
    var userId = (window.currentUser && window.currentUser.id) || 'u-user';
    if (_activeTab === 'personal') {
      _draft = getUserSettings(userId);
    } else {
      _draft = getAdminDefaults();
    }
  }

  // ── Save
  function _save() {
    var userId = (window.currentUser && window.currentUser.id) || 'u-user';
    if (_activeTab === 'admin' && !isAdminRole()) {
      // R2: action-time admin guard (defense-in-depth — render-time gate could
      // be bypassed via console).
      if (typeof window.showToast === 'function') {
        window.showToast('기본값 변경 권한이 없습니다.', 'warn');
      }
      return;
    }
    if (_activeTab === 'personal') {
      MY_SETTINGS[userId] = _draft.map(function (w) { return Object.assign({}, w); });
    } else {
      DASHBOARD_DEFAULTS = _draft.map(function (w) { return Object.assign({}, w); });
    }
    // R2: dispatch event so dashboard grid can re-render (verifier P0 — without
    // this the feature is non-functional end-to-end).
    document.dispatchEvent(new CustomEvent('dashboard:settings-changed', {
      detail: { tab: _activeTab, userId: userId, widgets: _draft.slice() },
    }));
    if (typeof window.showToast === 'function') {
      window.showToast('저장되었습니다.', 'ok');
    }
    closePanel();
  }

  // ── Build panel DOM (once)
  function _buildPanel() {
    var isAdmin = (window.currentUser && window.currentUser.role) === 'admin';

    // Backdrop
    var bd = document.createElement('div');
    bd.id = BACKDROP_ID;
    bd.className = 'dsp-backdrop';
    bd.setAttribute('data-open', 'false');
    bd.addEventListener('click', closePanel);
    document.body.appendChild(bd);

    // Panel
    var panel = document.createElement('div');
    panel.id = PANEL_ID;
    panel.className = 'dsp-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-label', '대시보드 설정');
    panel.setAttribute('data-open', 'false');
    panel.setAttribute('tabindex', '-1');

    panel.innerHTML =
      '<div class="dsp-header">' +
        '<span class="dsp-title">대시보드 설정</span>' +
        '<button class="dsp-close-btn" aria-label="닫기" onclick="DashboardSettingsPanel.close()">&#x2715;</button>' +
      '</div>' +
      '<div class="dsp-tabs" id="dspTabs" role="tablist">' +
        '<button class="dsp-tab active" data-tab="personal" role="tab" aria-selected="true" onclick="DashboardSettingsPanel._switchTab(\'personal\')">내 설정</button>' +
        (isAdmin
          ? '<button class="dsp-tab" data-tab="admin" role="tab" aria-selected="false" onclick="DashboardSettingsPanel._switchTab(\'admin\')">기본값 <span class="dsp-tab-badge">Admin</span></button>'
          : '') +
      '</div>' +
      '<div class="dsp-list-wrap" id="dspListWrap"></div>' +
      '<div class="dsp-footer">' +
        '<button class="dsp-save-btn" onclick="DashboardSettingsPanel._save()">저장</button>' +
        '<button class="dsp-cancel-btn" onclick="DashboardSettingsPanel.close()">취소</button>' +
      '</div>';

    document.body.appendChild(panel);

    // Esc close
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        var p = document.getElementById(PANEL_ID);
        if (p && p.getAttribute('data-open') === 'true') closePanel();
      }
    });
  }

  // ── Switch tab
  function _switchTab(tab) {
    // R2: admin guard at action time (render-time gate is cosmetic only).
    if (tab === 'admin' && !isAdminRole()) {
      if (typeof window.showToast === 'function') {
        window.showToast('기본값 탭은 Admin 전용입니다.', 'warn');
      }
      return;
    }
    _activeTab = tab;
    _loadDraft();
    _renderContent();
    var tabs = document.querySelectorAll('#dspTabs .dsp-tab');
    tabs.forEach(function (t) {
      var on = t.getAttribute('data-tab') === tab;
      t.classList.toggle('active', on);
      t.setAttribute('aria-selected', on ? 'true' : 'false');
    });
  }

  // ── Rebuild tab buttons to reflect current role (called on role:change)
  function _rebuildTabs() {
    var tabsEl = document.getElementById('dspTabs');
    if (!tabsEl) return;
    var isAdmin = (window.currentUser && window.currentUser.role) === 'admin';
    // Remove admin tab if present
    var existing = tabsEl.querySelector('[data-tab="admin"]');
    if (existing && !isAdmin) {
      existing.remove();
      if (_activeTab === 'admin') {
        _activeTab = 'personal';
        _loadDraft();
        _renderContent();
      }
    } else if (!existing && isAdmin) {
      var btn = document.createElement('button');
      btn.className = 'dsp-tab';
      btn.setAttribute('data-tab', 'admin');
      btn.onclick = function () { DashboardSettingsPanel._switchTab('admin'); };
      btn.innerHTML = '기본값 <span class="dsp-tab-badge">Admin</span>';
      tabsEl.appendChild(btn);
    }
    // Sync active class
    tabsEl.querySelectorAll('.dsp-tab').forEach(function (t) {
      t.classList.toggle('active', t.getAttribute('data-tab') === _activeTab);
    });
  }

  // ── Render widget list
  function _renderContent() {
    var wrap = document.getElementById('dspListWrap');
    if (!wrap) return;

    var sorted = _draft.slice().sort(function (a, b) { return a.order - b.order; });
    var html = '';

    for (var i = 0; i < sorted.length; i++) {
      var w = sorted[i];
      var idx = i;
      var isFirst = idx === 0;
      var isLast  = idx === sorted.length - 1;

      html +=
        '<div class="dsp-row" data-id="' + escHtml(w.id) + '">' +
          '<label class="dsp-row-check">' +
            '<input type="checkbox" ' + (w.visible ? 'checked' : '') +
              ' onchange="DashboardSettingsPanel._toggleVisible(\'' + escHtml(w.id) + '\')">' +
          '</label>' +
          '<span class="dsp-row-name">' + escHtml(w.name) + '</span>' +
          '<div class="dsp-row-actions">' +
            '<button class="dsp-order-btn" title="위로" ' + (isFirst ? 'disabled' : '') +
              ' onclick="DashboardSettingsPanel._moveUp(\'' + escHtml(w.id) + '\')">&#9650;</button>' +
            '<button class="dsp-order-btn" title="아래로" ' + (isLast ? 'disabled' : '') +
              ' onclick="DashboardSettingsPanel._moveDown(\'' + escHtml(w.id) + '\')">&#9660;</button>' +
          '</div>' +
        '</div>';
    }

    wrap.innerHTML = html;
  }

  // ── Toggle visible
  function _toggleVisible(id) {
    for (var i = 0; i < _draft.length; i++) {
      if (_draft[i].id === id) {
        _draft[i].visible = !_draft[i].visible;
        break;
      }
    }
  }

  // ── Move helpers
  function _moveUp(id) {
    var sorted = _draft.slice().sort(function (a, b) { return a.order - b.order; });
    var idx = sorted.findIndex(function (w) { return w.id === id; });
    if (idx <= 0) return;
    var tmp = sorted[idx].order;
    sorted[idx].order = sorted[idx - 1].order;
    sorted[idx - 1].order = tmp;
    _draft = sorted;
    _renderContent();
  }

  function _moveDown(id) {
    var sorted = _draft.slice().sort(function (a, b) { return a.order - b.order; });
    var idx = sorted.findIndex(function (w) { return w.id === id; });
    if (idx < 0 || idx >= sorted.length - 1) return;
    var tmp = sorted[idx].order;
    sorted[idx].order = sorted[idx + 1].order;
    sorted[idx + 1].order = tmp;
    _draft = sorted;
    _renderContent();
  }

  // ── escHtml (local fallback, dom-utils.js loads first in practice)
  function escHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // ── Listen for role changes
  document.addEventListener('role:change', function () {
    _rebuildTabs();
  });

  // ── Public API
  window.DashboardSettingsPanel = {
    open:          openPanel,
    close:         closePanel,
    _switchTab:    _switchTab,
    _save:         _save,
    _toggleVisible: _toggleVisible,
    _moveUp:       _moveUp,
    _moveDown:     _moveDown,
  };
})();
