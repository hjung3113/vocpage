// drawer-advanced.js — B-13 VOC drawer advanced features
// Exposes window.DrawerAdvanced API.
// Depends on: dom-utils.js (escHtml, showToast), drawer-comments.js (DrawerComments)

(function () {
  'use strict';

  const FINISH_STATUSES = ['완료', '드랍'];
  const RS_LABELS = {
    unverified: '검토전',
    approved: '승인',
    rejected: '반려',
    pending_deletion: '삭제대기',
  };

  let _escHandler = null;

  // ── helpers ───────────────────────────────────────────────────
  function getVoc(id) {
    if (typeof VOC_MAP !== 'undefined' && VOC_MAP[id]) return VOC_MAP[id];
    if (typeof VOCDATA !== 'undefined') return VOCDATA.find((v) => v.id === id) || null;
    return null;
  }

  // ── Feature 1: status lock ────────────────────────────────────
  function applyStatusLock(voc) {
    if (!voc || voc.review_status !== 'approved') return;
    const drawer = document.getElementById('drawer');
    if (!drawer) return;
    const statusSel = drawer.querySelectorAll('.meta-sel')[0];
    if (!statusSel) return;
    statusSel.disabled = true;
    statusSel.title = '결과 검토가 승인되어 상태 변경이 잠겨 있습니다.';
  }

  function isStatusLocked(vocId) {
    const voc = getVoc(vocId);
    return !!(voc && voc.review_status === 'approved');
  }

  // ── Feature 2: sub-task warning ───────────────────────────────
  function attachSubtaskWarning(voc) {
    if (!voc) return;
    const drawer = document.getElementById('drawer');
    if (!drawer) return;
    const statusSel = drawer.querySelectorAll('.meta-sel')[0];
    if (!statusSel || statusSel.disabled) return;

    statusSel.addEventListener('change', function (e) {
      const nextStatus = e.target.value;
      if (!FINISH_STATUSES.includes(nextStatus)) return;
      const undone = (voc.subTasks || []).filter((t) => !t.done).length;
      if (undone >= 1) {
        const ok = window.confirm(`미완 sub-task ${undone}건이 있습니다. 그래도 변경할까요?`);
        if (!ok) e.target.value = voc.status;
      }
    });
  }

  function warnUnfinishedSubtasks(vocId, nextStatus) {
    if (!FINISH_STATUSES.includes(nextStatus)) return true;
    const voc = getVoc(vocId);
    if (!voc) return true;
    const undone = (voc.subTasks || []).filter((t) => !t.done).length;
    if (undone >= 1)
      return window.confirm(`미완 sub-task ${undone}건이 있습니다. 그래도 변경할까요?`);
    return true;
  }

  // ── Feature 3: permalink ──────────────────────────────────────
  function copyPermalink(vocId) {
    const url =
      window.location.origin + window.location.pathname + '#voc/' + encodeURIComponent(vocId);

    function onSuccess() {
      window.showToast('링크가 복사되었습니다.', 'ok');
    }
    function onFallback() {
      try {
        const ta = document.createElement('textarea');
        ta.value = url;
        ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        onSuccess();
      } catch (_) {
        window.showToast('링크 복사에 실패했습니다.', 'error');
      }
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(onSuccess, onFallback);
    } else {
      onFallback();
    }
  }

  function injectPermalinkButton(vocId) {
    const expandBtn = document.getElementById('expandBtn');
    if (!expandBtn) return;
    expandBtn.parentNode.querySelectorAll('.perma-btn').forEach((b) => b.remove());

    const btn = document.createElement('button');
    btn.className = 'perma-btn icon-btn';
    btn.setAttribute('data-tip', '링크 복사');
    btn.setAttribute('aria-label', '퍼머링크 복사');
    btn.innerHTML = '<i data-lucide="link-2" style="width:14px;height:14px"></i>';
    btn.addEventListener('click', function () {
      copyPermalink(vocId);
    });
    expandBtn.parentNode.insertBefore(btn, expandBtn);
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  // ── Feature 4: fullscreen esc ─────────────────────────────────
  function attachFullscreenEsc() {
    if (_escHandler) document.removeEventListener('keydown', _escHandler);
    _escHandler = function (e) {
      if (e.key !== 'Escape') return;
      const drawer = document.getElementById('drawer');
      if (!drawer || !drawer.classList.contains('fullscreen')) return;
      drawer.classList.remove('fullscreen');
      const btn = document.getElementById('expandBtn');
      if (btn) {
        btn.dataset.tip = '큰 화면으로 보기';
        btn.innerHTML = '<i data-lucide="maximize-2"></i>';
        btn.setAttribute('aria-pressed', 'false');
        btn.classList.remove('fullscreen-btn');
        if (typeof lucide !== 'undefined') lucide.createIcons();
        btn.focus();
      }
    };
    document.addEventListener('keydown', _escHandler);

    const btn = document.getElementById('expandBtn');
    if (btn && !btn._advPatched) {
      btn._advPatched = true;
      btn.addEventListener('click', function () {
        const isFs = document.getElementById('drawer')?.classList.contains('fullscreen');
        btn.setAttribute('aria-pressed', isFs ? 'true' : 'false');
        btn.classList.toggle('fullscreen-btn', !!isFs);
      });
    }
  }

  function toggleFullscreen(drawerEl) {
    const d = drawerEl || document.getElementById('drawer');
    if (!d) return;
    d.classList.toggle('fullscreen');
    const btn = document.getElementById('expandBtn');
    if (btn) {
      const isFs = d.classList.contains('fullscreen');
      btn.setAttribute('aria-pressed', isFs ? 'true' : 'false');
      btn.classList.toggle('fullscreen-btn', isFs);
    }
  }

  // ── Feature 6: review_status pill ────────────────────────────
  function renderReviewStatusPill(metaEl, voc) {
    if (!voc || !voc.review_status) return;
    const drawer = document.getElementById('drawer');
    if (!drawer) return;
    drawer.querySelectorAll('.rs-pill').forEach((p) => p.remove());

    const label = RS_LABELS[voc.review_status];
    if (!label) return;
    const pill = document.createElement('span');
    pill.className = `rs-pill rs-${escHtml(voc.review_status)}`;
    pill.textContent = label;

    const statusItem = (metaEl || drawer).querySelector('.meta-item');
    if (!statusItem) return;
    const ref = statusItem.querySelector('.meta-sel') || statusItem.querySelector('.meta-val');
    if (ref) ref.parentNode.insertBefore(pill, ref.nextSibling);
  }

  // ── attachToDrawer: wires all features ────────────────────────
  function attachToDrawer(drawerEl, vocId) {
    const voc = getVoc(vocId);
    const meta = drawerEl ? drawerEl.querySelector('.d-meta') : null;

    renderReviewStatusPill(meta, voc);
    applyStatusLock(voc);
    attachSubtaskWarning(voc);
    injectPermalinkButton(vocId);
    attachFullscreenEsc();
    if (voc && window.DrawerComments) window.DrawerComments.renderComments(voc);
  }

  // ── init ──────────────────────────────────────────────────────
  function init() {
    document.addEventListener('drawer:opened', function (e) {
      const { vocId } = e.detail || {};
      if (!vocId) return;
      setTimeout(() => attachToDrawer(document.getElementById('drawer'), vocId), 30);
    });
  }

  window.DrawerAdvanced = {
    init,
    attachToDrawer,
    copyPermalink,
    toggleFullscreen,
    warnUnfinishedSubtasks,
    isStatusLocked,
    renderReviewStatusPill,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
