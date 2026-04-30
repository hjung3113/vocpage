// Stage B-6 P-7 D22 — Tag Master 관리 prototype module
// Depends on: dom-utils.js (escHtml, showToast), modal.js (#modalBg), admin-tag-master-data.js
// Export: window.AdminTagMaster = { render, init }

// ── Module state
let tmFilter = 'all';
let tmQuery = '';
let tmEditingId = null;
let tmMergeSourceId = null;

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
    if (tmFilter === 'all' && t.mergedIntoId) return false; // merged 행은 전체에서 숨김
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

  // 작업 버튼
  let actionCell = '';
  if (isMerged) {
    actionCell = `<span style="color:var(--text-quaternary);font-size:12px">(병합됨)</span>`;
  } else if (t.isExternal) {
    actionCell = `<button type="button" class="a-btn" onclick="openTmEditModal('${esc(t.id)}')">편집</button>`;
  } else {
    actionCell = `
      <button type="button" class="a-btn" onclick="openTmEditModal('${esc(t.id)}')">편집</button>
      <button type="button" class="a-btn" onclick="openMergeModal('${esc(t.id)}')">병합</button>
      <button type="button" class="a-btn danger" onclick="deleteTag('${esc(t.id)}')">삭제</button>`;
  }

  return `<tr class="tm-row${dimClass}" data-id="${esc(t.id)}">
    <td><span style="font-family:var(--font-ui);font-weight:500">${esc(t.name)}</span></td>
    <td><code style="font-family:var(--font-mono);font-size:12px;color:var(--text-secondary)">${esc(t.slug)}</code></td>
    <td><span class="kw-pill">${esc(t.kind)}</span></td>
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
  tbody.innerHTML = rows.length
    ? rows.map(renderTagRow).join('')
    : `<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--text-tertiary)">검색 결과가 없습니다.</td></tr>`;
  if (countBadge) countBadge.textContent = rows.length + '건';
  if (window.lucide) lucide.createIcons();
}

// ── Filter sync
function syncTmFilter(filter) {
  if (filter !== undefined) tmFilter = filter;
  tmQuery = (document.getElementById('tmSearch')?.value || '').trim().toLowerCase();
  // toggle seg active class
  document.querySelectorAll('.tm-seg-btn').forEach(function (btn) {
    btn.classList.toggle('active', btn.dataset.filter === tmFilter);
  });
  renderTagMaster();
}

// ── Add modal
function openTmAddModal() {
  const bg = document.getElementById('modalBg');
  if (!bg) return;
  bg.dataset.mode = 'tm-add';
  bg.innerHTML = `
    <div class="modal-box" role="dialog" aria-modal="true" aria-label="태그 추가">
      <div class="modal-header"><span class="modal-title">태그 추가</span><button type="button" class="icon-btn" onclick="closeTmModal()" aria-label="닫기"><i data-lucide="x"></i></button></div>
      <div class="modal-body">
        <div class="tm-form-row"><label class="tm-form-label" for="tmAddName">태그명 <span style="color:var(--status-red)">*</span></label>
          <input id="tmAddName" class="modal-input" placeholder="태그명 입력" autocomplete="off" /></div>
        <div class="tm-form-row"><label class="tm-form-label" for="tmAddKind">kind</label>
          <select id="tmAddKind" class="modal-input"><option value="general">general</option><option value="menu">menu</option></select></div>
      </div>
      <div class="modal-footer">
        <button type="button" class="a-btn" onclick="closeTmModal()">취소</button>
        <button type="button" class="a-btn primary" onclick="confirmTmAdd()">추가</button>
      </div>
    </div>`;
  bg.classList.add('open');
  if (window.lucide) lucide.createIcons();
  setTimeout(function () {
    document.getElementById('tmAddName')?.focus();
  }, 80);
}

