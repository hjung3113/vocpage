// ── B-4b FAQ Admin UI — faq-admin.js
// Additive module — DO NOT modify notice-faq.js or admin-mode.js.
// Injects admin panel into #faqAdminBody via MutationObserver.
// Modal DOM builders are in faq-admin-modals.js (loaded after this file).
// Depends on: dom-utils.js (escHtml, showToast), data.js (FAQS, FAQ_CATEGORIES),
//             admin-mode.js (AdminMode), notice-faq.js (renderFaq)
// Export: window.FaqAdmin

(function () {
  'use strict';

  var esc = function (s) { return window.escHtml ? window.escHtml(s) : String(s == null ? '' : s); };
  var toast = function (m, k) { if (window.showToast) window.showToast(m, k); };

  // ── module state
  var activeTab = 'faqs'; // 'faqs' | 'categories'

  // ── helpers
  function currentRole() {
    return (window.currentUser && window.currentUser.role) || 'user';
  }
  function isAdmin() { return currentRole() === 'admin'; }

  function isAdminMode() {
    return window.AdminMode && window.AdminMode.isAdminMode() && window.AdminMode.canEnterAdminMode();
  }

  // ── inject per-row action buttons
  function injectFaqRowActions(bodyEl) {
    bodyEl.querySelectorAll('.faq-item').forEach(function (item) {
      if (item.getAttribute('data-nfa-injected')) return;
      item.setAttribute('data-nfa-injected', '1');
      var row = item.querySelector('.notice-row');
      if (!row) return;
      var match = (row.getAttribute('onclick') || '').match(/toggleFaq\((\d+)\)/);
      if (!match) return;
      var id = parseInt(match[1], 10);
      var faq = (window.FAQS || []).find(function (f) { return f.id === id; });
      if (!faq) return;
      var existing = row.querySelector('.nfa-row-actions');
      if (existing) existing.remove();
      var div = document.createElement('div');
      div.className = 'nfa-row-actions';
      div.innerHTML =
        '<button type="button" class="nfa-action-btn" data-action="edit" data-id="' + id + '">편집</button>' +
        '<button type="button" class="nfa-action-btn danger" data-action="delete" data-id="' + id + '">삭제</button>' +
        '<button type="button" class="nfa-action-btn ' + (faq.visible ? 'toggle-on' : 'toggle-off') + '" data-action="toggle" data-id="' + id + '">' + (faq.visible ? '노출중' : '비노출') + '</button>';
      div.addEventListener('click', function (e) {
        e.stopPropagation();
        var btn = e.target.closest('[data-action]');
        if (!btn) return;
        var action = btn.getAttribute('data-action');
        var fid = parseInt(btn.getAttribute('data-id'), 10);
        if (action === 'edit') window.FaqAdminModals && window.FaqAdminModals.openEditFaqModal(fid);
        else if (action === 'delete') softDelete(fid);
        else if (action === 'toggle') toggleVisibility(fid);
      });
      row.appendChild(div);
    });
  }

  // ── render admin bar (tabs + add button)
  function renderAdminPanel(bodyEl) {
    if (!bodyEl) return;
    var oldBar = bodyEl.querySelector('.nfa-admin-bar');
    if (oldBar) oldBar.remove();
    var bar = document.createElement('div');
    bar.className = 'nfa-admin-bar';
    bar.innerHTML =
      '<div class="nfa-tab-group">' +
      '<button type="button" class="nfa-tab-btn' + (activeTab === 'faqs' ? ' active' : '') + '" data-tab="faqs">FAQ 항목</button>' +
      (isAdmin() ? '<button type="button" class="nfa-tab-btn' + (activeTab === 'categories' ? ' active' : '') + '" data-tab="categories">카테고리 관리</button>' : '') +
      '</div>' +
      (activeTab === 'faqs'
        ? '<button type="button" class="nfa-btn-add" id="faqAddBtn">+ FAQ 등록</button>'
        : (isAdmin() ? '<button type="button" class="nfa-btn-add" id="catAddBtn">+ 카테고리 추가</button>' : ''));
    bar.addEventListener('click', function (e) {
      var tabBtn = e.target.closest('[data-tab]');
      if (tabBtn) switchAdminTab(tabBtn.getAttribute('data-tab'));
    });
    bodyEl.insertBefore(bar, bodyEl.firstChild);
    var addFaqBtn = bodyEl.querySelector('#faqAddBtn');
    if (addFaqBtn) addFaqBtn.addEventListener('click', function () {
      window.FaqAdminModals && window.FaqAdminModals.openCreateFaqModal();
    });
    var addCatBtn = bodyEl.querySelector('#catAddBtn');
    if (addCatBtn) addCatBtn.addEventListener('click', function () {
      window.FaqAdminModals && window.FaqAdminModals.openCreateCategoryModal();
    });
    if (activeTab === 'faqs') {
      injectFaqRowActions(bodyEl);
      renderDeletedSection(bodyEl);
    } else if (activeTab === 'categories' && isAdmin()) {
      renderCategoryTab(bodyEl);
    }
  }

  // ── deleted FAQ section (admin only)
  function renderDeletedSection(bodyEl) {
    var oldDel = bodyEl.querySelector('.nfa-deleted-section');
    if (oldDel) oldDel.remove();
    if (!isAdmin()) return;
    var deleted = (window.FAQS || []).filter(function (f) { return f._deleted; });
    var section = document.createElement('div');
    section.className = 'nfa-deleted-section';
    section.innerHTML =
      '<div class="nfa-deleted-header" id="faqDeletedHdr"><i data-lucide="chevron-down"></i>' +
      '<span>삭제됨 (Admin only) — ' + deleted.length + '건</span></div>' +
      '<div class="nfa-deleted-body" id="faqDeletedBody">' +
      deleted.map(function (f) {
        return '<div class="nfa-deleted-item"><span class="title">' + esc(f.q) + '</span>' +
          '<button type="button" class="nfa-restore-btn" data-restore="' + f.id + '">복원</button></div>';
      }).join('') + '</div>';
    bodyEl.appendChild(section);
    var hdr = section.querySelector('#faqDeletedHdr');
    var delBody = section.querySelector('#faqDeletedBody');
    hdr.addEventListener('click', function () {
      var open = delBody.classList.toggle('open');
      hdr.classList.toggle('open', open);
    });
    section.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-restore]');
      if (btn) restore(parseInt(btn.getAttribute('data-restore'), 10));
    });
    if (window.lucide) { try { lucide.createIcons({ nodes: [section] }); } catch (_) {} }
  }

  // ── category table (admin only)
  function renderCategoryTab(bodyEl) {
    if (!isAdmin()) return;
    var oldWrap = bodyEl.querySelector('.nfa-cat-wrap');
    if (oldWrap) oldWrap.remove();
    var cats = (window.FAQ_CATEGORIES || []).slice().sort(function (a, b) { return a.order - b.order; });
    var wrap = document.createElement('div');
    wrap.className = 'nfa-cat-wrap';
    wrap.innerHTML =
      '<table class="nfa-cat-table"><thead><tr>' +
      '<th>이름</th><th>순서</th><th>표시</th><th>FAQ 수</th><th>액션</th>' +
      '</tr></thead><tbody>' +
      cats.map(function (c) {
        var cnt = (window.FAQS || []).filter(function (f) { return f.category === c.name && !f._deleted; }).length;
        return '<tr><td>' + esc(c.name) + '</td><td>' + esc(c.order) + '</td>' +
          '<td>' + (c.visible ? '<span style="color:var(--accent);font-size:12px">ON</span>' : '<span style="color:var(--text-quaternary);font-size:12px">OFF</span>') + '</td>' +
          '<td>' + cnt + '건</td>' +
          '<td style="white-space:nowrap"><button type="button" class="nfa-action-btn" data-cat-edit="' + c.id + '">편집</button> ' +
          '<button type="button" class="nfa-action-btn danger" data-cat-delete="' + c.id + '">삭제</button></td></tr>';
      }).join('') + '</tbody></table>';
    wrap.addEventListener('click', function (e) {
      var editBtn = e.target.closest('[data-cat-edit]');
      if (editBtn) { window.FaqAdminModals && window.FaqAdminModals.openEditCategoryModal(parseInt(editBtn.getAttribute('data-cat-edit'), 10)); return; }
      var delBtn = e.target.closest('[data-cat-delete]');
      if (delBtn) deleteCategory(parseInt(delBtn.getAttribute('data-cat-delete'), 10));
    });
    bodyEl.appendChild(wrap);
  }

  // ── CRUD actions
  function toggleVisibility(id) {
    var f = (window.FAQS || []).find(function (x) { return x.id === id; });
    if (!f) return;
    f.visible = !f.visible;
    toast(f.visible ? 'FAQ 노출 ON' : 'FAQ 노출 OFF', 'ok');
    if (typeof window.renderFaq === 'function') window.renderFaq();
  }

  function softDelete(id) {
    var f = (window.FAQS || []).find(function (x) { return x.id === id; });
    if (!f) return;
    f._deleted = true;
    f.visible = false;
    toast('FAQ가 삭제되었습니다 (soft delete)', 'ok');
    if (typeof window.renderFaq === 'function') window.renderFaq();
  }

  function restore(id) {
    if (!isAdmin()) { toast('복원 권한이 없습니다.', 'warn'); return; }
    var f = (window.FAQS || []).find(function (x) { return x.id === id; });
    if (!f) return;
    f._deleted = false;
    f.visible = true;
    toast('FAQ가 복원되었습니다.', 'ok');
    if (typeof window.renderFaq === 'function') window.renderFaq();
  }

  function deleteCategory(id) {
    var cats = window.FAQ_CATEGORIES || [];
    var cat = cats.find(function (c) { return c.id === id; });
    if (!cat) return;
    var count = (window.FAQS || []).filter(function (f) { return f.category === cat.name && !f._deleted; }).length;
    if (count > 0) { toast('해당 카테고리에 FAQ 항목이 있어 삭제할 수 없습니다.', 'warn'); return; }
    window.FAQ_CATEGORIES = cats.filter(function (c) { return c.id !== id; });
    toast('카테고리가 삭제되었습니다.', 'ok');
    if (typeof window.renderFaq === 'function') window.renderFaq();
  }

  function switchAdminTab(tab) {
    if (!isAdmin() && tab === 'categories') return;
    activeTab = tab;
    if (typeof window.renderFaq === 'function') window.renderFaq();
  }

  // ── MutationObserver
  var observer = null;

  function attachObserver() {
    if (observer) { observer.disconnect(); observer = null; }
    if (!isAdminMode()) return;
    var body = document.getElementById('faqAdminBody');
    if (body) renderAdminPanel(body);
    observer = new MutationObserver(function () {
      if (!isAdminMode()) { observer.disconnect(); observer = null; return; }
      var b = document.getElementById('faqAdminBody');
      if (b) renderAdminPanel(b);
    });
    var page = document.getElementById('page-faq');
    if (page) observer.observe(page, { childList: true, subtree: false });
  }

  function onAdminModeChange() {
    if (!isAdminMode()) { if (observer) { observer.disconnect(); observer = null; } activeTab = 'faqs'; return; }
    attachObserver();
  }

  function init() {
    if (window.FaqAdminModals) window.FaqAdminModals.init();
    document.addEventListener('admin-mode:change', onAdminModeChange);
    document.addEventListener('role:change', onAdminModeChange);
    setTimeout(onAdminModeChange, 80);
  }

  window.FaqAdmin = {
    init: init,
    renderAdminPanel: renderAdminPanel,
    renderCategoryTab: renderCategoryTab,
    toggleVisibility: toggleVisibility,
    softDelete: softDelete,
    restore: restore,
    deleteCategory: deleteCategory,
    switchAdminTab: switchAdminTab,
    getActiveTab: function () { return activeTab; },
  };
})();
