// Result Review Detail Drawer — Stage B-1 P-1.C1 extension
// Opens a full-detail overlay when a review queue card is clicked.
// Depends on: result-review.js (reviewQueue, escHtml, approveReview, rejectReview, showReviewToast)

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
    const item = (window.reviewQueue || []).find((r) => r.id === id);
    if (!item) return;
    _priorFocus = document.activeElement;

    let overlay = document.getElementById('rvDetailOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'rvDetailOverlay';
      overlay.className = 'rv-detail-overlay';
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');
      overlay.setAttribute('aria-label', '검토 상세');
      document.body.appendChild(overlay);
      overlay.addEventListener('click', function (e) {
        if (e.target === overlay) closeReviewDetail();
      });
    }

    overlay.innerHTML = renderReviewDetail(item);
    overlay.classList.add('open');

    if (window.lucide) lucide.createIcons({ nodes: [overlay] });

    // Focus first focusable element (close button)
    const first = _focusableElements(overlay)[0];
    if (first) first.focus();

    // Esc to close
    _escHandler = function (e) {
      if (e.key === 'Escape') closeReviewDetail();
    };
    document.addEventListener('keydown', _escHandler);

    // Focus trap
    overlay.addEventListener('keydown', _trapFocus);
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
  function _focusableElements(container) {
    return Array.from(
      container.querySelectorAll(
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
    const first = els[0];
    const last = els[els.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  // ── Payload diff ──────────────────────────────────────────────────────────────
  function computePayloadDiff(currentObj, newObj) {
    const allKeys = new Set([...Object.keys(currentObj || {}), ...Object.keys(newObj || {})]);
    return Array.from(allKeys).map((key) => {
      const oldVal =
        currentObj != null && Object.prototype.hasOwnProperty.call(currentObj, key)
          ? currentObj[key]
          : undefined;
      const newVal =
        newObj != null && Object.prototype.hasOwnProperty.call(newObj, key)
          ? newObj[key]
          : undefined;
      let type;
      if (oldVal === undefined) type = 'added';
      else if (newVal === undefined) type = 'removed';
      else if (String(oldVal) !== String(newVal)) type = 'changed';
      else type = 'same';
      return { key, oldVal, newVal, type };
    });
  }

  // ── Render helpers ────────────────────────────────────────────────────────────
  function renderMetaHeader(item) {
    const actionLabel = item.action === 'deletion' ? '삭제 신청' : '제출 검토';
    return `
      <div class="rv-meta-grid">
        <span class="rv-meta-label">이슈 ID</span>
        <span class="rv-meta-value rv-id-mono">${esc(item.id)}</span>
        <span class="rv-meta-label">제목</span>
        <span class="rv-meta-value">${esc(item.title)}</span>
        <span class="rv-meta-label">상태</span>
        <span class="rv-meta-value"><span class="status-pill status-reviewing">${esc(item.statusLabel)}</span></span>
        <span class="rv-meta-label">액션</span>
        <span class="rv-meta-value">${esc(actionLabel)}</span>
        <span class="rv-meta-label">담당자</span>
        <span class="rv-meta-value">${esc(item.assignee)}</span>
        <span class="rv-meta-label">작성자</span>
        <span class="rv-meta-value">${esc(item.author)}</span>
        <span class="rv-meta-label">제출일</span>
        <span class="rv-meta-value">${esc(item.submittedAt)}</span>
      </div>`;
  }

  function renderContext(item) {
    const breadcrumb = (item.menuPath || []).map(esc).join(' › ');
    const tableChips = (item.relatedTables || [])
      .map((t) => `<span class="rv-chip">${esc(t)}</span>`)
      .join('');
    const spLine = item.sp
      ? `<div class="rv-context-row"><span class="rv-meta-label">출처 SP</span><span class="rv-chip rv-chip-sp">${esc(item.sp)}</span></div>`
      : '';
    return `
      <div class="rv-context">
        <div class="rv-context-row">
          <span class="rv-meta-label">시스템</span>
          <span class="rv-meta-value">${esc(item.system || '—')}</span>
        </div>
        <div class="rv-context-row">
          <span class="rv-meta-label">메뉴 경로</span>
          <span class="rv-meta-value">${breadcrumb || '—'}</span>
        </div>
        ${spLine}
        <div class="rv-context-row">
          <span class="rv-meta-label">관련 테이블</span>
          <div class="rv-context__chips">${tableChips || '<span class="rv-meta-value">—</span>'}</div>
        </div>
      </div>`;
  }

  function renderDiff(item) {
    const diffs = computePayloadDiff(item.currentPayload, item.newPayload);
    const rows = diffs
      .map(
        (d) => `
          <div class="rv-diff-row ${esc(d.type)}">
            <span class="rv-diff-key">${esc(d.key)}</span>
            <span class="rv-diff-old">${d.oldVal !== undefined ? esc(d.oldVal) : '<em>없음</em>'}</span>
            <span class="rv-diff-new">${d.newVal !== undefined ? esc(d.newVal) : '<em>삭제됨</em>'}</span>
          </div>`,
      )
      .join('');
    return `
      <div class="rv-diff-header">
        <span>현재 (is_current)</span>
        <span>신규 제출</span>
      </div>
      <div class="rv-diff">${rows || '<div class="rv-meta-value">변경 없음</div>'}</div>`;
  }

  function renderAttachments(item) {
    if (!item.attachments || !item.attachments.length) {
      return '<div class="rv-meta-value rv-attach-empty">첨부 파일 없음</div>';
    }
    return item.attachments
      .map(
        (a) =>
          `<div class="rv-attach-row"><i data-lucide="paperclip"></i><span class="rv-attach-name">${esc(a.name)}</span><span class="rv-attach-size">${esc(a.size)}</span></div>`,
      )
      .join('');
  }

  function renderHistory(item) {
    if (!item.history || !item.history.length) {
      return '<div class="rv-meta-value">이력 없음</div>';
    }
    return item.history
      .map(
        (h) => `
          <div class="rv-history__item${h.isCurrent ? ' rv-history__item--current' : ''}">
            <span class="rv-history-ts">${esc(h.ts)}</span>
            <span class="rv-history-actor">${esc(h.actor)}</span>
            <span class="rv-history-action">${esc(h.action)}</span>
            <span class="rv-history-state rv-state-${esc(h.finalState)}">${esc(h.finalState)}</span>
          </div>`,
      )
      .join('');
  }

  // ── Main render ───────────────────────────────────────────────────────────────
  function renderReviewDetail(item) {
    return `
      <div class="rv-detail-panel" role="document">
        <div class="rv-detail-toolbar">
          <span class="rv-detail-title">검토 상세</span>
          <button class="rv-detail-close rv-btn rv-btn-ghost" onclick="closeReviewDetail()" aria-label="닫기">
            <i data-lucide="x"></i>
          </button>
        </div>

        <section class="rv-detail-section">
          <div class="rv-section-title">메타 정보</div>
          ${renderMetaHeader(item)}
        </section>

        <section class="rv-detail-section">
          <div class="rv-section-title">시스템 · 메뉴 컨텍스트</div>
          ${renderContext(item)}
        </section>

        <section class="rv-detail-section">
          <div class="rv-section-title">Payload Diff</div>
          ${renderDiff(item)}
        </section>

        <section class="rv-detail-section">
          <div class="rv-section-title">첨부 파일</div>
          ${renderAttachments(item)}
        </section>

        <section class="rv-detail-section">
          <div class="rv-section-title">히스토리 타임라인</div>
          <div class="rv-history">${renderHistory(item)}</div>
        </section>

        <section class="rv-detail-section">
          <div class="rv-section-title">댓글 / 사유 <span class="rv-comment-note">(반려 시 필수)</span></div>
          <div class="rv-comment">
            <textarea id="rvDetailComment" rows="4" placeholder="승인 코멘트 또는 반려 사유를 입력하세요..."></textarea>
            <div id="rvDetailCommentError" class="rv-detail-error" style="display:none">반려 시 사유를 입력해야 합니다.</div>
          </div>
        </section>

        <div class="rv-actions">
          <button class="rv-btn rv-btn-ghost" onclick="submitReviewDecision('${esc(item.id)}', 'reject')">
            <i data-lucide="x-circle"></i> 반려
          </button>
          <button class="rv-btn rv-btn-primary" onclick="submitReviewDecision('${esc(item.id)}', 'approve')">
            <i data-lucide="check-circle"></i> 승인
          </button>
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

    if (decision === 'approve') {
      if (typeof approveReview === 'function') approveReview(id);
    } else {
      if (typeof rejectReview === 'function') rejectReview(id);
    }
    closeReviewDetail();
  };
})();
