// ── B-4b FAQ Admin Modals — faq-admin-modals.js
// Modal DOM builders for FaqAdmin. Loaded after faq-admin.js.
// Depends on: dom-utils.js, data.js (FAQS, FAQ_CATEGORIES), faq-admin.js
// Export: window.FaqAdminModals

(function () {
  'use strict';

  var esc = function (s) {
    return window.escHtml ? window.escHtml(s) : String(s == null ? '' : s);
  };
  var toast = function (m, k) {
    if (window.showToast) window.showToast(m, k);
  };

  // ── state
  var faqModalMode = 'create';
  var faqEditingId = null;
  var catModalMode = 'create';
  var catEditingId = null;

  function nextFaqId() {
    var ids = (window.FAQS || []).map(function (f) {
      return f.id;
    });
    return ids.length ? Math.max.apply(null, ids) + 1 : 1;
  }

  function nextCatId() {
    var ids = (window.FAQ_CATEGORIES || []).map(function (c) {
      return c.id;
    });
    return ids.length ? Math.max.apply(null, ids) + 1 : 1;
  }

  function categoryOptions(selected) {
    return (window.FAQ_CATEGORIES || [])
      .map(function (c) {
        return (
          '<option value="' +
          esc(c.name) +
          '"' +
          (c.name === selected ? ' selected' : '') +
          '>' +
          esc(c.name) +
          '</option>'
        );
      })
      .join('');
  }

  // ── FAQ Modal
  function getFaqModal() {
    return document.getElementById('nfaFaqModal');
  }

  function openCreateFaqModal() {
    faqModalMode = 'create';
    faqEditingId = null;
    renderFaqModal({ q: '', a: '', category: '', visible: true });
  }

  function openEditFaqModal(id) {
    var f = (window.FAQS || []).find(function (x) {
      return x.id === id;
    });
    if (!f) return;
    faqModalMode = 'edit';
    faqEditingId = id;
    renderFaqModal(f);
  }

  function renderFaqModal(data) {
    var bg = getFaqModal();
    if (!bg) return;
    bg.querySelector('.nfa-modal-title').textContent =
      faqModalMode === 'create' ? 'FAQ 등록' : 'FAQ 수정';
    bg.querySelector('#nfaFaqQ').value = data.q || '';
    // R2: safe HTML→text via detached DOM (regex tag-stripper bypass-prone)
    var tmp = document.createElement('div');
    tmp.innerHTML = data.a || '';
    bg.querySelector('#nfaFaqA').value = tmp.textContent || '';
    bg.querySelector('#nfaFaqCategory').innerHTML = categoryOptions(data.category);
    bg.querySelector('#nfaFaqVisible').checked = data.visible !== false;
    bg.classList.add('open');
    bg.querySelector('#nfaFaqQ').focus();
  }

  function closeFaqModal() {
    var bg = getFaqModal();
    if (bg) bg.classList.remove('open');
  }

  function saveFaqModal() {
    var q = document.getElementById('nfaFaqQ').value.trim();
    var a = document.getElementById('nfaFaqA').value.trim();
    var category = document.getElementById('nfaFaqCategory').value;
    var visible = document.getElementById('nfaFaqVisible').checked;
    if (!q) {
      toast('질문을 입력하세요.', 'warn');
      return;
    }
    if (!a) {
      toast('답변을 입력하세요.', 'warn');
      return;
    }
    if (faqModalMode === 'create') {
      window.FAQS = window.FAQS || [];
      window.FAQS.unshift({
        id: nextFaqId(),
        category: category,
        q: q,
        a: '<p>' + esc(a) + '</p>',
        visible: visible,
      });
      toast('FAQ가 등록되었습니다.', 'ok');
    } else {
      var f = (window.FAQS || []).find(function (x) {
        return x.id === faqEditingId;
      });
      if (f) {
        f.q = q;
        f.a = '<p>' + esc(a) + '</p>';
        f.category = category;
        f.visible = visible;
      }
      toast('FAQ가 수정되었습니다.', 'ok');
    }
    closeFaqModal();
    if (typeof window.renderFaq === 'function') window.renderFaq();
  }

  // ── Category Modal
  function getCatModal() {
    return document.getElementById('nfaCatModal');
  }

  function openCreateCategoryModal() {
    catModalMode = 'create';
    catEditingId = null;
    renderCatModal({ name: '', order: (window.FAQ_CATEGORIES || []).length + 1, visible: true });
  }

  function openEditCategoryModal(id) {
    var c = (window.FAQ_CATEGORIES || []).find(function (x) {
      return x.id === id;
    });
    if (!c) return;
    catModalMode = 'edit';
    catEditingId = id;
    renderCatModal(c);
  }

  function renderCatModal(data) {
    var bg = getCatModal();
    if (!bg) return;
    bg.querySelector('.nfa-modal-title').textContent =
      catModalMode === 'create' ? '카테고리 추가' : '카테고리 편집';
    bg.querySelector('#nfaCatName').value = data.name || '';
    bg.querySelector('#nfaCatOrder').value = data.order || 1;
    bg.querySelector('#nfaCatVisible').checked = data.visible !== false;
    bg.classList.add('open');
    bg.querySelector('#nfaCatName').focus();
  }

  function closeCatModal() {
    var bg = getCatModal();
    if (bg) bg.classList.remove('open');
  }

  function saveCatModal() {
    var name = document.getElementById('nfaCatName').value.trim();
    var order = parseInt(document.getElementById('nfaCatOrder').value, 10) || 1;
    var visible = document.getElementById('nfaCatVisible').checked;
    if (!name) {
      toast('카테고리 이름을 입력하세요.', 'warn');
      return;
    }
    if (catModalMode === 'create') {
      window.FAQ_CATEGORIES = window.FAQ_CATEGORIES || [];
      window.FAQ_CATEGORIES.push({ id: nextCatId(), name: name, order: order, visible: visible });
      toast('카테고리가 추가되었습니다.', 'ok');
    } else {
      var c = (window.FAQ_CATEGORIES || []).find(function (x) {
        return x.id === catEditingId;
      });
      if (c) {
        c.name = name;
        c.order = order;
        c.visible = visible;
      }
      toast('카테고리가 수정되었습니다.', 'ok');
    }
    closeCatModal();
    if (typeof window.renderFaq === 'function') window.renderFaq();
  }

  // ── Build modal DOMs once (called from init)
  function buildModalDoms() {
    if (!document.getElementById('nfaFaqModal')) {
      var faqBg = document.createElement('div');
      faqBg.className = 'nfa-modal-bg';
      faqBg.id = 'nfaFaqModal';
      faqBg.innerHTML =
        '<div class="nfa-modal" role="dialog" aria-modal="true">' +
        '<div class="nfa-modal-header"><span class="nfa-modal-title">FAQ 등록</span>' +
        '<button type="button" class="nfa-modal-close" id="nfaFaqClose">✕</button></div>' +
        '<div class="nfa-modal-body">' +
        '<div class="nfa-field"><label>질문</label><input type="text" id="nfaFaqQ" placeholder="질문 내용"></div>' +
        '<div class="nfa-field"><label>답변 (Toast UI Editor 자리표시자)</label>' +
        '<textarea id="nfaFaqA" class="tall" placeholder="답변 내용"></textarea></div>' +
        '<div class="nfa-field"><label>카테고리</label><select id="nfaFaqCategory"></select></div>' +
        '<label class="nfa-checkbox-row"><input type="checkbox" id="nfaFaqVisible"> 노출 여부 ON</label>' +
        '</div>' +
        '<div class="nfa-modal-footer">' +
        '<button type="button" class="btn-form-cancel" id="nfaFaqCancelBtn">취소</button>' +
        '<button type="button" class="btn-form-save" id="nfaFaqSaveBtn">저장</button>' +
        '</div></div>';
      document.body.appendChild(faqBg);
      faqBg.addEventListener('click', function (e) {
        if (e.target === faqBg) closeFaqModal();
      });
      document.getElementById('nfaFaqClose').addEventListener('click', closeFaqModal);
      document.getElementById('nfaFaqCancelBtn').addEventListener('click', closeFaqModal);
      document.getElementById('nfaFaqSaveBtn').addEventListener('click', saveFaqModal);
    }

    if (!document.getElementById('nfaCatModal')) {
      var catBg = document.createElement('div');
      catBg.className = 'nfa-modal-bg';
      catBg.id = 'nfaCatModal';
      catBg.innerHTML =
        '<div class="nfa-modal" role="dialog" aria-modal="true">' +
        '<div class="nfa-modal-header"><span class="nfa-modal-title">카테고리 추가</span>' +
        '<button type="button" class="nfa-modal-close" id="nfaCatClose">✕</button></div>' +
        '<div class="nfa-modal-body">' +
        '<div class="nfa-field"><label>이름</label><input type="text" id="nfaCatName" placeholder="카테고리 이름"></div>' +
        '<div class="nfa-field"><label>순서</label><input type="number" id="nfaCatOrder" min="1" value="1"></div>' +
        '<label class="nfa-checkbox-row"><input type="checkbox" id="nfaCatVisible"> 표시 여부 ON</label>' +
        '</div>' +
        '<div class="nfa-modal-footer">' +
        '<button type="button" class="btn-form-cancel" id="nfaCatCancelBtn">취소</button>' +
        '<button type="button" class="btn-form-save" id="nfaCatSaveBtn">저장</button>' +
        '</div></div>';
      document.body.appendChild(catBg);
      catBg.addEventListener('click', function (e) {
        if (e.target === catBg) closeCatModal();
      });
      document.getElementById('nfaCatClose').addEventListener('click', closeCatModal);
      document.getElementById('nfaCatCancelBtn').addEventListener('click', closeCatModal);
      document.getElementById('nfaCatSaveBtn').addEventListener('click', saveCatModal);
    }
  }

  function _onEscClose(e) {
    if (e.key !== 'Escape') return;
    var open = document.querySelector('.nfa-modal-bg.open');
    if (open) open.classList.remove('open');
  }

  function init() {
    document.addEventListener('keydown', _onEscClose);
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', buildModalDoms);
    } else {
      buildModalDoms();
    }
  }

  window.FaqAdminModals = {
    init: init,
    openCreateFaqModal: openCreateFaqModal,
    openEditFaqModal: openEditFaqModal,
    openCreateCategoryModal: openCreateCategoryModal,
    openEditCategoryModal: openEditCategoryModal,
  };
})();
