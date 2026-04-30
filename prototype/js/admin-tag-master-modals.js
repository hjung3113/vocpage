// Stage B-6 P-7 D22 — Tag Master modal builders (split from admin-tag-master.js)
// Depends on: dom-utils.js (escHtml, showToast), modal.js (#modalBg),
//             admin-tag-master-data.js (window.tagMasterData),
//             admin-tag-master.js (window.renderTagMaster)

(function (global) {
  // ── Toast wrapper (reuses global showToast)
  function showTmToast(msg, kind) {
    if (typeof global.showToast === 'function') global.showToast(msg, kind);
  }

  // ── Modal close helper (C2: uses classList.remove matching modal.js pattern)
  function closeTmModal() {
    var bg = document.getElementById('modalBg');
    if (!bg) return;
    bg.classList.remove('open');
    bg.dataset.mode = '';
  }

  // ── Add modal
  function openTmAddModal() {
    var bg = document.getElementById('modalBg');
    if (!bg) return;
    bg.dataset.mode = 'tm-add';
    bg.innerHTML =
      '<div class="modal" role="dialog" aria-modal="true" aria-label="태그 추가">' +
      '<div class="modal-header"><span class="modal-title">태그 추가</span><button type="button" class="icon-btn" onclick="closeTmModal()" aria-label="닫기"><i data-lucide="x"></i></button></div>' +
      '<div class="modal-body">' +
      '<div class="tm-form-row"><label class="tm-form-label" for="tmAddName">태그명 <span style="color:var(--status-red)">*</span></label><input id="tmAddName" class="form-input" placeholder="태그명 입력" autocomplete="off" /></div>' +
      '<div class="tm-form-row"><label class="tm-form-label" for="tmAddKind">kind</label><select id="tmAddKind" class="form-select"><option value="general">general</option><option value="menu">menu</option></select></div>' +
      '</div>' +
      '<div class="modal-footer"><button type="button" class="a-btn" onclick="closeTmModal()">취소</button><button type="button" class="a-btn primary" onclick="confirmTmAdd()">추가</button></div>' +
      '</div>';
    bg.classList.add('open');
    if (global.lucide) lucide.createIcons();
    setTimeout(function () {
      document.getElementById('tmAddName')?.focus();
    }, 80);
  }

  function confirmTmAdd() {
    var name = (document.getElementById('tmAddName')?.value || '').trim();
    if (!name) {
      showTmToast('태그명을 입력하세요.', 'warn');
      return;
    }
    var kind = document.getElementById('tmAddKind')?.value || 'general';
    // M3: simplified slug generation (BE 자동 생성, mock 단순화)
    var slug = name.toLowerCase().replace(/\s+/g, '-');
    var newTag = {
      id: 'tg' + Date.now(),
      name: name,
      slug: slug,
      kind: kind,
      isExternal: false,
      externalSource: null,
      vocCount: 0,
      lastUsedAt: null,
      mergedIntoId: null,
      ruleRefCount: 0,
    };
    (global.tagMasterData || []).unshift(newTag);
    closeTmModal();
    showTmToast('태그 추가됨 (mock)', 'ok');
    if (typeof global.renderTagMaster === 'function') global.renderTagMaster();
  }

  // ── Edit modal (kind disabled)
  function openTmEditModal(id) {
    var t = (global.tagMasterData || []).find(function (x) {
      return x.id === id;
    });
    if (!t) return;
    if (t.isExternal) {
      // H2: distinct message per action
      showTmToast('외부 마스터 태그는 편집할 수 없습니다.', 'warn');
      return;
    }
    global._tmEditingId = id;
    var esc = global.escHtml;
    var bg = document.getElementById('modalBg');
    if (!bg) return;
    bg.dataset.mode = 'tm-edit';
    bg.innerHTML =
      '<div class="modal" role="dialog" aria-modal="true" aria-label="태그 편집">' +
      '<div class="modal-header"><span class="modal-title">태그 편집</span><button type="button" class="icon-btn" onclick="closeTmModal()" aria-label="닫기"><i data-lucide="x"></i></button></div>' +
      '<div class="modal-body">' +
      '<div class="tm-form-row"><label class="tm-form-label" for="tmEditName">태그명</label><input id="tmEditName" class="form-input" value="' +
      esc(t.name) +
      '" autocomplete="off" /></div>' +
      '<div class="tm-form-row"><label class="tm-form-label" for="tmEditSlug">슬러그 <span style="font-size:11px;color:var(--text-tertiary)">(읽기전용)</span></label><input id="tmEditSlug" class="form-input" value="' +
      esc(t.slug) +
      '" readonly style="opacity:0.6;cursor:not-allowed" /></div>' +
      '<div class="tm-form-row"><label class="tm-form-label" for="tmEditKind">kind <span style="font-size:11px;color:var(--text-tertiary)">(변경 불가)</span></label><select id="tmEditKind" class="form-select" disabled title="kind는 변경할 수 없습니다" style="opacity:0.6;cursor:not-allowed"><option value="general"' +
      (t.kind === 'general' ? ' selected' : '') +
      '>general</option><option value="menu"' +
      (t.kind === 'menu' ? ' selected' : '') +
      '>menu</option></select></div>' +
      '</div>' +
      '<div class="modal-footer"><button type="button" class="a-btn" onclick="closeTmModal()">취소</button><button type="button" class="a-btn primary" onclick="confirmTmEdit()">저장</button></div>' +
      '</div>';
    bg.classList.add('open');
    if (global.lucide) lucide.createIcons();
    setTimeout(function () {
      document.getElementById('tmEditName')?.focus();
    }, 80);
  }

  function confirmTmEdit() {
    var name = (document.getElementById('tmEditName')?.value || '').trim();
    if (!name) {
      showTmToast('태그명을 입력하세요.', 'warn');
      return;
    }
    var t = (global.tagMasterData || []).find(function (x) {
      return x.id === global._tmEditingId;
    });
    if (t) t.name = name;
    closeTmModal();
    showTmToast('태그 수정됨 (mock)', 'ok');
    if (typeof global.renderTagMaster === 'function') global.renderTagMaster();
  }

  // ── Merge modal
  function openMergeModal(sourceId) {
    var src = (global.tagMasterData || []).find(function (x) {
      return x.id === sourceId;
    });
    if (!src) return;
    if (src.isExternal) {
      // H2: distinct message per action
      showTmToast('외부 마스터 태그는 병합할 수 없습니다.', 'warn');
      return;
    }
    global._tmMergeSourceId = sourceId;
    var esc = global.escHtml;
    var targets = (global.tagMasterData || []).filter(function (t) {
      return t.id !== sourceId && !t.isExternal && !t.mergedIntoId && t.kind === src.kind;
    });
    var opts = targets
      .map(function (t) {
        return '<option value="' + esc(t.id) + '">' + esc(t.name) + '</option>';
      })
      .join('');
    var bg = document.getElementById('modalBg');
    if (!bg) return;
    bg.dataset.mode = 'tm-merge';
    bg.innerHTML =
      '<div class="modal" role="dialog" aria-modal="true" aria-label="태그 병합">' +
      '<div class="modal-header"><span class="modal-title">태그 병합</span><button type="button" class="icon-btn" onclick="closeTmModal()" aria-label="닫기"><i data-lucide="x"></i></button></div>' +
      '<div class="modal-body">' +
      '<div class="tm-form-row"><label class="tm-form-label">병합 소스</label><input class="form-input" value="' +
      esc(src.name) +
      '" readonly style="opacity:0.7;cursor:not-allowed" /></div>' +
      '<div class="tm-form-row"><label class="tm-form-label" for="tmMergeTarget">병합 대상 <span style="color:var(--status-red)">*</span></label><select id="tmMergeTarget" class="form-select">' +
      (opts || '<option value="">대상 없음</option>') +
      '</select></div>' +
      '<p style="font-size:12px;color:var(--text-tertiary);margin:8px 0 0">소스의 VOC 부착이 대상으로 재배선됩니다. 소스는 목록에서 숨겨집니다.</p>' +
      '</div>' +
      '<div class="modal-footer"><button type="button" class="a-btn" onclick="closeTmModal()">취소</button><button type="button" class="a-btn primary" onclick="confirmMerge()"' +
      (!opts ? ' disabled' : '') +
      '>병합 실행</button></div>' +
      '</div>';
    bg.classList.add('open');
    if (global.lucide) lucide.createIcons();
  }

  function confirmMerge() {
    var targetId = document.getElementById('tmMergeTarget')?.value;
    if (!targetId) {
      showTmToast('병합 대상을 선택하세요.', 'warn');
      return;
    }
    var src = (global.tagMasterData || []).find(function (x) {
      return x.id === global._tmMergeSourceId;
    });
    var tgt = (global.tagMasterData || []).find(function (x) {
      return x.id === targetId;
    });
    if (!src || !tgt) return;
    tgt.vocCount += src.vocCount;
    src.vocCount = 0;
    src.mergedIntoId = targetId;
    closeTmModal();
    // H3: no escHtml — showToast uses textContent; H5: audit log note appended
    showTmToast(src.name + ' → ' + tgt.name + ' 병합 완료 (mock) — 감사 로그 별도 화면 예정', 'ok');
    if (typeof global.renderTagMaster === 'function') global.renderTagMaster();
  }

  // ── Expose on window (preserves onclick contracts)
  global.openTmAddModal = openTmAddModal;
  global.confirmTmAdd = confirmTmAdd;
  global.openTmEditModal = openTmEditModal;
  global.confirmTmEdit = confirmTmEdit;
  global.openMergeModal = openMergeModal;
  global.confirmMerge = confirmMerge;
  global.closeTmModal = closeTmModal;
})(window);
