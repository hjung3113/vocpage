// ── B-4b Notice Admin UI — notice-admin.js
// Additive module — DO NOT modify notice-faq.js or admin-mode.js.
// Injects admin panel into #noticeAdminBody via MutationObserver.
// Depends on: dom-utils.js (escHtml, showToast), data.js (NOTICES),
//             admin-mode.js (AdminMode), notice-faq.js (renderNotices)
// Export: window.NoticeAdmin

(function () {
  'use strict';

  var esc = function (s) {
    return window.escHtml ? window.escHtml(s) : String(s == null ? '' : s);
  };
  var toast = function (m, k) {
    if (window.showToast) window.showToast(m, k);
  };
  var rerender = function () {
    if (typeof window.renderNotices === 'function') window.renderNotices();
  };

  var modalMode = 'create';
  var editingId = null;

  function currentRole() {
    return (window.currentUser && window.currentUser.role) || 'user';
  }
  function isAdmin() {
    return currentRole() === 'admin';
  }
  function isAdminMode() {
    return (
      window.AdminMode && window.AdminMode.isAdminMode() && window.AdminMode.canEnterAdminMode()
    );
  }
  function nextId() {
    var ids = (window.NOTICES || []).map(function (n) {
      return n.id;
    });
    return ids.length ? Math.max.apply(null, ids) + 1 : 1;
  }
  function levelOptions(sel) {
    return ['urgent', 'important', 'normal']
      .map(function (v) {
        var L = { urgent: '긴급', important: '중요', normal: '일반' };
        return (
          '<option value="' + v + '"' + (v === sel ? ' selected' : '') + '>' + L[v] + '</option>'
        );
      })
      .join('');
  }

  function injectRowActions(bodyEl) {
    bodyEl.querySelectorAll('.notice-item').forEach(function (item) {
      if (item.getAttribute('data-nfa-injected')) return;
      item.setAttribute('data-nfa-injected', '1');
      var row = item.querySelector('.notice-row');
      if (!row) return;
      var match = (row.getAttribute('onclick') || '').match(/toggleNotice\((\d+)\)/);
      if (!match) return;
      var id = parseInt(match[1], 10);
      var notice = (window.NOTICES || []).find(function (n) {
        return n.id === id;
      });
      if (!notice) return;
      var existing = row.querySelector('.nfa-row-actions');
      if (existing) existing.remove();
      var div = document.createElement('div');
      div.className = 'nfa-row-actions';
      div.innerHTML =
        '<label class="toggle-switch nfa-visible-toggle" data-action="toggle" data-id="' +
        id +
        '" title="노출 여부">' +
        '<input type="checkbox" aria-label="노출 여부 토글"' +
        (notice.visible ? ' checked' : '') +
        '>' +
        '<span class="toggle-slider"></span>' +
        '</label>' +
        '<span class="nfa-visible-label ' +
        (notice.visible ? 'on' : 'off') +
        '">' +
        (notice.visible ? '노출' : '비노출') +
        '</span>' +
        '<button type="button" class="nfa-action-btn" data-action="edit" data-id="' +
        id +
        '">편집</button>' +
        '<button type="button" class="nfa-action-btn danger" data-action="delete" data-id="' +
        id +
        '">삭제</button>';
      div.addEventListener('click', function (e) {
        e.stopPropagation();
        var trg = e.target.closest('[data-action]');
        if (!trg) return;
        var action = trg.getAttribute('data-action');
        var nid = parseInt(trg.getAttribute('data-id'), 10);
        if (action === 'edit') openEditModal(nid);
        else if (action === 'delete') softDelete(nid);
        else if (action === 'toggle') {
          // label 클릭은 브라우저 기본 동작으로 input 상태가 토글되므로,
          // 두 번 토글되지 않도록 input 클릭 시에는 핸들러 스킵.
          if (e.target.tagName === 'INPUT') return;
          toggleVisibility(nid);
        }
      });
      // input 직접 클릭(또는 키보드 Space)은 change 이벤트로 처리
      var chk = div.querySelector('.nfa-visible-toggle input');
      if (chk)
        chk.addEventListener('change', function (e) {
          e.stopPropagation();
          toggleVisibility(id);
        });
      row.appendChild(div);
    });
  }

  function renderAdminPanel(bodyEl) {
    if (!bodyEl) return;
    var oldBar = bodyEl.querySelector('.nfa-admin-bar');
    if (oldBar) oldBar.remove();
    var bar = document.createElement('div');
    bar.className = 'nfa-admin-bar';
    bar.innerHTML =
      '<button type="button" class="nfa-btn-add" id="noticeAddBtn">+ 공지 등록</button>';
    bodyEl.insertBefore(bar, bodyEl.firstChild);
    var addBtn = bodyEl.querySelector('#noticeAddBtn');
    if (addBtn) addBtn.addEventListener('click', openCreateModal);
    injectRowActions(bodyEl);

    var oldDel = bodyEl.querySelector('.nfa-deleted-section');
    if (oldDel) oldDel.remove();
    if (!isAdmin()) return;

    var deleted = (window.NOTICES || []).filter(function (n) {
      return n._deleted;
    });
    var section = document.createElement('div');
    section.className = 'nfa-deleted-section';
    section.innerHTML =
      '<div class="nfa-deleted-header" id="noticeDeletedHdr"><i data-lucide="chevron-down"></i>' +
      '<span>삭제됨 (Admin only) — ' +
      deleted.length +
      '건</span></div>' +
      '<div class="nfa-deleted-body" id="noticeDeletedBody">' +
      deleted
        .map(function (n) {
          return (
            '<div class="nfa-deleted-item"><span class="title">' +
            esc(n.title) +
            '</span>' +
            '<button type="button" class="nfa-restore-btn" data-restore="' +
            n.id +
            '">복원</button></div>'
          );
        })
        .join('') +
      '</div>';
    bodyEl.appendChild(section);
    var hdr = section.querySelector('#noticeDeletedHdr');
    var delBody = section.querySelector('#noticeDeletedBody');
    hdr.addEventListener('click', function () {
      var open = delBody.classList.toggle('open');
      hdr.classList.toggle('open', open);
    });
    section.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-restore]');
      if (btn) restore(parseInt(btn.getAttribute('data-restore'), 10));
    });
    if (window.lucide) {
      try {
        lucide.createIcons({ nodes: [section] });
      } catch (_) {}
    }
  }

  function toggleVisibility(id) {
    if (!isAdminMode()) {
      toast('관리 모드가 아닙니다.', 'warn');
      return;
    }
    var n = (window.NOTICES || []).find(function (x) {
      return x.id === id;
    });
    if (!n) return;
    n.visible = !n.visible;
    toast(n.visible ? '공지 노출 ON' : '공지 노출 OFF', 'ok');
    rerender();
  }

  function softDelete(id) {
    if (!isAdminMode()) {
      toast('관리 모드가 아닙니다.', 'warn');
      return;
    }
    var n = (window.NOTICES || []).find(function (x) {
      return x.id === id;
    });
    if (!n) return;
    n._deleted = true;
    n.visible = false;
    toast('공지가 삭제되었습니다 (soft delete)', 'ok');
    rerender();
  }

  function restore(id) {
    if (!isAdmin()) {
      toast('복원 권한이 없습니다.', 'warn');
      return;
    }
    var n = (window.NOTICES || []).find(function (x) {
      return x.id === id;
    });
    if (!n) return;
    n._deleted = false;
    n.visible = true;
    toast('공지가 복원되었습니다.', 'ok');
    rerender();
  }

  function getDeleted() {
    return (window.NOTICES || []).filter(function (n) {
      return n._deleted;
    });
  }

  function getModal() {
    return document.getElementById('nfaNoticeModal');
  }

  function openCreateModal() {
    modalMode = 'create';
    editingId = null;
    var today = new Date().toISOString().slice(0, 10);
    renderModal({ title: '', content: '', level: 'normal', from: today, to: today, visible: true });
  }

  function openEditModal(id) {
    var n = (window.NOTICES || []).find(function (x) {
      return x.id === id;
    });
    if (!n) return;
    modalMode = 'edit';
    editingId = id;
    renderModal(n);
  }

  function renderModal(data) {
    var bg = getModal();
    if (!bg) return;
    bg.querySelector('.nfa-modal-title').textContent =
      modalMode === 'create' ? '공지 등록' : '공지 수정';
    bg.querySelector('#nfaNoticeTitle').value = data.title || '';
    // R2: safe HTML→text via detached DOM (regex tag-stripper bypass-prone)
    var tmp = document.createElement('div');
    tmp.innerHTML = data.content || '';
    bg.querySelector('#nfaNoticeContent').value = tmp.textContent || '';
    bg.querySelector('#nfaNoticeLevel').innerHTML = levelOptions(data.level || 'normal');
    bg.querySelector('#nfaNoticeFrom').value = data.from || '';
    bg.querySelector('#nfaNoticeTo').value = data.to || '';
    bg.querySelector('#nfaNoticeVisible').checked = data.visible !== false;
    bg.classList.add('open');
    bg.querySelector('#nfaNoticeTitle').focus();
  }

  function closeModal() {
    var bg = getModal();
    if (bg) bg.classList.remove('open');
  }

  function saveModal() {
    var title = document.getElementById('nfaNoticeTitle').value.trim();
    var content = document.getElementById('nfaNoticeContent').value.trim();
    var level = document.getElementById('nfaNoticeLevel').value;
    var from = document.getElementById('nfaNoticeFrom').value;
    var to = document.getElementById('nfaNoticeTo').value;
    var visible = document.getElementById('nfaNoticeVisible').checked;
    if (!title) {
      toast('제목을 입력하세요.', 'warn');
      return;
    }
    if (!from || !to) {
      toast('노출 기간을 입력하세요.', 'warn');
      return;
    }
    if (modalMode === 'create') {
      window.NOTICES = window.NOTICES || [];
      window.NOTICES.unshift({
        id: nextId(),
        title: title,
        content: '<p>' + esc(content) + '</p>',
        level: level,
        from: from,
        to: to,
        visible: visible,
        popup: false,
      });
      toast('공지가 등록되었습니다.', 'ok');
    } else {
      var n = (window.NOTICES || []).find(function (x) {
        return x.id === editingId;
      });
      if (n) {
        n.title = title;
        n.content = '<p>' + esc(content) + '</p>';
        n.level = level;
        n.from = from;
        n.to = to;
        n.visible = visible;
      }
      toast('공지가 수정되었습니다.', 'ok');
    }
    closeModal();
    rerender();
  }

  function buildModalDom() {
    if (document.getElementById('nfaNoticeModal')) return;
    var bg = document.createElement('div');
    bg.className = 'nfa-modal-bg';
    bg.id = 'nfaNoticeModal';
    bg.innerHTML =
      '<div class="nfa-modal" role="dialog" aria-modal="true">' +
      '<div class="nfa-modal-header"><span class="nfa-modal-title">공지 등록</span>' +
      '<button type="button" class="nfa-modal-close" id="nfaNoticeClose">✕</button></div>' +
      '<div class="nfa-modal-body">' +
      '<div class="nfa-field"><label>제목</label><input type="text" id="nfaNoticeTitle" placeholder="공지 제목"></div>' +
      '<div class="nfa-field"><label>내용</label><textarea id="nfaNoticeContent" placeholder="내용 (텍스트 입력)"></textarea></div>' +
      '<div class="nfa-field"><label>중요도</label><select id="nfaNoticeLevel"></select></div>' +
      '<div class="nfa-field-row">' +
      '<div class="nfa-field"><label>노출 시작</label><input type="date" id="nfaNoticeFrom"></div>' +
      '<div class="nfa-field"><label>노출 종료</label><input type="date" id="nfaNoticeTo"></div>' +
      '</div>' +
      '<label class="nfa-checkbox-row"><input type="checkbox" id="nfaNoticeVisible"> 노출 여부 ON</label>' +
      '</div>' +
      '<div class="nfa-modal-footer">' +
      '<button type="button" class="btn-form-cancel" id="nfaNoticeCancelBtn">취소</button>' +
      '<button type="button" class="btn-form-save" id="nfaNoticeSaveBtn">저장</button>' +
      '</div></div>';
    document.body.appendChild(bg);
    bg.addEventListener('click', function (e) {
      if (e.target === bg) closeModal();
    });
    document.getElementById('nfaNoticeClose').addEventListener('click', closeModal);
    document.getElementById('nfaNoticeCancelBtn').addEventListener('click', closeModal);
    document.getElementById('nfaNoticeSaveBtn').addEventListener('click', saveModal);
  }

  var observer = null;

  function attachObserver() {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    if (!isAdminMode()) return;
    var body = document.getElementById('noticeAdminBody');
    if (body) renderAdminPanel(body);
    observer = new MutationObserver(function () {
      if (!isAdminMode()) {
        observer.disconnect();
        observer = null;
        return;
      }
      var b = document.getElementById('noticeAdminBody');
      if (b) renderAdminPanel(b);
    });
    var page = document.getElementById('page-notices');
    if (page) observer.observe(page, { childList: true, subtree: false });
  }

  function onAdminModeChange() {
    if (!isAdminMode()) {
      if (observer) {
        observer.disconnect();
        observer = null;
      }
      return;
    }
    attachObserver();
  }

  function _onEscClose(e) {
    if (e.key !== 'Escape') return;
    var open = document.querySelector('.nfa-modal-bg.open');
    if (open) open.classList.remove('open');
  }

  function init() {
    buildModalDom();
    document.addEventListener('admin-mode:change', onAdminModeChange);
    document.addEventListener('role:change', onAdminModeChange);
    document.addEventListener('keydown', _onEscClose);
    // R2: removed setTimeout kludge — admin-mode.init() dispatches its own
    // initial event (admin-mode.js setTimeout(0) at end of init).
  }

  window.NoticeAdmin = {
    init: init,
    renderAdminPanel: renderAdminPanel,
    openCreateModal: openCreateModal,
    openEditModal: openEditModal,
    toggleVisibility: toggleVisibility,
    softDelete: softDelete,
    restore: restore,
    getDeleted: getDeleted,
  };
})();
