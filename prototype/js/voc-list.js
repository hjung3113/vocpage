// ── Filter & Sort
function getVisible() {
  let list = VOCDATA.filter((v) => {
    if (currentView === 'mine' && v.author !== CURRENT_USER) return false;
    if (currentView === 'assigned' && v.assignee !== CURRENT_USER) return false;
    if (currentStatus !== '전체' && v.status !== currentStatus) return false;
    if (activeSysId && v.systemId !== activeSysId) return false;
    if (activeMenuId && v.menuId !== activeMenuId) return false;
    if (filterAssignees.size > 0 && !filterAssignees.has(v.assignee)) return false;
    if (filterPriorities.size > 0 && !filterPriorities.has(v.priority)) return false;
    if (filterTypes.size > 0 && !filterTypes.has(v.type)) return false;
    if (filterTags.size > 0 && !v.tags?.some((tag) => filterTags.has(tag))) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const bodyText = (v.body || '').replace(/<[^>]*>/g, '').toLowerCase();
      return (
        v.title.toLowerCase().includes(q) ||
        bodyText.includes(q) ||
        v.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return true;
  });
  return list.sort((a, b) => {
    let cmp = 0;
    if (sortKey === 'date') cmp = a.date.localeCompare(b.date);
    else if (sortKey === 'id') cmp = a.id.localeCompare(b.id);
    else if (sortKey === 'title') cmp = a.title.localeCompare(b.title, 'ko');
    else if (sortKey === 'status') cmp = a.status.localeCompare(b.status, 'ko');
    else if (sortKey === 'priority') cmp = PRI_ORDER[a.priority] - PRI_ORDER[b.priority];
    else if (sortKey === 'assignee')
      cmp = (a.assignee || 'ㅎ').localeCompare(b.assignee || 'ㅎ', 'ko');
    return sortDir === 'asc' ? cmp : -cmp;
  });
}

function renderVOCList() {
  const all = getVisible();
  const totalPages = Math.ceil(all.length / PAGE_SIZE);
  if (currentPage > totalPages && totalPages > 0) currentPage = totalPages;
  const start = (currentPage - 1) * PAGE_SIZE;
  const shown = all.slice(start, start + PAGE_SIZE);

  if (all.length === 0) {
    document.getElementById('listArea').innerHTML = '';
    document.getElementById('paginationRow').innerHTML =
      `<div class="empty-state"><div class="empty-state-icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg></div><div class="empty-state-title">검색 결과가 없습니다</div><div class="empty-state-desc">검색어 또는 필터 조건을 변경해 보세요</div></div>`;
  } else {
    document.getElementById('listArea').innerHTML = shown.map(renderRow).join('');
    const noMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!noMotion) {
      document.querySelectorAll('#listArea .voc-group').forEach((el, i) => {
        el.classList.add('entering');
        el.style.animationDelay = `${i * 28}ms`;
        el.addEventListener(
          'animationend',
          () => {
            el.classList.remove('entering');
            el.style.animationDelay = '';
          },
          { once: true },
        );
      });
    }
    const pr = document.getElementById('paginationRow');
    if (totalPages <= 1) {
      pr.innerHTML = '';
    } else {
      pr.innerHTML = `<div class="pagination">${renderPageBtns(currentPage, totalPages)}</div>`;
    }
  }
  document.getElementById('topbarCount').textContent = `${all.length}개`;
  lucide.createIcons();
}

function renderList() {
  renderVOCList();
}

function renderPageBtns(cur, total) {
  const pages = [];
  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i);
  } else {
    pages.push(1);
    if (cur > 3) pages.push('...');
    for (let i = Math.max(2, cur - 1); i <= Math.min(total - 1, cur + 1); i++) pages.push(i);
    if (cur < total - 2) pages.push('...');
    pages.push(total);
  }
  const prev = `<button class="page-btn" ${cur === 1 ? 'disabled' : ''} onclick="goPage(${cur - 1})">‹</button>`;
  const next = `<button class="page-btn" ${cur === total ? 'disabled' : ''} onclick="goPage(${cur + 1})">›</button>`;
  const btns = pages
    .map((p) =>
      p === '...'
        ? `<span class="page-ellipsis">…</span>`
        : `<button class="page-btn ${p === cur ? 'active' : ''}" onclick="goPage(${p})">${p}</button>`,
    )
    .join('');
  return prev + btns + next;
}

