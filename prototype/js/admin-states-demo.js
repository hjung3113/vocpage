// admin-states-demo.js — C-14 Admin Non-data States demo toggle
// Wave 3-B · spec: uidesign §13.11
// Wires a state-toggle <select> into each admin page's admin-topbar.
// States: normal (정상) / empty (빈) / loading (로딩) / error (오류)
// Depends on: lucide (global), dom-utils.js (optional showToast)

(function () {
  'use strict';

  var STATES = ['normal', 'empty', 'loading', 'error'];
  var STATE_LABELS = { normal: '정상', empty: '빈', loading: '로딩', error: '오류' };

  // Per-page config: which content selectors to hide/show per state
  // Each entry: { pageId, contentSelectors[], emptyMsg, emptyCtaLabel }
  var PAGE_CONFIGS = [
    {
      pageId: 'page-users',
      contentSelectors: ['.admin-add-form', '.admin-table'],
      emptyMsg: '등록된 사용자가 없습니다.',
      emptyCtaLabel: '사용자 초대',
    },
    {
      pageId: 'page-tag-master',
      contentSelectors: ['.tm-callout', '.admin-table'],
      emptyMsg: '등록된 태그가 없습니다.',
      emptyCtaLabel: '태그 추가',
    },
    {
      pageId: 'page-voc-type',
      contentSelectors: ['.admin-add-form', '.admin-table'],
      emptyMsg: '등록된 유형이 없습니다.',
      emptyCtaLabel: '유형 추가',
    },
    {
      pageId: 'page-trash',
      contentSelectors: ['.tr-toolbar', '.tr-table', '.tr-audit'],
      emptyMsg: '휴지통이 비어 있습니다.',
      emptyCtaLabel: null,
    },
    {
      pageId: 'page-external-masters',
      contentSelectors: ['.em-atomic-note', '#emGrid', '.em-coldstart-banner'],
      emptyMsg: '등록된 외부 마스터가 없습니다.',
      emptyCtaLabel: null,
    },
    {
      pageId: 'page-result-review',
      contentSelectors: [],
      emptyMsg: '검토 대기 중인 항목이 없습니다.',
      emptyCtaLabel: null,
    },
    {
      pageId: 'page-notices',
      contentSelectors: [],
      emptyMsg: '등록된 공지사항이 없습니다.',
      emptyCtaLabel: '공지 등록',
    },
    {
      pageId: 'page-faq',
      contentSelectors: [],
      emptyMsg: '등록된 FAQ가 없습니다.',
      emptyCtaLabel: 'FAQ 등록',
    },
    {
      pageId: 'page-tag-rules',
      contentSelectors: ['.admin-add-form', '.admin-table'],
      emptyMsg: '등록된 태그 규칙이 없습니다.',
      emptyCtaLabel: '규칙 추가',
    },
    {
      pageId: 'page-system-menu',
      contentSelectors: ['.admin-add-form', '.admin-table'],
      emptyMsg: '등록된 시스템/메뉴가 없습니다.',
      emptyCtaLabel: '시스템 추가',
    },
  ];

  // Build skeleton rows HTML (5 rows, varying widths for realism)
  function buildSkeletonRows() {
    var widths = [
      ['w-120', 'flex-1', 'w-80', 'w-60', 'w-40'],
      ['w-80', 'flex-1', 'w-120', 'w-40', 'w-60'],
      ['w-60', 'flex-1', 'w-40', 'w-80', 'w-60'],
      ['w-120', 'flex-1', 'w-60', 'w-40', 'w-80'],
      ['w-80', 'flex-1', 'w-80', 'w-60', 'w-40'],
    ];
    return widths
      .map(function (row) {
        return (
          '<div class="admin-skeleton-row">' +
          '<div class="admin-skeleton-cell w-8"></div>' +
          row
            .map(function (w) {
              return '<div class="admin-skeleton-cell ' + w + '"></div>';
            })
            .join('') +
          '</div>'
        );
      })
      .join('');
  }

  // Build state container HTML for a page config
  function buildStateContainer(cfg) {
    var emptyCtaHtml = cfg.emptyCtaLabel
      ? '<button type="button" class="admin-empty-cta" onclick="void(0)">' +
        cfg.emptyCtaLabel +
        '</button>'
      : '';

    return (
      '<div class="admin-state-container" id="' +
      cfg.pageId +
      '-state-container">' +
      // Empty state
      '<div class="admin-empty admin-state-panel" data-state="empty" style="display:none">' +
      '<svg class="admin-empty-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" ' +
      'stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 01-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 011-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 011.52 0C14.51 3.81 17 5 19 5a1 1 0 011 1z"/>' +
      '</svg>' +
      '<p class="admin-empty-title">데이터가 없습니다</p>' +
      '<p class="admin-empty-desc">' +
      cfg.emptyMsg +
      '</p>' +
      emptyCtaHtml +
      '</div>' +
      // Loading state
      '<div class="admin-loading admin-state-panel" data-state="loading" style="display:none">' +
      buildSkeletonRows() +
      '</div>' +
      // Error state
      '<div class="admin-error admin-state-panel" data-state="error" style="display:none">' +
      '<div class="admin-error-banner">' +
      '<svg class="admin-error-banner-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" ' +
      'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
      '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>' +
      '</svg>' +
      '데이터를 불러오지 못했습니다.' +
      '</div>' +
      '<p class="admin-error-desc">서버 연결에 실패했습니다. 잠시 후 다시 시도해 주세요.</p>' +
      '<button type="button" class="admin-error-retry">' +
      '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" ' +
      'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>' +
      '<path d="M3 3v5h5"/>' +
      '</svg>' +
      '재시도' +
      '</button>' +
      '</div>' +
      '</div>'
    );
  }

  // Apply a state to a page
  function applyState(cfg, state) {
    var page = document.getElementById(cfg.pageId);
    if (!page) return;

    var container = document.getElementById(cfg.pageId + '-state-container');
    if (!container) return;

    // Show/hide normal content selectors
    var isNormal = state === 'normal';
    cfg.contentSelectors.forEach(function (sel) {
      var els = page.querySelectorAll(sel);
      els.forEach(function (el) {
        el.style.display = isNormal ? '' : 'none';
      });
    });

    // Hide/show state container
    if (isNormal) {
      container.classList.remove('is-active');
      container.querySelectorAll('.admin-state-panel').forEach(function (p) {
        p.style.display = 'none';
      });
    } else {
      container.classList.add('is-active');
      container.querySelectorAll('.admin-state-panel').forEach(function (p) {
        p.style.display = p.dataset.state === state ? '' : 'none';
      });
    }
  }

  // Wire a toggle select into a page's admin-topbar (or fallback container)
  function wireToggle(cfg) {
    var page = document.getElementById(cfg.pageId);
    if (!page) return;

    // Insert state container after admin-topbar or at start of admin-body
    var insertTarget =
      page.querySelector('.admin-body') || page.querySelector('.admin-topbar') || page;

    // Build and inject state container
    var tempDiv = document.createElement('div');
    tempDiv.innerHTML = buildStateContainer(cfg);
    var stateContainer = tempDiv.firstChild;

    // Insert after admin-topbar if present, else prepend to page
    var topbar = page.querySelector('.admin-topbar');
    if (topbar && topbar.nextSibling) {
      page.insertBefore(stateContainer, topbar.nextSibling);
    } else if (insertTarget === page.querySelector('.admin-body')) {
      insertTarget.insertBefore(stateContainer, insertTarget.firstChild);
    } else {
      page.appendChild(stateContainer);
    }

    // Build toggle select
    var wrap = document.createElement('div');
    wrap.className = 'admin-state-toggle-wrap';
    wrap.innerHTML =
      '<span class="admin-state-toggle-label">상태 데모</span>' +
      '<select class="admin-state-toggle" aria-label="상태 데모 전환">' +
      STATES.map(function (s) {
        return '<option value="' + s + '">' + STATE_LABELS[s] + '</option>';
      }).join('') +
      '</select>';

    var sel = wrap.querySelector('select');
    sel.addEventListener('change', function () {
      applyState(cfg, sel.value);
    });

    // Inject into topbar spacer area or at end of topbar
    if (topbar) {
      // Insert before last child if there's a spacer, otherwise append
      var spacer = topbar.querySelector('.spacer');
      if (spacer && spacer.nextSibling) {
        topbar.insertBefore(wrap, spacer.nextSibling);
      } else {
        topbar.appendChild(wrap);
      }
    }
  }

  // Init: wire all configured pages
  function init() {
    PAGE_CONFIGS.forEach(function (cfg) {
      wireToggle(cfg);
    });
  }

  // Run after DOM is ready (scripts are at bottom, so DOM is ready)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.AdminStatesDemo = { init: init, applyState: applyState };
})();
