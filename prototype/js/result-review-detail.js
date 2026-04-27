// Result Review Detail Drawer — Stage B-1 P-1.C1 extension
// Opens a full-detail overlay when a review queue card is clicked.
// Depends on: result-review.js, diff-helpers.js (computePayloadDiff, valueToText)

(function () {
  'use strict';

  const esc = (s) =>
    String(s == null ? '' : s).replace(
      /[&<>"']/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
    );

  let _priorFocus = null;
  let _escHandler = null;

  // ── Public: open ─────────────────────────────────────────────────────────────
  window.openReviewDetail = function openReviewDetail(id) {
    const overlay = document.getElementById('rvDetailOverlay');
    if (overlay && overlay.classList.contains('open')) return; // J: idempotent

    const item = (window.reviewQueue || []).find((r) => r.id === id);
    if (!item) return;
    _priorFocus = document.activeElement;

    let el = overlay;
    if (!el) {
      el = document.createElement('div');
      el.id = 'rvDetailOverlay';
      el.className = 'rv-detail-overlay';
      el.setAttribute('role', 'dialog');
      el.setAttribute('aria-modal', 'true');
      el.setAttribute('aria-labelledby', 'rvDetailTitle');
      document.body.appendChild(el);
      el.addEventListener('click', function (e) {
        if (e.target === el) closeReviewDetail();
      });
    }

    el.innerHTML = renderReviewDetail(item);

    // C: event delegation on .rv-actions — no inline onclick for approve/reject
    const actionsEl = el.querySelector('.rv-actions');
    if (actionsEl) {
      actionsEl.addEventListener('click', function (e) {
        const btn = e.target.closest('button[data-action]');
        if (!btn) return;
        submitReviewDecision(btn.dataset.id, btn.dataset.action);
      });
    }

    el.classList.add('open');
    if (window.lucide) lucide.createIcons({ nodes: [el] });

    const first = _focusableElements(el)[0];
    if (first) first.focus();

    // J: remove stale esc handler before binding new one
    if (_escHandler) document.removeEventListener('keydown', _escHandler);
    _escHandler = function (e) {
      if (e.key === 'Escape') closeReviewDetail();
    };
    document.addEventListener('keydown', _escHandler);
    el.addEventListener('keydown', _trapFocus);
  };

  // ── Public: close ─────────────────────────────────────────────────────────────
  window.closeReviewDetail = function closeReviewDetail() {
    const overlay = document.getElementById('rvDetailOverlay');
    if (!overlay) return;
    overlay.classList.remove('open');
    overlay.removeEventListener('keydown', _trapFocus);
    if (_escHandler) {
      document.removeEventListener('keydown', _escHandler);
      _escHandler = null;
    }
    if (_priorFocus && typeof _priorFocus.focus === 'function') {
      _priorFocus.focus();
      _priorFocus = null;
    }
  };

  // ── Focus trap ────────────────────────────────────────────────────────────────
  function _focusableElements(c) {
    return Array.from(
      c.querySelectorAll(
        'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])',
      ),
    );
  }

  function _trapFocus(e) {
    if (e.key !== 'Tab') return;
    const overlay = document.getElementById('rvDetailOverlay');
    if (!overlay) return;
    const els = _focusableElements(overlay);
    if (!els.length) return;
    if (e.shiftKey) {
      if (document.activeElement === els[0]) {
        e.preventDefault();
        els[els.length - 1].focus();
      }
    } else {
      if (document.activeElement === els[els.length - 1]) {
        e.preventDefault();
        els[0].focus();
      }
    }
  }

  // ── Render helpers ────────────────────────────────────────────────────────────
  function renderMetaHeader(item) {
    const actionLabel = item.action === 'deletion' ? '삭제 신청' : '제출 검토';
    const reviewPill = item.reviewStatusLabel
      ? `<span class="status-pill status-pending">${esc(item.reviewStatusLabel)}</span>`
      : '';
    return `
      <div class="rv-meta-grid">
        <span class="rv-meta-label">이슈 ID</span><span class="rv-meta-value rv-id-mono">${esc(item.id)}</span>
        <span class="rv-meta-label">제목</span><span class="rv-meta-value">${esc(item.title)}</span>
        <span class="rv-meta-label">상태</span>
        <span class="rv-meta-value"><span class="status-pill status-reviewing">${esc(item.statusLabel)}</span>${reviewPill}</span>
        <span class="rv-meta-label">액션</span><span class="rv-meta-value">${esc(actionLabel)}</span>
        <span class="rv-meta-label">담당자</span><span class="rv-meta-value">${esc(item.assignee)}</span>
        <span class="rv-meta-label">작성자</span><span class="rv-meta-value">${esc(item.author)}</span>
        <span class="rv-meta-label">제출일</span><span class="rv-meta-value">${esc(item.submittedAt)}</span>
      </div>`;
  }

  function renderContext(item) {
    const breadcrumb = (item.menuPath || []).map(esc).join(' › ');
    const chips = (item.relatedTables || [])
      .map((t) => `<span class="rv-chip">${esc(t)}</span>`)
      .join('');
    const spLine = item.sp
      ? `<div class="rv-context-row"><span class="rv-meta-label">출처 SP</span><span class="rv-chip rv-chip-sp">${esc(item.sp)}</span></div>`
      : '';
    return `
      <div class="rv-context">
        <div class="rv-context-row"><span class="rv-meta-label">시스템</span><span class="rv-meta-value">${esc(item.system || '—')}</span></div>
        <div class="rv-context-row"><span class="rv-meta-label">메뉴 경로</span><span class="rv-meta-value">${breadcrumb || '—'}</span></div>
        ${spLine}
        <div class="rv-context-row"><span class="rv-meta-label">관련 테이블</span>
          <div class="rv-context__chips">${chips || '<span class="rv-meta-value">—</span>'}</div>
        </div>
      </div>`;
  }

  // E: deletion → single-column panel; submission → 3-col diff
  function renderDiffOrDeletion(item) {
    if (item.action === 'deletion') {
      const rows = Object.entries(item.currentPayload || {})
        .map(
          ([k, v]) =>
            `<div class="rv-diff-row removed"><span class="rv-diff-key">${esc(k)}</span>` +
            `<span class="rv-diff-old">${esc(valueToText(v))}</span><span class="rv-diff-new"><em>삭제됨</em></span></div>`,
        )
        .join('');
      const reasonHtml = item.deletionReason
        ? `<div class="rv-deletion-reason"><span class="rv-meta-label">삭제 사유</span><span class="rv-meta-value">${esc(item.deletionReason)}</span></div>`
        : '';
      return `<div class="rv-deletion-panel"><div class="rv-diff">${rows}</div>${reasonHtml}</div>`;
    }
    // F: use computePayloadDiff + valueToText from diff-helpers.js
    const diffs = computePayloadDiff(item.currentPayload, item.newPayload);
    const rows = diffs
      .map(
        (d) =>
          `<div class="rv-diff-row ${esc(d.type)}">` +
          `<span class="rv-diff-key">${esc(d.key)}</span>` +
          `<span class="rv-diff-old">${d.oldVal !== undefined ? esc(valueToText(d.oldVal)) : '<em>없음</em>'}</span>` +
          `<span class="rv-diff-new">${d.newVal !== undefined ? esc(valueToText(d.newVal)) : '<em>삭제됨</em>'}</span></div>`,
      )
      .join('');
    return `
      <div class="rv-diff-header"><span></span><span>현재 (is_current)</span><span>신규 제출</span></div>
      <div class="rv-diff">${rows || '<div class="rv-meta-value">변경 없음</div>'}</div>`;
  }

  function renderAttachments(item) {
    if (!item.attachments || !item.attachments.length)
      return '<div class="rv-meta-value rv-attach-empty">첨부 파일 없음</div>';
    return item.attachments
      .map(
        (a) =>
          `<div class="rv-attach-row"><i data-lucide="paperclip"></i><span class="rv-attach-name">${esc(a.name)}</span><span class="rv-attach-size">${esc(a.size)}</span></div>`,
      )
      .join('');
  }

  function renderHistory(item) {
    if (!item.history || !item.history.length) return '<div class="rv-meta-value">이력 없음</div>';
    return item.history
      .map(
        (h) =>
          `<div class="rv-history__item${h.isCurrent ? ' rv-history__item--current' : ''}">` +
          `<span class="rv-history-ts">${esc(h.ts)}</span><span class="rv-history-actor">${esc(h.actor)}</span>` +
          `<span class="rv-history-action">${esc(h.action)}</span>` +
          `<span class="rv-history-state rv-state-${esc(h.finalState)}">${esc(h.finalState)}</span></div>`,
      )
      .join('');
  }

  // ── Main render ───────────────────────────────────────────────────────────────
  function renderReviewDetail(item) {
    // A: role gate
    const role = (window.currentUser && window.currentUser.role) || 'viewer';
    const canDecide = role === 'manager' || role === 'admin';
    const dis = canDecide ? '' : ' disabled';
    const roleNotice = canDecide
      ? ''
      : '<div class="rv-detail-error" style="display:block">권한 없음: Manager 또는 Admin만 승인/반려할 수 있습니다.</div>';

    return `
      <div class="rv-detail-panel" role="document">
        <div class="rv-detail-toolbar">
          <span id="rvDetailTitle" class="rv-detail-title">검토 상세</span>
          <button class="rv-detail-close rv-btn rv-btn-ghost" onclick="closeReviewDetail()" aria-label="닫기"><i data-lucide="x"></i></button>
        </div>
        <section class="rv-detail-section"><div class="rv-section-title">메타 정보</div>${renderMetaHeader(item)}</section>
        <section class="rv-detail-section"><div class="rv-section-title">시스템 · 메뉴 컨텍스트</div>${renderContext(item)}</section>
        <section class="rv-detail-section"><div class="rv-section-title">Payload Diff</div>${renderDiffOrDeletion(item)}</section>
        <section class="rv-detail-section"><div class="rv-section-title">첨부 파일</div>${renderAttachments(item)}</section>
        <section class="rv-detail-section"><div class="rv-section-title">히스토리 타임라인</div><div class="rv-history">${renderHistory(item)}</div></section>
        <section class="rv-detail-section">
          <label for="rvDetailComment" class="rv-section-title">댓글 / 사유 <span class="rv-comment-note">(반려 시 필수)</span></label>
          <div class="rv-comment">
            <textarea id="rvDetailComment" rows="4" placeholder="승인 코멘트 또는 반려 사유를 입력하세요..." aria-describedby="rvDetailCommentError"></textarea>
            <div id="rvDetailCommentError" class="rv-detail-error" style="display:none" role="alert">반려 시 사유를 입력해야 합니다.</div>
          </div>
        </section>
        <div class="rv-actions">
          ${roleNotice}
          <button class="rv-btn rv-btn-ghost" data-action="reject" data-id="${esc(item.id)}"${dis}><i data-lucide="x-circle"></i> 반려</button>
          <button class="rv-btn rv-btn-primary" data-action="approve" data-id="${esc(item.id)}"${dis}><i data-lucide="check-circle"></i> 승인</button>
        </div>
      </div>`;
  }

  // ── Submit decision ───────────────────────────────────────────────────────────
  window.submitReviewDecision = function submitReviewDecision(id, decision) {
    const commentEl = document.getElementById('rvDetailComment');
    const errorEl = document.getElementById('rvDetailCommentError');
    const comment = commentEl ? commentEl.value.trim() : '';
    if (decision === 'reject' && !comment) {
      if (errorEl) errorEl.style.display = '';
      if (commentEl) commentEl.focus();
      return;
    }
    if (errorEl) errorEl.style.display = 'none';
    // B: pass comment to approve/reject
    if (decision === 'approve') {
      if (typeof approveReview === 'function') approveReview(id, comment);
    } else {
      if (typeof rejectReview === 'function') rejectReview(id, comment);
    }
    closeReviewDetail();
  };
})();
