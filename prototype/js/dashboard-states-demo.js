// dashboard-states-demo.js — W3-C B+C: Dashboard widget empty/error states + W7 가로 스크롤
// spec: dashboard.md W2~W11, N-05
// Demo toggle gated behind ?demo URL param (consistent with admin-states-demo.js pattern)
// W7 system status cards rendered always (not gated) — scroll logic applies regardless

(function () {
  'use strict';

  // ── W7 현황 카드 rendering ────────────────────────────────────────────────
  // Mock status breakdown per channel (채널별 상태 분포)
  // DASH_SYS_DATA provides total/unresolved; we split into status breakdown here
  var W7_MOCK = [
    { name: '채널 A', total: 308, receive: 28, review: 41, process: 89, done: 142, drop: 8 },
    { name: '채널 B', total: 317, receive: 31, review: 44, process: 92, done: 141, drop: 9 },
    { name: '채널 C', total: 197, receive: 12, review: 18, process: 56, done: 104, drop: 7 },
    { name: '채널 D', total: 159, receive: 9, review: 14, process: 42, done: 87, drop: 7 },
    { name: '채널 E', total: 95, receive: 7, review: 10, process: 28, done: 45, drop: 5 },
    { name: '채널 F', total: 72, receive: 0, review: 5, process: 18, done: 46, drop: 3 },
    { name: '채널 G', total: 56, receive: 0, review: 3, process: 12, done: 38, drop: 3 },
  ];

  function buildW7Card(item) {
    return (
      '<div class="w7-card">' +
      '<div class="w7-card-name">' +
      escHtml(item.name) +
      '</div>' +
      '<div class="w7-card-rows">' +
      '<div class="w7-card-row"><span class="w7-card-lbl">전체</span><span class="w7-card-val w7-card-val--total">' +
      item.total +
      '</span></div>' +
      '<div class="w7-card-row"><span class="w7-card-lbl">접수</span><span class="w7-card-val w7-card-val--receive">' +
      item.receive +
      '</span></div>' +
      '<div class="w7-card-row"><span class="w7-card-lbl">검토중</span><span class="w7-card-val w7-card-val--review">' +
      item.review +
      '</span></div>' +
      '<div class="w7-card-row"><span class="w7-card-lbl">처리중</span><span class="w7-card-val w7-card-val--process">' +
      item.process +
      '</span></div>' +
      '<div class="w7-card-row"><span class="w7-card-lbl">완료</span><span class="w7-card-val w7-card-val--done">' +
      item.done +
      '</span></div>' +
      '<div class="w7-card-row"><span class="w7-card-lbl">드랍</span><span class="w7-card-val w7-card-val--drop">' +
      item.drop +
      '</span></div>' +
      '</div>' +
      '</div>'
    );
  }

  function escHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function renderW7Cards(items) {
    var container = document.getElementById('w7Cards');
    if (!container) return;
    container.innerHTML = items.map(buildW7Card).join('');

    // Show/hide scroll buttons based on card count (5+)
    var showArrows = items.length >= 5;
    var btnLeft = document.getElementById('w7ScrollLeft');
    var btnRight = document.getElementById('w7ScrollRight');
    if (btnLeft) btnLeft.style.display = showArrows ? '' : 'none';
    if (btnRight) btnRight.style.display = showArrows ? '' : 'none';

    // Show/hide right fade gradient
    updateW7Fade();
    if (!container.dataset.scrollListenerAttached) {
      container.dataset.scrollListenerAttached = '1';
      container.addEventListener('scroll', updateW7Fade);
    }
  }

  function updateW7Fade() {
    var container = document.getElementById('w7Cards');
    var fade = document.getElementById('w7FadeRight');
    if (!container || !fade) return;
    var atEnd = container.scrollLeft + container.clientWidth >= container.scrollWidth - 8;
    fade.style.display = atEnd ? 'none' : '';
  }

  // Exposed globally for onclick in prototype.html
  window.w7Scroll = function w7Scroll(dir) {
    var container = document.getElementById('w7Cards');
    if (!container) return;
    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    container.scrollBy({ left: dir * 160, behavior: reducedMotion ? 'auto' : 'smooth' });
  };

  // ── B: Widget empty/error state toggle ───────────────────────────────────
  // Widget sections in .dash-body — ordered to match DASH_WIDGET_NAMES
  // Each entry: { id (optional), selector, contentQuery, label }
  // 11 widget entries — each targets a single data-dash-widget element
  // Paired groups (분포/매트릭스, 트렌드/태그, 처리속도/에이징) split into separate entries (F5)
  var WIDGET_SECTIONS = [
    {
      label: 'KPI (Volume)',
      selector: '[data-dash-widget="kpi-volume"]',
      contentQuery: '.kpi-grid',
    },
    {
      label: 'KPI (Quality)',
      selector: '[data-dash-widget="kpi-quality"]',
      contentQuery: '.kpi-grid',
    },
    {
      label: '분포',
      selector: '[data-dash-widget="dist"]',
      contentQuery: '#distContent, .d-tabs',
    },
    {
      label: '매트릭스',
      selector: '[data-dash-widget="matrix"]',
      contentQuery: 'table',
    },
    {
      label: '드릴다운 히트맵',
      selector: '[data-dash-widget="heatmap"]',
      contentQuery: '#hmTable, .heatmap-top',
    },
    {
      label: '주간 트렌드',
      selector: '[data-dash-widget="trend"]',
      contentQuery: '.chart-area, .chart-legend',
    },
    {
      label: '태그별 분포',
      selector: '[data-dash-widget="tags"]',
      contentQuery: '.bar-list',
    },
    {
      label: '현황 카드',
      selector: '[data-dash-widget="status-cards"]',
      contentQuery: '.w7-scroll-wrap',
    },
    {
      label: '처리속도',
      selector: '[data-dash-widget="throughput"]',
      contentQuery: '#slaCardWrap',
    },
    {
      label: '에이징',
      selector: '[data-dash-widget="aging"]',
      contentQuery: '#agingCardWrap',
    },
    {
      label: '담당자별 현황',
      selector: '[data-dash-widget="assignee"]',
      contentQuery: '#assignTable',
    },
    {
      label: '장기 미처리',
      selector: '[data-dash-widget="long-pending"]',
      contentQuery: '#agingTableWrap',
    },
  ];

  var STATES = ['normal', 'empty', 'error'];
  var STATE_LABELS = { normal: '정상', empty: '빈', error: '오류' };

  function buildWidgetEmptyHTML() {
    return (
      '<div class="widget-empty" role="status" aria-live="polite" data-dash-state-panel="empty">' +
      '<svg class="widget-empty-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" ' +
      'stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
      '<rect x="3" y="3" width="18" height="18" rx="2"/>' +
      '<path d="M3 9h18M9 21V9"/>' +
      '</svg>' +
      '<span class="widget-empty-label">데이터 없음</span>' +
      '</div>'
    );
  }

  function buildWidgetErrorHTML() {
    return (
      '<div class="widget-error" role="alert" data-dash-state-panel="error">' +
      '<div class="widget-error-banner">' +
      '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" ' +
      'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
      '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>' +
      '<line x1="12" y1="16" x2="12.01" y2="16"/>' +
      '</svg>' +
      '데이터를 불러오지 못했습니다.' +
      '</div>' +
      '<button type="button" class="widget-error-retry" onclick="void(0)">재시도</button>' +
      '</div>'
    );
  }

  function applyWidgetState(cfg, state) {
    var el = document.querySelector(cfg.selector);
    if (!el) return;

    // Remove previously injected state panels
    el.querySelectorAll('[data-dash-state-panel]').forEach(function (p) {
      p.remove();
    });

    var isNormal = state === 'normal';

    // Hide/show content elements
    if (cfg.contentQuery) {
      cfg.contentQuery.split(',').forEach(function (q) {
        el.querySelectorAll(q.trim()).forEach(function (c) {
          c.style.display = isNormal ? '' : 'none';
        });
      });
    }

    if (!isNormal) {
      var panel = state === 'empty' ? buildWidgetEmptyHTML() : buildWidgetErrorHTML();
      var tempDiv = document.createElement('div');
      tempDiv.innerHTML = panel;
      var panelEl = tempDiv.firstElementChild;

      // Insert after widget-header if present, else append
      var header = el.querySelector('.widget-header');
      if (header && header.nextSibling) {
        el.insertBefore(panelEl, header.nextSibling);
      } else {
        el.appendChild(panelEl);
      }
    }
  }

  function applyAllWidgetsState(state) {
    WIDGET_SECTIONS.forEach(function (cfg) {
      applyWidgetState(cfg, state);
    });
  }

  function buildDashToggle() {
    var header = document.querySelector('.dash-header .dash-controls');
    if (!header) return;
    if (header.querySelector('.dash-state-toggle')) return;

    var wrap = document.createElement('div');
    wrap.className = 'dash-state-toggle-wrap';
    wrap.innerHTML =
      '<span class="dash-state-toggle-label">상태 데모</span>' +
      '<select class="dash-state-toggle" aria-label="대시보드 상태 데모 전환">' +
      STATES.map(function (s) {
        return '<option value="' + s + '">' + STATE_LABELS[s] + '</option>';
      }).join('') +
      '</select>';

    var sel = wrap.querySelector('select');
    sel.addEventListener('change', function () {
      applyAllWidgetsState(sel.value);
    });

    header.appendChild(wrap);
  }

  function init() {
    // W7 cards render always (no ?demo gate needed — it's a feature, not a debug toggle)
    renderW7Cards(W7_MOCK);

    // Lucide icons for scroll buttons
    if (window.lucide && typeof lucide.createIcons === 'function') {
      var w7Widget = document.getElementById('w7-status-widget');
      if (w7Widget) {
        try {
          lucide.createIcons({ nodes: [w7Widget] });
        } catch (_) {
          lucide.createIcons();
        }
      }
    }

    // State demo toggle — gated behind ?demo URL param
    if (!new URLSearchParams(window.location.search).has('demo')) return;
    buildDashToggle();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.DashboardStatesDemo = { init: init, applyAllWidgetsState: applyAllWidgetsState };
})();
