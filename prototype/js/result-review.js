// Stage B-1 P-1.C1 — Result Review (관리자 검토 큐) prototype shell
// Mock data only. Approve/reject buttons surface a toast; real workflow lands later.
// All payload values pass through escHtml() before innerHTML interpolation so the
// pattern is safe to copy when the real impl wires up untrusted input.

function escHtml(s) {
  return String(s).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
}

const reviewQueue = [
  {
    id: 'VOC-1234',
    title: 'PM 설비 알람 누락 (압연 라인)',
    action: 'submission',
    statusLabel: '제출 검토',
    assignee: '김철수',
    author: '이영희',
    submittedAt: '2026-04-25',
    payload: {
      설비: '압연-A',
      증상: '알람이 1시간 주기로 누락됨',
      원인: '센서 단선 (DI-12 채널)',
      조치: '센서 교체 및 PM 절차에 점검 항목 추가',
    },
  },
  {
    id: 'VOC-1235',
    title: 'MES 로그인 지연 (30초+)',
    action: 'submission',
    statusLabel: '제출 검토',
    assignee: '박민수',
    author: '최수진',
    submittedAt: '2026-04-26',
    payload: {
      시스템: 'MES',
      증상: '로그인 시 30초 이상 대기',
      원인: 'LDAP 풀 고갈',
      조치: 'LDAP 커넥션 풀 사이즈 20→60 증설',
    },
  },
  {
    id: 'VOC-1236',
    title: 'QC 리포트 출력 오류 — 중복 등록',
    action: 'deletion',
    statusLabel: '삭제 신청',
    assignee: '이지원',
    author: '김미래',
    submittedAt: '2026-04-27',
    payload: {
      사유: 'VOC-0998과 동일 건 — 담당자 합의 후 삭제 요청',
    },
  },
];

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
    <div class="review-tabs">
      <div class="review-tab ${reviewTab === 'submission' ? 'active' : ''}" onclick="switchReviewTab('submission')">
        제출 검토 <span class="review-tab-count">${submissionCount}</span>
      </div>
      <div class="review-tab ${reviewTab === 'deletion' ? 'active' : ''}" onclick="switchReviewTab('deletion')">
        삭제 신청 <span class="review-tab-count">${deletionCount}</span>
      </div>
    </div>
    <div class="review-body">
      ${items.length === 0 ? '<div class="review-empty">대기 중인 항목이 없습니다.</div>' : items.map(renderReviewCard).join('')}
    </div>
  `;
  if (window.lucide) lucide.createIcons();
}

function renderReviewCard(r) {
  const rows = Object.entries(r.payload)
    .map(
      ([k, v]) =>
        `<div class="review-payload-row"><span class="review-payload-key">${escHtml(k)}</span><span class="review-payload-val">${escHtml(v)}</span></div>`,
    )
    .join('');
  const id = escHtml(r.id);
  return `
    <div class="review-card" data-id="${id}">
      <div class="review-card-head">
        <div class="review-card-meta">
          <span class="review-id">${id}</span>
          <span class="status-pill status-reviewing">${escHtml(r.statusLabel)}</span>
        </div>
        <div class="review-card-title">${escHtml(r.title)}</div>
        <div class="review-card-sub">
          <span><i data-lucide="user-check"></i> 담당 ${escHtml(r.assignee)}</span>
          <span><i data-lucide="send"></i> 제출 ${escHtml(r.author)}</span>
          <span><i data-lucide="calendar"></i> ${escHtml(r.submittedAt)}</span>
        </div>
      </div>
      <div class="review-card-body">${rows}</div>
      <div class="review-card-actions">
        <button class="rv-btn rv-btn-ghost" onclick="rejectReview('${id}')">
          <i data-lucide="x"></i> 반려
        </button>
        <button class="rv-btn rv-btn-primary" onclick="approveReview('${id}')">
          <i data-lucide="check"></i> 승인
        </button>
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

function approveReview(id) {
  showReviewToast(`${id} 승인 처리되었습니다 (mock)`, 'ok');
}

function rejectReview(id) {
  showReviewToast(`${id} 반려 처리되었습니다 — 코멘트 입력은 후속 단계 (mock)`, 'warn');
}

function showReviewToast(msg, kind) {
  let host = document.getElementById('reviewToastHost');
  if (!host) {
    host = document.createElement('div');
    host.id = 'reviewToastHost';
    host.className = 'review-toast-host';
    document.body.appendChild(host);
  }
  const t = document.createElement('div');
  t.className = `review-toast review-toast-${kind || 'ok'}`;
  t.textContent = msg;
  host.appendChild(t);
  setTimeout(() => t.classList.add('out'), 1800);
  setTimeout(() => t.remove(), 2200);
}
