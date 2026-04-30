// Stage B-6 P-7 D22 — Tag Master 관리 prototype module
// Depends on: dom-utils.js (escHtml, showToast), modal.js (#modalBg), admin-tag-master-data.js
// Modal functions live in admin-tag-master-modals.js
// Export: window.AdminTagMaster = { render, init }

// ── Module state
let tmFilter = 'all';
let tmQuery = '';
window.tmSuspended = false; // H4: suspend toggle state

// ── Toast wrapper (reuses global showToast)
function showTmToast(msg, kind) {
  if (typeof window.showToast === 'function') window.showToast(msg, kind);
}

// ── Filter helper
function tmFilteredRows() {
  const q = tmQuery.toLowerCase();
  return (window.tagMasterData || []).filter(function (t) {
    if (tmFilter === 'general' && (t.kind !== 'general' || t.isExternal || t.mergedIntoId))
      return false;
    if (tmFilter === 'menu' && t.kind !== 'menu') return false;
    if (tmFilter === 'external' && !t.isExternal) return false;
    if (tmFilter === 'merged' && !t.mergedIntoId) return false;
    // H6: 전체 filter shows merged rows (with reduced opacity via tm-row-merged class)
    if (q && !t.name.toLowerCase().includes(q) && !t.slug.toLowerCase().includes(q)) return false;
    return true;
  });
}

// ── Row renderer
function renderTagRow(t) {
  const esc = window.escHtml;
  const isMerged = !!t.mergedIntoId;
  const dimClass = isMerged ? ' tm-row-merged' : '';

  // 상태 셀
  let statusCell = '';
  if (t.isExternal) {
    statusCell = `<span class="tm-ext-pill"><i data-lucide="lock" style="width:10px;height:10px;vertical-align:-1px"></i> 외부·${esc(t.externalSource)}</span>`;
  } else if (isMerged) {
    const target = (window.tagMasterData || []).find(function (x) {
      return x.id === t.mergedIntoId;
    });
    const targetName = target ? esc(target.name) : esc(t.mergedIntoId);
    statusCell = `<span class="tm-merged-pill">→ ${targetName}로 병합됨</span>`;
  } else if (t.vocCount === 0 && t.ruleRefCount === 0) {
    statusCell = `<span class="tm-deletable-hint">삭제 가능</span>`;
  } else {
    statusCell = `<span class="status-dot on"></span>`;
  }

  // 사용 VOC 수 강조
  const vocDisplay =
    t.vocCount === 0 ? `<span style="color:var(--text-quaternary)">0</span>` : `${t.vocCount}`;

  // 마지막 사용일
  const lastUsed = t.lastUsedAt
    ? esc(t.lastUsedAt)
    : `<span style="color:var(--text-quaternary)">—</span>`;

  // 작업 버튼 — H1: external rows show lock text only (no action buttons)
  let actionCell = '';
  if (isMerged) {
    actionCell = `<span style="color:var(--text-quaternary);font-size:12px">(병합됨)</span>`;
  } else if (t.isExternal) {
    actionCell = `<span style="color:var(--text-quaternary);font-size:12px">(외부 잠금)</span>`;
  } else {
    actionCell = `
      <button type="button" class="a-btn" onclick="openTmEditModal('${esc(t.id)}')">편집</button>
      <button type="button" class="a-btn" onclick="openMergeModal('${esc(t.id)}')">병합</button>
      <button type="button" class="a-btn danger" onclick="deleteTag('${esc(t.id)}')">삭제</button>`;
  }

  return `<tr class="tm-row${dimClass}" data-id="${esc(t.id)}">
    <td><span style="font-family:var(--font-ui);font-weight:500">${esc(t.name)}</span></td>
    <td><code style="font-family:var(--font-mono);font-size:12px;color:var(--text-secondary)">${esc(t.slug)}</code></td>
    <td><span class="tm-kind-badge">${esc(t.kind)}</span></td>
    <td style="text-align:right">${vocDisplay}</td>
    <td>${lastUsed}</td>
    <td>${statusCell}</td>
    <td style="text-align:right;white-space:nowrap">${actionCell}</td>
  </tr>`;
}

