// ── Filter pills
function togglePill(el, status) {
  document.querySelectorAll('.filterbar .pill').forEach((p) => p.classList.remove('active'));
  el.classList.add('active');
  currentStatus = status;
  currentPage = 1;
  renderVOCList();
}

// ── Sort
function toggleSort(key) {
  if (sortKey === key) {
    sortDir = sortDir === 'asc' ? 'desc' : 'asc';
  } else {
    sortKey = key;
    sortDir = 'asc';
  }
  document.querySelectorAll('.hcell').forEach((h) => {
    const isActive = h.dataset.sortKey === key;
    h.classList.toggle('sort-active', isActive);
    const icon = h.querySelector('.sort-icon');
    if (!icon) return;
    if (isActive) {
      icon.setAttribute('data-lucide', sortDir === 'asc' ? 'chevron-up' : 'chevron-down');
    } else {
      icon.setAttribute('data-lucide', 'chevrons-up-down');
    }
  });
  lucide.createIcons();
  // N-06: keep chips in sync when header cells are clicked
  if (typeof updateSortChips === 'function') updateSortChips();
  // URL sync — use API key mapping (same as sortByChip)
  const url = new URL(window.location.href);
  url.searchParams.set(
    'sort',
    (typeof SORT_API_KEY_MAP !== 'undefined' ? SORT_API_KEY_MAP[key] : null) || key,
  );
  url.searchParams.set('order', sortDir);
  history.replaceState(null, '', url.pathname + '?' + url.searchParams.toString());
  currentPage = 1;
  renderVOCList();
}

// ── Advanced Filter
function toggleAdvFilter() {
  advFilterOpen = !advFilterOpen;
  document.getElementById('advFilterWrap').classList.toggle('open', advFilterOpen);
  document
    .getElementById('filterMoreBtn')
    .classList.toggle('filter-on', advFilterOpen || hasAdvFilters());
  if (advFilterOpen) {
    renderTypeChips();
    renderTagChips();
  }
}
function renderTypeChips() {
  const el = document.getElementById('typeChips');
  if (!el) return;
  el.innerHTML = VOC_TYPES.map(
    (t) =>
      `<div class="af-chip${filterTypes.has(t.slug) ? ' active' : ''}" onclick="toggleAfChip('type','${t.slug}',this)" style="display:inline-flex;align-items:center;gap:5px">
      <span class="af-dot" style="background:${t.color}"></span>${t.name}
    </div>`,
  ).join('');
}
function renderTagChips() {
  const el = document.getElementById('tagChips');
  if (!el) return;
  const allTags = [...new Set(VOCDATA.flatMap((v) => v.tags || []))].sort();
  const esc = window.escHtml || ((s) => s);
  el.innerHTML = allTags
    .map(
      (tag) =>
        `<div class="af-chip${filterTags.has(tag) ? ' active' : ''}" onclick="toggleTagChip('${esc(tag)}',this)">${esc(tag)}</div>`,
    )
    .join('');
}
function toggleTagChip(tag, el) {
  filterTags.has(tag) ? filterTags.delete(tag) : filterTags.add(tag);
  el.classList.toggle('active');
  updateFilterBtnState();
  currentPage = 1;
  renderVOCList();
}
function toggleAfChip(type, val, el) {
  const sets = { assignee: filterAssignees, priority: filterPriorities, type: filterTypes };
  const s = sets[type];
  if (s.has(val)) {
    s.delete(val);
    el.classList.remove('active');
  } else {
    s.add(val);
    el.classList.add('active');
  }
  if (type === 'type') renderTypeChips();
  updateFilterBtnState();
  currentPage = 1;
  renderVOCList();
}
function clearAdvFilter() {
  filterAssignees.clear();
  filterPriorities.clear();
  filterTypes.clear();
  filterTags.clear();
  document.querySelectorAll('.af-chip').forEach((c) => c.classList.remove('active'));
  renderTypeChips();
  renderTagChips();
  updateFilterBtnState();
  currentPage = 1;
  renderVOCList();
}
function hasAdvFilters() {
  return filterAssignees.size + filterPriorities.size + filterTypes.size + filterTags.size > 0;
}
function updateFilterBtnState() {
  const btn = document.getElementById('filterMoreBtn');
  const count = filterAssignees.size + filterPriorities.size + filterTypes.size + filterTags.size;
  const badgeHTML = count > 0 ? `<span class="fc-badge">${count}</span>` : '';
  btn.innerHTML = `<i data-lucide="sliders-horizontal"></i> 필터 더보기${badgeHTML}`;
  btn.classList.toggle('filter-on', advFilterOpen || hasAdvFilters());
  lucide.createIcons({ nodes: [btn] });
}

// ── Drawer VOC index (build after data is loaded)
const VOC_MAP = {};
VOCDATA.forEach((v) => {
  VOC_MAP[v.id] = v;
});
Object.assign(VOC_MAP, SUBDATA);