function goPage(n) {
  currentPage = n;
  renderVOCList();
  document.querySelector('.list-area')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderRow(v) {
  const q = searchQuery;
  const titleText = highlight(v.title, q);
  const tagsHTML = v.tags.map((t) => `<span class="tag-pill">${highlight(t, q)}</span>`).join('');
  const hasSubs = v.subs && v.subs.length > 0;
  const expandBtn = hasSubs
    ? `<div class="expand-btn" id="exp-${v.id}" onclick="event.stopPropagation();toggleExpand('exp-${v.id}','sub-${v.id}')"><i data-lucide="chevron-right"></i></div>`
    : `<div class="expand-btn" style="opacity:.25;pointer-events:none"><i data-lucide="chevron-right"></i></div>`;
  const subsHTML = hasSubs
    ? `<div class="subtask-wrap" id="sub-${v.id}"><div class="subtask-inner">${v.subs
        .map((sid) => {
          const s = SUBDATA[sid];
          if (!s) return '';
          return `<div class="voc-row" onclick="openDrawer('${s.id}')">
          <div class="vcell"></div>
          <div class="vcell"><div class="sub-indent"><i data-lucide="corner-down-right"></i><span class="issue-code">${s.code}</span></div></div>
          <div class="vcell"><div class="voc-title-cell"><span class="voc-title-text">${s.title}</span></div></div>
          <div class="vcell">${statusHTML(s.status)}</div>
          <div class="vcell">${assigneeHTML(s)}</div>
          <div class="vcell">${priHTML(s.priority)}</div>
          <div class="vcell"><div class="date-cell">${s.date}</div></div>
        </div>`;
        })
        .join('')}</div></div>`
    : '';
  const typeInfo = TYPE_MAP[v.type];
  const typeBadge = typeInfo
    ? `<span class="type-badge" style="background:${typeInfo.color}18;color:${typeInfo.color}"><span class="type-badge-dot" style="background:${typeInfo.color}"></span>${typeInfo.name}</span>`
    : '';
  return `<div class="voc-group">
    <div class="voc-row" id="row-${v.id}" onclick="openDrawer('${v.id}')">
      <div class="vcell">${expandBtn}</div>
      <div class="vcell"><span class="issue-code">${v.code}</span></div>
      <div class="vcell"><div class="voc-title-cell">${typeBadge}<span class="voc-title-text">${titleText}</span><div class="tag-row">${tagsHTML}</div></div></div>
      <div class="vcell">${statusHTML(v.status)}</div>
      <div class="vcell">${assigneeHTML(v)}</div>
      <div class="vcell">${priHTML(v.priority)}</div>
      <div class="vcell"><div class="date-cell">${v.date}</div></div>
    </div>${subsHTML}
  </div>`;
}

// ── Search
function onSearch(val) {
  searchQuery = val.trim();
  currentPage = 1;
  renderVOCList();
}

// ── N-06 Sort chips ───────────────────────────────────────────────────────────
// API key mapping for URL sort param (internal key → API field name)
const SORT_API_KEY_MAP = {
  date: 'created_at',
  id: 'issue_code',
  title: 'title',
  status: 'status',
  priority: 'priority',
  assignee: 'assignee',
};

function sortByChip(key) {
  if (sortKey === key) {
    sortDir = sortDir === 'asc' ? 'desc' : 'asc';
  } else {
    sortKey = key;
    sortDir = 'desc';
  }
  currentPage = 1;
  updateSortChips();
  // Sync existing list-header hcells too
  document.querySelectorAll('.hcell').forEach((h) => {
    const isActive = h.dataset.sortKey === key;
    h.classList.toggle('sort-active', isActive);
    const icon = h.querySelector('.sort-icon');
    if (icon) {
      icon.setAttribute(
        'data-lucide',
        isActive ? (sortDir === 'asc' ? 'chevron-up' : 'chevron-down') : 'chevrons-up-down',
      );
    }
  });
  lucide.createIcons();
  // URL sync: ?sort=api_key&order=dir
  const url = new URL(window.location.href);
  url.searchParams.set('sort', SORT_API_KEY_MAP[key] || key);
  url.searchParams.set('order', sortDir);
  history.replaceState(null, '', url.pathname + '?' + url.searchParams.toString());
  renderVOCList();
}

function updateSortChips() {
  document.querySelectorAll('.sort-chip').forEach((chip) => {
    const key = chip.dataset.sortKey;
    const isActive = key === sortKey;
    chip.classList.toggle('sort-chip--active', isActive);
    chip.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    // Remove any existing direction indicator
    const existingIcon = chip.querySelector('.sort-chip-icon');
    if (existingIcon) existingIcon.remove();
    if (isActive) {
      const icon = document.createElement('span');
      icon.className = 'sort-chip-icon';
      icon.setAttribute('aria-hidden', 'true');
      icon.textContent = sortDir === 'asc' ? ' ▲' : ' ▼';
      chip.appendChild(icon);
      // Visually-hidden text for screen readers
      const srText = document.createElement('span');
      srText.className = 'sr-only';
      srText.textContent = sortDir === 'asc' ? ' 오름차순' : ' 내림차순';
      chip.appendChild(srText);
    }
  });
}

// Init sort chips state on load
document.addEventListener('DOMContentLoaded', () => {
  updateSortChips();
});
