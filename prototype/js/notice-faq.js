// Notice/FAQ user view + admin-mode integration.
// spec: docs/specs/requires/feature-notice-faq.md §10.3 / §10.4
// R2 (B-4a fix branch): all user-content fields escaped via escHtml; FAQ category
// click delegated to data-cat (no inline onclick string interpolation); slot host
// element rendered conditionally on canEnterAdminMode (tree-exclusion per
// uidesign.md §13.8); inline mount only — `attachFaqAdminHooks` monkey-patch
// removed.

function _nfEsc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

function _nfAdminSlot(id) {
  // Tree-exclusion guard — emit slot host ONLY when role can enter admin mode.
  if (!window.AdminMode || !window.AdminMode.canEnterAdminMode()) return '';
  return '<div class="admin-topbar-actions" id="' + id + '"></div>';
}

function _nfMountAdmin(slotId, bodyId) {
  if (!window.AdminMode) return;
  window.AdminMode.renderEntryButton(document.getElementById(slotId));
  window.AdminMode.renderModeBanner(document.getElementById(bodyId));
}

// ── 공지사항 렌더
function renderNotices() {
  const today = new Date().toISOString().slice(0, 10);
  const el = document.getElementById('page-notices');
  const visible = NOTICES.filter((n) => n.visible && n.from <= today && n.to >= today);
  const levelLabel = { urgent: '긴급', important: '중요', normal: '일반' };
  el.innerHTML = `
    <div class="admin-topbar">
      <h2 class="admin-title">공지사항</h2>
      ${_nfAdminSlot('noticeAdminEntrySlot')}
    </div>
    <div class="admin-body" id="noticeAdminBody">
      ${visible.length === 0 ? '<p class="nf-empty">등록된 공지사항이 없습니다.</p>' : ''}
      ${visible
        .map(
          (n) => `
        <div class="notice-item nf-row-divider">
          <div onclick="toggleNotice(${n.id})" class="notice-row">
            <span class="notice-badge notice-badge-${_nfEsc(n.level)}">${_nfEsc(levelLabel[n.level] || '')}</span>
            <span class="nf-title">${_nfEsc(n.title)}</span>
            <span class="nf-period">${_nfEsc(n.from)} ~ ${_nfEsc(n.to)}</span>
            <i data-lucide="chevron-down" class="nf-chevron" id="notice-icon-${n.id}"></i>
          </div>
          <div id="notice-body-${n.id}" class="notice-body">${_nfEsc(n.content)}</div>
        </div>`,
        )
        .join('')}
    </div>`;
  lucide.createIcons();
  _nfMountAdmin('noticeAdminEntrySlot', 'noticeAdminBody');
}

function toggleNotice(id) {
  const body = document.getElementById('notice-body-' + id);
  const icon = document.getElementById('notice-icon-' + id);
  const open = body.style.display === 'block';
  body.style.display = open ? 'none' : 'block';
  icon.style.transform = open ? '' : 'rotate(180deg)';
}

// ── FAQ 렌더
let faqQuery = '';
let faqCategory = '전체';

function renderFaq() {
  const el = document.getElementById('page-faq');
  const categories = ['전체', ...new Set(FAQS.map((f) => f.category))];
  const filtered = FAQS.filter((f) => {
    if (!f.visible) return false;
    if (faqCategory !== '전체' && f.category !== faqCategory) return false;
    if (faqQuery) {
      const q = faqQuery.toLowerCase();
      return f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q);
    }
    return true;
  });
  // R2: escape source text first, then apply highlight wrapping. The regex
  // operates over already-escaped HTML, so &lt; etc. cannot be matched and broken.
  function hl(text) {
    const safe = _nfEsc(text);
    if (!faqQuery) return safe;
    const re = new RegExp(`(${faqQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return safe.replace(re, '<mark class="nf-mark">$1</mark>');
  }
  el.innerHTML = `
    <div class="admin-topbar">
      <h2 class="admin-title">FAQ</h2>
      ${_nfAdminSlot('faqAdminEntrySlot')}
    </div>
    <div class="admin-body" id="faqAdminBody">
      <div class="faq-filter-bar">
        <input id="faqSearch" type="text" placeholder="검색..." value="${_nfEsc(faqQuery)}"
          oninput="faqQuery=this.value;renderFaq()"
          class="faq-search">
        <div class="faq-cat-group" id="faqCatGroup">
          ${categories
            .map(
              (c) =>
                `<button type="button" data-cat="${_nfEsc(c)}" class="faq-cat-btn${faqCategory === c ? ' active' : ''}">${_nfEsc(c)}</button>`,
            )
            .join('')}
        </div>
      </div>
      ${filtered.length === 0 ? '<p class="nf-empty nf-empty-tight">검색 결과가 없습니다.</p>' : ''}
      ${filtered
        .map(
          (f) => `
        <div class="faq-item">
          <div onclick="toggleFaq(${f.id})" class="notice-row">
            <span class="notice-badge notice-badge-normal">${_nfEsc(f.category)}</span>
            <span class="nf-title">${hl(f.q)}</span>
            <i data-lucide="chevron-down" class="nf-chevron" id="faq-icon-${f.id}"></i>
          </div>
          <div id="faq-body-${f.id}" class="notice-body">${hl(f.a)}</div>
        </div>`,
        )
        .join('')}
    </div>`;
  lucide.createIcons();
  // Delegated click for category buttons (replaces vulnerable inline onclick).
  const grp = document.getElementById('faqCatGroup');
  if (grp) {
    grp.addEventListener('click', function (e) {
      const btn = e.target.closest('.faq-cat-btn');
      if (!btn) return;
      faqCategory = btn.getAttribute('data-cat') || '전체';
      renderFaq();
    });
  }
  _nfMountAdmin('faqAdminEntrySlot', 'faqAdminBody');
}

function toggleFaq(id) {
  const body = document.getElementById('faq-body-' + id);
  const icon = document.getElementById('faq-icon-' + id);
  const open = body.style.display === 'block';
  body.style.display = open ? 'none' : 'block';
  icon.style.transform = open ? '' : 'rotate(180deg)';
}

// Re-render whichever info page is active when admin mode toggles
// (handles popstate + button click + programmatic AdminMode.setMode).
document.addEventListener('admin-mode:change', function (e) {
  if (e.detail && e.detail.page === 'notices' && typeof renderNotices === 'function') {
    renderNotices();
  } else if (e.detail && e.detail.page === 'faq' && typeof renderFaq === 'function') {
    renderFaq();
  }
});

// 공지/FAQ 관리는 D19에 따라 별도 admin 페이지가 아니라
// 공지/FAQ 페이지의 `?mode=admin` 토글로 통합됩니다 (B-4b에서 인라인 액션 추가).
// 기존 renderAdminNotices/renderAdminFaq + 헬퍼는 D19와 모순되어 제거 (cross-review R-10).
