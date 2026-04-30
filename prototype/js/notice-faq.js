// ── 공지사항 렌더
function renderNotices() {
  const today = new Date().toISOString().slice(0, 10);
  const el = document.getElementById('page-notices');
  const visible = NOTICES.filter((n) => n.visible && n.from <= today && n.to >= today);
  const levelLabel = { urgent: '긴급', important: '중요', normal: '일반' };
  el.innerHTML = `
    <div class="admin-topbar">
      <h2 class="admin-title">공지사항</h2>
      <div class="admin-topbar-actions" id="noticeAdminEntrySlot"></div>
    </div>
    <div class="admin-body" id="noticeAdminBody">
      ${visible.length === 0 ? '<p style="color:var(--text-tertiary);padding:32px 24px">등록된 공지사항이 없습니다.</p>' : ''}
      ${visible
        .map(
          (n, i) => `
        <div class="notice-item" style="border-bottom:1px solid var(--border-subtle)">
          <div onclick="toggleNotice(${n.id})" class="notice-row">
            <span class="notice-badge notice-badge-${n.level}">${levelLabel[n.level]}</span>
            <span style="flex:1;font-size:14px;color:var(--text-primary)">${n.title}</span>
            <span style="font-size:12px;color:var(--text-tertiary);flex-shrink:0">${n.from} ~ ${n.to}</span>
            <i data-lucide="chevron-down" style="width:14px;height:14px;color:var(--text-tertiary);transition:transform .2s;flex-shrink:0" id="notice-icon-${n.id}"></i>
          </div>
          <div id="notice-body-${n.id}" class="notice-body">${n.content}</div>
        </div>`,
        )
        .join('')}
    </div>`;
  lucide.createIcons();
  if (window.AdminMode) {
    window.AdminMode.renderEntryButton(document.getElementById('noticeAdminEntrySlot'));
    window.AdminMode.renderModeBanner(document.getElementById('noticeAdminBody'));
  }
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
  function hl(text) {
    if (!faqQuery) return text;
    const re = new RegExp(`(${faqQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(
      re,
      '<mark style="background:var(--brand-bg);color:var(--accent);border-radius:2px">$1</mark>',
    );
  }
  el.innerHTML = `
    <div class="admin-topbar">
      <h2 class="admin-title">FAQ</h2>
      <div class="admin-topbar-actions" id="faqAdminEntrySlot"></div>
    </div>
    <div class="admin-body" id="faqAdminBody">
      <div class="faq-filter-bar">
        <input id="faqSearch" type="text" placeholder="검색..." value="${faqQuery}"
          oninput="faqQuery=this.value;renderFaq()"
          class="faq-search">
        <div class="faq-cat-group">
          ${categories.map((c) => `<button onclick="faqCategory='${c}';renderFaq()" class="faq-cat-btn${faqCategory === c ? ' active' : ''}">${c}</button>`).join('')}
        </div>
      </div>
      ${filtered.length === 0 ? '<p style="color:var(--text-tertiary);padding:16px 24px">검색 결과가 없습니다.</p>' : ''}
      ${filtered
        .map(
          (f) => `
        <div class="faq-item">
          <div onclick="toggleFaq(${f.id})" class="notice-row">
            <span class="notice-badge notice-badge-normal">${f.category}</span>
            <span style="flex:1;font-size:14px;color:var(--text-primary)">${hl(f.q)}</span>
            <i data-lucide="chevron-down" style="width:14px;height:14px;color:var(--text-tertiary);transition:transform .2s;flex-shrink:0" id="faq-icon-${f.id}"></i>
          </div>
          <div id="faq-body-${f.id}" class="notice-body">${hl(f.a)}</div>
        </div>`,
        )
        .join('')}
    </div>`;
  lucide.createIcons();
}

function toggleFaq(id) {
  const body = document.getElementById('faq-body-' + id);
  const icon = document.getElementById('faq-icon-' + id);
  const open = body.style.display === 'block';
  body.style.display = open ? 'none' : 'block';
  icon.style.transform = open ? '' : 'rotate(180deg)';
}

// Mount admin-mode entry button + banner after FAQ DOM is built.
(function attachFaqAdminHooks() {
  const orig = window.renderFaq;
  if (typeof orig !== 'function') return;
  window.renderFaq = function () {
    orig.apply(this, arguments);
    if (window.AdminMode) {
      window.AdminMode.renderEntryButton(document.getElementById('faqAdminEntrySlot'));
      window.AdminMode.renderModeBanner(document.getElementById('faqAdminBody'));
    }
  };
})();

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
// 공지/FAQ 페이지의 `?mode=admin` 토글로 통합됩니다 (P-9에서 시연 추가 예정).
// 기존 renderAdminNotices/renderAdminFaq + 헬퍼는 D19와 모순되어 제거 (cross-review R-10).
