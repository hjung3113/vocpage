// drawer-comments.js — B-13 comment edit/delete features
// Depends on: dom-utils.js (escHtml, showToast)
// Called by drawer-advanced.js
// R2: currentUserId fail-closed; ownership re-check at action time;
//     inline styles → classes; edit save refreshes count; undo re-resolves by id.

(function () {
  'use strict';

  function currentUserId() {
    // R2: fail closed — no fallback admin id (security review).
    return (
      (typeof window.currentUser === 'object' && window.currentUser && window.currentUser.id) ||
      null
    );
  }

  function isOwner(comment) {
    var uid = currentUserId();
    return !!uid && comment && comment.author_id === uid;
  }

  function findComment(voc, cid) {
    return (voc && voc.comments ? voc.comments : []).find(function (c) {
      return c.id === cid;
    });
  }

  function renderComments(voc) {
    const drawer = document.getElementById('drawer');
    if (!drawer || !voc) return;
    const listEl = drawer.querySelector('#comment-list-' + voc.id);
    const countEl = drawer.querySelector('#comment-count-' + voc.id);
    const comments = voc.comments || [];
    if (!listEl) return;

    const active = comments.filter((c) => !c._deleted);

    if (countEl) countEl.textContent = `댓글 ${active.length}개`;

    listEl.innerHTML = active
      .map((c) => {
        const own = isOwner(c);
        return `<div class="comment-card" data-comment-id="${escHtml(c.id)}">
          <div class="comment-header">
            <div class="mini-av">${escHtml(c.author.charAt(0))}</div>
            <span class="c-author">${escHtml(c.author)}</span>
            <span class="c-date">${escHtml(c.date)}</span>
            ${
              own
                ? `<div class="comment-action-wrap">
              <button class="comment-menu-btn" aria-label="댓글 메뉴" title="댓글 메뉴">···</button>
              <div class="comment-action-menu">
                <button class="edit-comment-btn">편집</button>
                <button class="delete-comment-btn danger">삭제</button>
              </div>
            </div>`
                : ''
            }
          </div>
          <div class="c-body">${escHtml(c.body)}</div>
        </div>`;
      })
      .join('');

    // R2: per-card outsideHandler closure (was: shared module var = leak risk)
    listEl.querySelectorAll('[data-comment-id]').forEach((card) => {
      const cid = card.dataset.commentId;

      const menuBtn = card.querySelector('.comment-menu-btn');
      const menu = card.querySelector('.comment-action-menu');
      if (menuBtn && menu) {
        let outsideHandler = null;
        menuBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          drawer.querySelectorAll('.comment-action-menu.open').forEach((m) => {
            if (m !== menu) m.classList.remove('open');
          });
          menu.classList.toggle('open');

          if (outsideHandler) document.removeEventListener('click', outsideHandler);
          outsideHandler = function () {
            menu.classList.remove('open');
            document.removeEventListener('click', outsideHandler);
            outsideHandler = null;
          };
          setTimeout(() => document.addEventListener('click', outsideHandler), 0);
        });

        card.querySelector('.edit-comment-btn')?.addEventListener('click', function () {
          menu.classList.remove('open');
          // R2: re-resolve + ownership re-check at action time
          var c = findComment(voc, cid);
          if (!c || !isOwner(c)) {
            window.showToast('편집 권한이 없습니다.', 'warn');
            return;
          }
          startEditComment(card, c, voc);
        });

        card.querySelector('.delete-comment-btn')?.addEventListener('click', function () {
          menu.classList.remove('open');
          var c = findComment(voc, cid);
          if (!c || !isOwner(c)) {
            window.showToast('삭제 권한이 없습니다.', 'warn');
            return;
          }
          softDeleteComment(c, voc);
        });
      }
    });
  }

  function startEditComment(card, comment, voc) {
    const bodyEl = card.querySelector('.c-body');
    if (!bodyEl) return;
    const original = comment.body;

    const editDiv = document.createElement('div');
    editDiv.className = 'comment-edit-mode';
    editDiv.innerHTML = `
      <textarea class="comment-edit-textarea">${escHtml(original)}</textarea>
      <div class="comment-edit-actions">
        <button class="comment-edit-cancel">취소</button>
        <button class="comment-edit-save">저장</button>
      </div>`;

    bodyEl.replaceWith(editDiv);
    const ta = editDiv.querySelector('textarea');
    ta.focus();
    ta.setSelectionRange(ta.value.length, ta.value.length);

    editDiv.querySelector('.comment-edit-cancel').addEventListener('click', function () {
      const restored = document.createElement('div');
      restored.className = 'c-body';
      restored.textContent = original;
      editDiv.replaceWith(restored);
    });

    editDiv.querySelector('.comment-edit-save').addEventListener('click', function () {
      const newText = ta.value.trim();
      if (!newText) {
        window.showToast('내용을 입력하세요.', 'warn');
        return;
      }
      comment.body = newText;
      window.showToast('댓글이 수정되었습니다.', 'ok');
      // R2: full re-render so derived state (count, ordering, etc.) refreshes
      renderComments(voc);
    });
  }

  function softDeleteComment(comment, voc) {
    var cid = comment.id;
    comment._deleted = true;
    renderComments(voc);

    let undone = false;
    let host = document.getElementById('reviewToastHost');
    if (!host) {
      host = document.createElement('div');
      host.id = 'reviewToastHost';
      host.className = 'review-toast-host';
      host.setAttribute('role', 'status');
      host.setAttribute('aria-live', 'polite');
      document.body.appendChild(host);
    }
    const undoToast = document.createElement('div');
    undoToast.className = 'review-toast review-toast-ok cmt-undo';
    undoToast.innerHTML =
      '<span>댓글이 삭제되었습니다.</span><button class="cmt-undo-btn">실행취소</button>';
    host.appendChild(undoToast);

    undoToast.querySelector('button').addEventListener('click', function () {
      undone = true;
      // R2: re-resolve by id (the comment reference may be stale if voc.comments
      // was reassigned by another path)
      var fresh = findComment(voc, cid);
      if (fresh) fresh._deleted = false;
      renderComments(voc);
      undoToast.remove();
      window.showToast('삭제가 취소되었습니다.', 'ok');
    });

    setTimeout(() => {
      if (!undone) undoToast.classList.add('out');
    }, 4800);
    setTimeout(() => {
      if (!undone) undoToast.remove();
    }, 5200);
  }

  window.DrawerComments = { renderComments, startEditComment, softDeleteComment };
})();
