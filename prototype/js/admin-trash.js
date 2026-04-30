// ── P-8 Trash (Stage B-7 D23) — depends on: dom-utils.js, admin-trash-data.js, admin-trash-modals.js
let trQuery = '',
  trRange = 'all',
  trSystem = 'all';
let trSelectedIds = new Set();
let trIsAdmin = true;
let _trDeniedToastShown = false;
const TR_TODAY = new Date('2026-04-30T00:00:00');

function trDaysLeft(deletedAt) {
  return Math.round(
    (new Date(deletedAt).getTime() + 30 * 86400000 - TR_TODAY.getTime()) / 86400000,
  );
}
function trStatusLabel(s) {
  return { open: '접수', in_progress: '처리중', resolved: '완료', closed: '닫힘' }[s] || s;
}
function trFilteredData() {
  let rows = [...window.trashedVocData];
  if (trQuery) {
    const q = trQuery.toLowerCase();
    rows = rows.filter(
      (r) => r.title.toLowerCase().includes(q) || r.issueId.toLowerCase().includes(q),
    );
  }
  if (trSystem !== 'all') rows = rows.filter((r) => r.systemName === trSystem);
  if (trRange !== 'all') {
    rows = rows.filter((r) => {
      const d = trDaysLeft(r.deletedAt);
      if (trRange === 'today') return d >= 29;
      if (trRange === '7d') return d >= 23;
      if (trRange === '30d') return d >= 0;
      if (trRange === 'overdue') return d < 0;
      return true;
    });
  }
  return rows;
}
function trBuildSystemOptions() {
  const sel = document.getElementById('trSystem');
  if (!sel) return;
  const seen = new Set();
  const opts = ['<option value="all">전체 시스템</option>'];
  (window.trashedVocData || []).forEach((r) => {
    if (!seen.has(r.systemName)) {
      seen.add(r.systemName);
      opts.push(`<option value="${escHtml(r.systemName)}">${escHtml(r.systemName)}</option>`);
    }
  });
  sel.innerHTML = opts.join('');
  sel.value = trSystem; // restore selected state
}
function renderTrash() {
  const trBg = document.getElementById('trConfirmBg');
  if (trBg && trBg.classList.contains('open')) {
    trBg.classList.remove('open');
    trBg.hidden = true;
  }
  const denied = document.getElementById('trDenied');
  const table = document.getElementById('trTable');
  const toolbar = document.querySelector('.tr-toolbar');
  const bulkBar = document.getElementById('trBulkBar');
  const callout = document.getElementById('trInfoCallout');
  const auditWrap = document.getElementById('trAuditWrap');
  if (!trIsAdmin) {
    if (denied) denied.hidden = false;
    if (table) table.hidden = true;
    if (toolbar) toolbar.hidden = true;
    if (bulkBar) bulkBar.hidden = true;
    if (callout) callout.hidden = true;
    if (auditWrap) auditWrap.hidden = true;
    document.getElementById('trCount').textContent = '';
    if (!_trDeniedToastShown) {
      _trDeniedToastShown = true;
      showToast('Admin 권한이 필요합니다.', 'warn');
    }
    lucide.createIcons();
    return;
  }
  if (denied) denied.hidden = true;
  if (table) table.hidden = false;
  if (toolbar) toolbar.hidden = false;
  if (callout) callout.hidden = false;
  if (auditWrap) auditWrap.hidden = false;
  trBuildSystemOptions();
  const rows = trFilteredData();
  document.getElementById('trCount').textContent = rows.length + '건';
  const tbody = document.getElementById('trBody');
  if (!tbody) return;
  if (rows.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10" class="tr-empty-cell"><div class="tr-empty-state"><i data-lucide="inbox" class="tr-empty-icon"></i><span class="tr-empty-msg">검색 결과가 없습니다.</span></div></td></tr>`;
    document.getElementById('trSelectAll').checked = false;
    updateBulkBar();
    renderAuditLog();
    lucide.createIcons();
    return;
  }
  tbody.innerHTML = rows.map(buildRow).join('');
  syncCheckboxStates();
  updateBulkBar();
  renderAuditLog();
  lucide.createIcons();
}
function buildRow(r) {
  const days = trDaysLeft(r.deletedAt);
  let rowCls = 'tr-row',
    daysCls = 'tr-days-cell',
    daysHtml = '';
  if (days < 0) {
    rowCls += ' tr-row-expired';
    daysCls += ' tr-days-expired';
    daysHtml = `<i data-lucide="alert-circle" class="tr-day-icon"></i> D${days}`;
  } else if (days <= 3) {
    rowCls += ' tr-row-soon';
    daysCls += ' tr-days-soon';
    daysHtml = `<i data-lucide="clock" class="tr-day-icon"></i> D-${days}`;
  } else {
    daysHtml = `D-${days}`;
  }
  const checked = trSelectedIds.has(r.id) ? 'checked' : '';
  const roleBadge =
    r.deletedByRole === 'admin'
      ? `<span class="tr-role-badge tr-role-admin">Admin</span>`
      : `<span class="tr-role-badge tr-role-manager">Mgr</span>`;
  const attachNote =
    r.attachmentCount > 0 ? ` <span class="tr-attach-note">(첨부 ${r.attachmentCount})</span>` : '';
  const id = escHtml(r.id);
  return `<tr class="${rowCls}" id="tr-row-${id}"><td><input type="checkbox" ${checked} onchange="toggleTrRow('${id}')" aria-label="선택" /></td><td class="tr-mono">${escHtml(r.issueId)}</td><td class="tr-title-cell">${escHtml(r.title)}${attachNote}</td><td>${escHtml(trStatusLabel(r.status))}</td><td>${escHtml(r.systemName)} / ${escHtml(r.menuName)}</td><td>${escHtml(r.deletedByName)} ${roleBadge}</td><td>${escHtml(r.originalAssignee)}</td><td class="tr-mono">${escHtml(r.deletedAt.slice(0, 10))}</td><td class="${daysCls}">${daysHtml}</td><td class="tr-action-cell"><button type="button" class="a-btn primary" onclick="restoreVoc('${id}')">복원</button> <button type="button" class="a-btn danger" onclick="purgeVoc('${id}')">영구삭제</button></td></tr>`;
}
function syncTrFilter() {
  trQuery = (document.getElementById('trSearch') || {}).value || '';
  trRange = (document.getElementById('trRange') || {}).value || 'all';
  trSystem = (document.getElementById('trSystem') || {}).value || 'all';
  trSelectedIds.clear();
  renderTrash();
}
function toggleSelectAll(cb) {
  const rows = trFilteredData();
  rows.forEach((r) => (cb.checked ? trSelectedIds.add(r.id) : trSelectedIds.delete(r.id)));
  syncCheckboxStates();
  updateBulkBar();
}
function toggleTrRow(id) {
  trSelectedIds.has(id) ? trSelectedIds.delete(id) : trSelectedIds.add(id);
  syncCheckboxStates();
  updateBulkBar();
}
function syncCheckboxStates() {
  const rows = trFilteredData();
  rows.forEach((r) => {
    const cb = document.querySelector(`#tr-row-${r.id} input[type=checkbox]`);
    if (cb) cb.checked = trSelectedIds.has(r.id);
  });
  const allCb = document.getElementById('trSelectAll');
  if (allCb && rows.length > 0) {
    allCb.checked = rows.every((r) => trSelectedIds.has(r.id));
    allCb.indeterminate = !allCb.checked && rows.some((r) => trSelectedIds.has(r.id));
  }
}
function updateBulkBar() {
  const bar = document.getElementById('trBulkBar');
  const countEl = document.getElementById('trSelectedCount');
  if (!bar) return;
  bar.hidden = trSelectedIds.size === 0;
  if (countEl) countEl.textContent = trSelectedIds.size;
}
function clearTrSelection() {
  trSelectedIds.clear();
  syncCheckboxStates();
  updateBulkBar();
}
// openTrConfirm / closeTrConfirm defined in admin-trash-modals.js
function _removeVocById(id) {
  const idx = window.trashedVocData.findIndex((r) => r.id === id);
  if (idx !== -1) window.trashedVocData.splice(idx, 1);
  trSelectedIds.delete(id);
}
function restoreVoc(id) {
  const row = window.trashedVocData.find((r) => r.id === id);
  if (!row) return;
  openTrConfirm({
    title: '복원 확인',
    bodyHtml: `<p>${escHtml(row.issueId)} — ${escHtml(row.title)}<br>를 복원하시겠습니까?</p>`,
    confirmLabel: '복원',
    danger: false,
    onConfirm() {
      window.vocRestoreLog.unshift({
        actor: '김관리',
        action: 'restore',
        vocId: row.issueId,
        at: new Date().toISOString(),
      });
      _removeVocById(id);
      renderTrash();
      showToast('복원되었습니다 (tag_rules 재실행 mock)', 'ok');
    },
  });
}
function purgeVoc(id) {
  const row = window.trashedVocData.find((r) => r.id === id);
  if (!row) return;
  openTrConfirm({
    title: '영구삭제 확인',
    bodyHtml: `<p>${escHtml(row.issueId)} — ${escHtml(row.title)}<br>를 영구 삭제하시겠습니까?</p><p class="tr-danger-warn">되돌릴 수 없습니다.</p>`,
    confirmLabel: '영구삭제',
    danger: true,
    onConfirm() {
      window.vocRestoreLog.unshift({
        actor: '김관리',
        action: 'purge',
        vocId: row.issueId,
        at: new Date().toISOString(),
      });
      _removeVocById(id);
      renderTrash();
      showToast('영구 삭제 (mock)', 'warn');
    },
  });
}
function restoreSelected() {
  const ids = [...trSelectedIds];
  if (!ids.length) return;
  openTrConfirm({
    title: '일괄 복원 확인',
    bodyHtml: `<p>${ids.length}건을 복원하시겠습니까?</p>`,
    confirmLabel: `${ids.length}건 복원`,
    danger: false,
    onConfirm() {
      ids.forEach((id) => {
        const row = window.trashedVocData.find((r) => r.id === id);
        if (row)
          window.vocRestoreLog.unshift({
            actor: '김관리',
            action: 'restore',
            vocId: row.issueId,
            at: new Date().toISOString(),
          });
        _removeVocById(id);
      });
      renderTrash();
      showToast(`${ids.length}건 복원됨 (mock)`, 'ok');
    },
  });
}
function purgeSelected() {
  const ids = [...trSelectedIds];
  if (!ids.length) return;
  openTrConfirm({
    title: '일괄 영구삭제 확인',
    bodyHtml: `<p>${ids.length}건을 영구 삭제하시겠습니까?</p><p class="tr-danger-warn">되돌릴 수 없습니다.</p>`,
    confirmLabel: `${ids.length}건 영구삭제`,
    danger: true,
    onConfirm() {
      ids.forEach((id) => {
        const row = window.trashedVocData.find((r) => r.id === id);
        if (row)
          window.vocRestoreLog.unshift({
            actor: '김관리',
            action: 'purge',
            vocId: row.issueId,
            at: new Date().toISOString(),
          });
        _removeVocById(id);
      });
      renderTrash();
      showToast(`${ids.length}건 영구삭제 (mock)`, 'warn');
    },
  });
}
function trTogglePersona() {
  trIsAdmin = !trIsAdmin;
  _trDeniedToastShown = false;
  const btn = document.getElementById('trPersonaBtn');
  if (btn) btn.textContent = trIsAdmin ? '👤 Admin 모드' : '👤 User 모드';
  renderTrash();
}
function renderAuditLog() {
  const el = document.getElementById('trAuditList');
  if (!el) return;
  const log = window.vocRestoreLog || [];
  if (!log.length) {
    el.innerHTML = '<p class="tr-audit-empty">이력 없음</p>';
    return;
  }
  const l = log[0];
  const act = l.action === 'restore' ? '복원' : '영구삭제';
  el.innerHTML = `<div class="tr-audit-row"><span class="tr-mono">${escHtml(l.at.slice(0, 16).replace('T', ' '))}</span> <span class="tr-audit-actor">${escHtml(l.actor)}</span> <span class="tr-audit-action">${escHtml(act)}</span> <span class="tr-mono">${escHtml(l.vocId)}</span></div>`;
}
window.AdminTrash = { render: renderTrash };
window.syncTrFilter = syncTrFilter;
window.toggleSelectAll = toggleSelectAll;
window.toggleTrRow = toggleTrRow;
window.clearTrSelection = clearTrSelection;
window.restoreVoc = restoreVoc;
window.purgeVoc = purgeVoc;
window.restoreSelected = restoreSelected;
window.purgeSelected = purgeSelected;
window.trTogglePersona = trTogglePersona;