// ── Main render
function renderTagMaster() {
  const tbody = document.getElementById('tmBody');
  const countBadge = document.getElementById('tmCount');
  if (!tbody) return;
  const rows = tmFilteredRows();
  // M4: empty state §13.11 pattern (icon + headline, min-height 220px)
  tbody.innerHTML = rows.length
    ? rows.map(renderTagRow).join('')
    : `<tr><td colspan="7"><div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:220px;gap:10px"><i data-lucide="search-x" style="width:32px;height:32px;color:var(--text-quaternary)"></i><span style="font-size:13.5px;color:var(--text-secondary)">검색 결과가 없습니다.</span></div></td></tr>`;
  if (countBadge) countBadge.textContent = rows.length + '건';
  if (window.lucide) lucide.createIcons();
  // H7: ensure segment .active class matches module state on re-entry
  document.querySelectorAll('.tm-seg-btn').forEach(function (btn) {
    btn.classList.toggle('active', btn.dataset.filter === tmFilter);
  });
}

// ── Filter sync
function syncTmFilter(filter) {
  if (filter !== undefined) tmFilter = filter;
  tmQuery = (document.getElementById('tmSearch')?.value || '').trim().toLowerCase();
  renderTagMaster();
}

// ── Delete
function deleteTag(id) {
  const t = (window.tagMasterData || []).find(function (x) {
    return x.id === id;
  });
  if (!t) return;
  if (t.isExternal) {
    // H2: distinct message per action
    showTmToast('외부 마스터 태그는 삭제할 수 없습니다.', 'warn');
    return;
  }
  if (t.vocCount > 0) {
    showTmToast(
      'VOC에 부착된 태그는 삭제할 수 없습니다. 병합 또는 부착 해제 후 다시 시도하세요.',
      'warn',
    );
    return;
  }
  if (t.ruleRefCount > 0) {
    showTmToast('태그 규칙에서 사용 중입니다.', 'warn');
    return;
  }
  window.tagMasterData = (window.tagMasterData || []).filter(function (x) {
    return x.id !== id;
  });
  showTmToast('태그 삭제 (mock)', 'ok');
  // Note: confirmation dialog deferred to future work
  renderTagMaster();
}

// ── Suspend rule demo (H4: toggles state + updates callout DOM)
function suspendRule() {
  window.tmSuspended = !window.tmSuspended;
  const c = document.getElementById('tmRuleCallout');
  if (!c) return;
  const on = window.tmSuspended;
  c.style.background = on ? 'var(--status-purple-bg)' : 'var(--status-amber-bg)';
  c.style.borderColor = on ? 'var(--status-purple-border)' : 'var(--status-amber-border)';
  c.querySelector('[data-lucide]').style.color = on
    ? 'var(--status-purple)'
    : 'var(--status-amber)';
  c.querySelector('span').textContent = on
    ? 'tag_rules 일시중지 중 (해제하려면 다시 클릭) — '
    : 'tag_rules 운영 일시중지 (Admin) — ';
  showTmToast(
    on
      ? 'tag_rules 일시중지 활성화 (mock, suspended_until=+24h)'
      : 'tag_rules 일시중지 해제 (mock)',
    on ? 'warn' : 'ok',
  );
}

// ── Export
window.AdminTagMaster = {
  render: renderTagMaster,
  init: function () {
    /* one-time wiring reserved for future use */
  },
};

// ── Global function exposure (called from inline HTML onclick)
// Modal functions (openTmAddModal, confirmTmAdd, openTmEditModal, confirmTmEdit,
// openMergeModal, confirmMerge, closeTmModal) are exposed by admin-tag-master-modals.js
window.syncTmFilter = syncTmFilter;
window.deleteTag = deleteTag;
window.suspendRule = suspendRule;
window.renderTagMaster = renderTagMaster;