function confirmTmAdd() {
  const name = (document.getElementById('tmAddName')?.value || '').trim();
  if (!name) {
    showTmToast('태그명을 입력하세요.', 'warn');
    return;
  }
  const kind = document.getElementById('tmAddKind')?.value || 'general';
  const slug = name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-가-힣]/g, '');
  const newTag = {
    id: 'tg' + Date.now(),
    name,
    slug,
    kind,
    isExternal: false,
    externalSource: null,
    vocCount: 0,
    lastUsedAt: null,
    mergedIntoId: null,
    ruleRefCount: 0,
  };
  (window.tagMasterData || []).unshift(newTag);
  closeTmModal();
  showTmToast('태그 추가됨 (mock)', 'ok');
  renderTagMaster();
}

// ── Edit modal (kind disabled)
function openTmEditModal(id) {
  const t = (window.tagMasterData || []).find(function (x) {
    return x.id === id;
  });
  if (!t) return;
  if (t.isExternal) {
    showTmToast('외부 마스터 태그는 수정할 수 없습니다.', 'warn');
    return;
  }
  tmEditingId = id;
  const esc = window.escHtml;
  const bg = document.getElementById('modalBg');
  if (!bg) return;
  bg.dataset.mode = 'tm-edit';
  bg.innerHTML = `
    <div class="modal-box" role="dialog" aria-modal="true" aria-label="태그 편집">
      <div class="modal-header"><span class="modal-title">태그 편집</span><button type="button" class="icon-btn" onclick="closeTmModal()" aria-label="닫기"><i data-lucide="x"></i></button></div>
      <div class="modal-body">
        <div class="tm-form-row"><label class="tm-form-label" for="tmEditName">태그명</label>
          <input id="tmEditName" class="modal-input" value="${esc(t.name)}" autocomplete="off" /></div>
        <div class="tm-form-row"><label class="tm-form-label" for="tmEditSlug">슬러그 <span style="font-size:11px;color:var(--text-tertiary)">(읽기전용)</span></label>
          <input id="tmEditSlug" class="modal-input" value="${esc(t.slug)}" readonly style="opacity:0.6;cursor:not-allowed" /></div>
        <div class="tm-form-row"><label class="tm-form-label" for="tmEditKind">kind <span style="font-size:11px;color:var(--text-tertiary)">(변경 불가)</span></label>
          <select id="tmEditKind" class="modal-input" disabled title="kind는 변경할 수 없습니다" style="opacity:0.6;cursor:not-allowed">
            <option value="general" ${t.kind === 'general' ? 'selected' : ''}>general</option>
            <option value="menu" ${t.kind === 'menu' ? 'selected' : ''}>menu</option>
          </select></div>
      </div>
      <div class="modal-footer">
        <button type="button" class="a-btn" onclick="closeTmModal()">취소</button>
        <button type="button" class="a-btn primary" onclick="confirmTmEdit()">저장</button>
      </div>
    </div>`;
  bg.classList.add('open');
  if (window.lucide) lucide.createIcons();
  setTimeout(function () {
    document.getElementById('tmEditName')?.focus();
  }, 80);
}

function confirmTmEdit() {
  const name = (document.getElementById('tmEditName')?.value || '').trim();
  if (!name) {
    showTmToast('태그명을 입력하세요.', 'warn');
    return;
  }
  const t = (window.tagMasterData || []).find(function (x) {
    return x.id === tmEditingId;
  });
  if (t) t.name = name;
  closeTmModal();
  showTmToast('태그 수정됨 (mock)', 'ok');
  renderTagMaster();
}

