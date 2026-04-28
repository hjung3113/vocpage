// Stage B-1 P-1.C1 — Result Review (관리자 검토 큐) prototype shell
// Mock data only. Approve/reject buttons surface a toast; real workflow lands later.
// All payload values pass through window.escHtml() before innerHTML interpolation so the
// pattern is safe to copy when the real impl wires up untrusted input.

// escHtml and showToast live in dom-utils.js (loaded before this file).

// Mock data lives in result-review-data.js (loaded before this file).
const reviewQueue = window.reviewQueue || [];

let reviewTab = 'submission';

function renderResultReview() {
  const el = document.getElementById('page-result-review');
  if (!el) return;
  const submissionCount = reviewQueue.filter((r) => r.action === 'submission').length;
  const deletionCount = reviewQueue.filter((r) => r.action === 'deletion').length;
  const items = reviewQueue.filter((r) => r.action === reviewTab);
  el.innerHTML = `
    <div class="admin-topbar">
      <span class="admin-title">결과 검토</span>
      <span class="section-count-badge">${reviewQueue.length}건 대기</span>
    </div>
    <div class="review-tabs" role="tablist">
      <button class="review-tab ${reviewTab === 'submission' ? 'active' : ''}" role="tab" aria-selected="${reviewTab === 'submission'}" tabindex="${reviewTab === 'submission' ? 0 : -1}" data-testid="review-tab-submission" data-tab="submission">제출 검토 <span class="review-tab-count">${submissionCount}</span></button>
      <button class="review-tab ${reviewTab === 'deletion' ? 'active' : ''}" role="tab" aria-selected="${reviewTab === 'deletion'}" tabindex="${reviewTab === 'deletion' ? 0 : -1}" data-testid="review-tab-deletion" data-tab="deletion">삭제 신청 <span class="review-tab-count">${deletionCount}</span></button>
    </div>
    <div class="review-body" id="reviewQueueBody">
      ${items.length === 0 ? '<div class="review-empty">대기 중인 항목이 없습니다.</div>' : items.map(renderReviewCard).join('')}
    </div>
  `;
  if (window.lucide) lucide.createIcons();

  // bind delegated click + keydown once on stable parent
  if (!el.dataset.bound) {
    el.dataset.bound = '1';

    // tab switching via delegation
    el.addEventListener('click', function (e) {
      const tab = e.target.closest('[role="tab"][data-tab]');
      if (tab) {
        switchReviewTab(tab.dataset.tab);
        return;
      }
    });
    el.addEventListener('keydown', function (e) {
      const tab = e.target.closest('[role="tab"][data-tab]');
      if (tab) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          e.preventDefault();
          const tabs = Array.from(el.querySelectorAll('[role="tab"][data-tab]'));
          const idx = tabs.indexOf(tab);
          const next = tabs[(idx + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
          if (next) {
            const nextTabName = next.dataset.tab;
            switchReviewTab(nextTabName);
            // re-query: switchReviewTab re-renders the tablist, so `next` is detached
            const refreshed = el.querySelector('[role="tab"][data-tab="' + nextTabName + '"]');
            if (refreshed) refreshed.focus();
          }
        }
        return;
      }
    });

    // card open button delegation
    function handleCardAction(e) {
      const btn = e.target.closest('button[data-action]');
      if (btn) {
        if (e.type === 'click') e.stopPropagation();
        const action = btn.dataset.action;
        const id = btn.dataset.id;
        if (action === 'open' && id && typeof openReviewDetail === 'function') {
          openReviewDetail(id);
        }
        return;
      }
    }
    el.addEventListener('click', handleCardAction);
  }
}

function renderReviewCard(r) {
  const rows = Object.entries(r.payload)
    .map(
      ([k, v]) =>
        `<div class="review-payload-row"><span class="review-payload-key">${window.escHtml(k)}</span><span class="review-payload-val">${window.escHtml(v)}</span></div>`,
    )
    .join('');
  const id = window.escHtml(r.id);
  // D: show review_status pill next to status pill
  const reviewPill = r.reviewStatusLabel
    ? `<span class="status-pill status-pending">${window.escHtml(r.reviewStatusLabel)}</span>`
    : '';
  return `
    <div class="review-card" data-id="${id}" data-testid="review-card">
      <div class="review-card-head">
        <div class="review-card-meta">
          <span class="review-id">${id}</span>
          <span class="status-pill status-reviewing">${window.escHtml(r.statusLabel)}</span>
          ${reviewPill}
        </div>
        <div class="review-card-title">${window.escHtml(r.title)}</div>
        <div class="review-card-sub">
          <span><i data-lucide="user-check"></i> 담당 ${window.escHtml(r.assignee)}</span>
          <span><i data-lucide="send"></i> 제출 ${window.escHtml(r.author)}</span>
          <span><i data-lucide="calendar"></i> ${window.escHtml(r.submittedAt)}</span>
        </div>
      </div>
      <div class="review-card-body">${rows}</div>
      <div class="review-card-actions">
        <button class="rv-btn rv-btn-ghost" data-testid="rv-reject-inline" data-action="reject" data-id="${id}"><i data-lucide="x"></i> 반려</button>
        <button class="rv-btn rv-btn-primary" data-testid="rv-approve-inline" data-action="approve" data-id="${id}"><i data-lucide="check"></i> 승인</button>
        <button class="rv-btn rv-btn-ghost rv-card-open" data-testid="rv-card-open" data-action="open" data-id="${id}">상세 보기</button>
      </div>
    </div>
  `;
}

function syncReviewBadge() {
  const badge = document.getElementById('reviewBadge');
  if (!badge) return;
  const n = reviewQueue.length;
  badge.textContent = n;
  badge.style.display = n ? '' : 'none';
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', syncReviewBadge);
  } else {
    syncReviewBadge();
  }
}

function switchReviewTab(tab) {
  reviewTab = tab;
  renderResultReview();
}

// B: comment param added; stored on item; included in toast
function approveReview(id, comment) {
  const item = (window.reviewQueue || []).find((r) => r.id === id);
  if (item) item.lastDecisionComment = comment || '';
  const suffix = comment ? ` (사유: ${comment})` : '';
  window.showToast(`${id} 승인 완료${suffix} (mock)`, 'ok');
  window.dispatchEvent(
    new CustomEvent('voc:review:decided', {
      detail: { id, decision: 'approve', comment, ts: Date.now() },
    }),
  );
}

function rejectReview(id, comment) {
  const item = (window.reviewQueue || []).find((r) => r.id === id);
  if (item) item.lastDecisionComment = comment || '';
  const suffix = comment ? ` (사유: ${comment})` : '';
  window.showToast(`${id} 반려 처리${suffix} (mock)`, 'warn');
  window.dispatchEvent(
    new CustomEvent('voc:review:decided', {
      detail: { id, decision: 'reject', comment, ts: Date.now() },
    }),
  );
}