// ── Merge modal
function openMergeModal(sourceId) {
  const src = (window.tagMasterData || []).find(function (x) {
    return x.id === sourceId;
  });
  if (!src) return;
  if (src.isExternal) {
    showTmToast('외부 마스터 태그는 수정할 수 없습니다.', 'warn');
    return;
  }
  tmMergeSourceId = sourceId;
  const esc = window.escHtml;
  const targets = (window.tagMasterData || []).filter(function (t) {
    return t.id !== sourceId && !t.isExternal && !t.mergedIntoId && t.kind === src.kind;
  });
  const opts = targets
    .map(function (t) {
      return `<option value="${esc(t.id)}">${esc(t.name)}</option>`;
    })
    .join('');
  const bg = document.getElementById('modalBg');
  if (!bg) return;
  bg.dataset.mode = 'tm-merge';
  bg.innerHTML = `
    <div class="modal-box" role="dialog" aria-modal="true" aria-label="태그 병합">
      <div class="modal-header"><span class="modal-title">태그 병합</span><button type="button" class="icon-btn" onclick="closeTmModal()" aria-label="닫기"><i data-lucide="x"></i></button></div>
      <div class="modal-body">
        <div class="tm-form-row"><label class="tm-form-label">병합 소스</label>
          <input class="modal-input" value="${esc(src.name)}" readonly style="opacity:0.7;cursor:not-allowed" /></div>
        <div class="tm-form-row"><label class="tm-form-label" for="tmMergeTarget">병합 대상 <span style="color:var(--status-red)">*</span></label>
          <select id="tmMergeTarget" class="modal-input">${opts || '<option value="">대상 없음</option>'}</select></div>
        <p style="font-size:12px;color:var(--text-tertiary);margin:8px 0 0">소스의 VOC 부착이 대상으로 재배선됩니다. 소스는 목록에서 숨겨집니다.</p>
      </div>
      <div class="modal-footer">
        <button type="button" class="a-btn" onclick="closeTmModal()">취소</button>
        <button type="button" class="a-btn primary" onclick="confirmMerge()" ${!opts ? 'disabled' : ''}>병합 실행</button>
      </div>
    </div>`;
  bg.classList.add('open');
  if (window.lucide) lucide.createIcons();
}

function confirmMerge() {
  const targetId = document.getElementById('tmMergeTarget')?.value;
  if (!targetId) {
    showTmToast('병합 대상을 선택하세요.', 'warn');
    return;
  }
  const src = (window.tagMasterData || []).find(function (x) {
    return x.id === tmMergeSourceId;
  });
  const tgt = (window.tagMasterData || []).find(function (x) {
    return x.id === targetId;
  });
  if (!src || !tgt) return;
  tgt.vocCount += src.vocCount;
  src.vocCount = 0;
  src.mergedIntoId = targetId;
  closeTmModal();
  showTmToast(
    window.escHtml(src.name) + ' → ' + window.escHtml(tgt.name) + ' 병합 완료 (mock)',
    'ok',
  );
  renderTagMaster();
}

// ── Delete
function deleteTag(id) {
  const t = (window.tagMasterData || []).find(function (x) {
    return x.id === id;
  });
  if (!t) return;
  if (t.isExternal) {
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
  renderTagMaster();
}

// ── Suspend rule demo
function suspendRule() {
  showTmToast('tag_rules 일시중지 (mock, suspended_until=+24h)', 'warn');
}

// ── Modal close helper
function closeTmModal() {
  const bg = document.getElementById('modalBg');
  if (!bg) return;
  bg.classList.remove('open');
  bg.dataset.mode = '';
}

// ── Export
window.AdminTagMaster = {
  render: renderTagMaster,
  init: function () {
    /* one-time wiring reserved for future use */
  },
};

// ── Global function exposure (called from inline HTML onclick)
window.syncTmFilter = syncTmFilter;
window.openTmAddModal = openTmAddModal;
window.confirmTmAdd = confirmTmAdd;
window.openTmEditModal = openTmEditModal;
window.confirmTmEdit = confirmTmEdit;
window.openMergeModal = openMergeModal;
window.confirmMerge = confirmMerge;
window.deleteTag = deleteTag;
window.suspendRule = suspendRule;
window.closeTmModal = closeTmModal;
