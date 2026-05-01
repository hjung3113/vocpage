// ── N-07 Modal file attach (att-zone)
const MODAL_ATT_MAX = 5;
const MODAL_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
let modalAttachFiles = [];

function modalAddAttach(e) {
  if (e && e.preventDefault) e.preventDefault();
  document.getElementById('modal-file-input')?.click();
}

function modalAttDragEnter(e) {
  e.preventDefault();
  const drop = document.getElementById('modal-att-drop');
  if (drop && !drop.classList.contains('att-drop--disabled')) drop.classList.add('att-drop--over');
}
function modalAttDragOver(e) {
  e.preventDefault();
  const drop = document.getElementById('modal-att-drop');
  if (drop && !drop.classList.contains('att-drop--disabled')) drop.classList.add('att-drop--over');
}
function modalAttDragLeave(e) {
  document.getElementById('modal-att-drop')?.classList.remove('att-drop--over');
}
function modalAttDrop(e) {
  e.preventDefault();
  const drop = document.getElementById('modal-att-drop');
  if (drop) drop.classList.remove('att-drop--over');
  if (drop?.classList.contains('att-drop--disabled')) return;
  const files = Array.from(e.dataTransfer?.files || []);
  if (files.length) modalProcessFiles(files);
}

function modalProcessFiles(files) {
  const allowed = MODAL_ATT_MAX - modalAttachFiles.length;
  if (allowed <= 0) {
    if (typeof window.showAttachmentError === 'function') window.showAttachmentError('400-count');
    return;
  }
  const toAdd = files.slice(0, allowed);
  if (files.length > allowed && typeof window.showAttachmentError === 'function') {
    window.showAttachmentError('400-count');
  }
  toAdd.forEach((f) => {
    if (!MODAL_IMAGE_TYPES.includes(f.type)) {
      if (typeof window.showAttachmentError === 'function') window.showAttachmentError('415');
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      if (typeof window.showAttachmentError === 'function') window.showAttachmentError('413');
      return;
    }
    const size =
      f.size > 1024 * 1024
        ? (f.size / 1024 / 1024).toFixed(1) + ' MB'
        : Math.round(f.size / 1024) + ' KB';
    modalAttachFiles.push({ name: f.name, size });
  });
  renderModalAttach();
}

function modalFileSelected(e) {
  const files = Array.from(e.target.files || []);
  if (files.length) modalProcessFiles(files);
  e.target.value = '';
}

function renderModalAttach() {
  const grid = document.getElementById('modal-att-grid');
  const drop = document.getElementById('modal-att-drop');
  const countEl = document.getElementById('modal-att-count');
  const count = modalAttachFiles.length;
  const full = count >= MODAL_ATT_MAX;

  if (grid) {
    grid.innerHTML = modalAttachFiles
      .map(
        (f, i) => `<div class="att-item" data-idx="${i}">
        <div class="att-thumb" style="background:var(--bg-elevated)">
          <i data-lucide="image" style="width:20px;height:20px;color:var(--text-quaternary)"></i>
        </div>
        <span class="att-item-name">${window.escHtml ? window.escHtml(f.name) : f.name}</span>
        <button class="att-remove" type="button" onclick="removeModalAttach(${i})" aria-label="삭제">×</button>
      </div>`,
      )
      .join('');
    lucide.createIcons({ nodes: [grid] });
  }

  if (countEl) countEl.textContent = `${count}/${MODAL_ATT_MAX}`;

  if (drop) {
    if (full) {
      drop.classList.add('att-drop--disabled');
      drop.innerHTML = `<span style="color:var(--text-quaternary)">첨부 한도 도달 (${count}/${MODAL_ATT_MAX})</span>`;
    } else {
      drop.classList.remove('att-drop--disabled');
      drop.innerHTML =
        `이미지 드래그 또는 ` +
        `<button class="att-select-btn" type="button" onclick="modalAddAttach(event)">선택</button>` +
        ` · 5MB까지 · <span class="att-count-badge" id="modal-att-count">${count}/${MODAL_ATT_MAX}</span>`;
    }
  }
}

function removeModalAttach(i) {
  modalAttachFiles.splice(i, 1);
  renderModalAttach();
}

// ── Modal
function initModalSelects() {
  const sysEl = document.getElementById('modalSysSelect');
  const typeEl = document.getElementById('modalTypeSelect');
  if (!sysEl || !typeEl) return;
  sysEl.innerHTML =
    '<option value="">시스템 선택...</option>' +
    SYSTEMS.filter((s) => !s.archived)
      .map((s) => `<option value="${s.id}">${s.name}</option>`)
      .join('');
  typeEl.innerHTML =
    '<option value="">유형 선택...</option>' +
    VOC_TYPES.filter((t) => !t.archived)
      .map((t) => `<option value="${t.slug}">${t.name}</option>`)
      .join('');
  document.getElementById('modalMenuSelect').innerHTML =
    '<option value="">시스템 먼저 선택...</option>';
  document.getElementById('modalMenuSelect').disabled = true;
}

function onModalSysChange() {
  const sysId = document.getElementById('modalSysSelect').value;
  const menuEl = document.getElementById('modalMenuSelect');
  if (!sysId) {
    menuEl.innerHTML = '<option value="">시스템 먼저 선택...</option>';
    menuEl.disabled = true;
    return;
  }
  const sysMenus = MENUS.filter((m) => m.systemId === sysId && !m.archived);
  menuEl.innerHTML =
    '<option value="">메뉴 선택...</option>' +
    sysMenus.map((m) => `<option value="${m.id}">${m.name}</option>`).join('');
  menuEl.disabled = false;
}

// ── C-02: Priority → Due Date auto-calc in register modal ────────────────────
function onModalPriorityChange(priority) {
  const dueDateEl = document.getElementById('modalDueDate');
  if (dueDateEl && typeof window.calcDueDate === 'function') {
    dueDateEl.value = window.calcDueDate(priority);
  }
}

function openModal() {
  initModalSelects();
  // Reset modal state
  const titleEl = document.getElementById('titleInput');
  const bodyEl = document.getElementById('bodyInput');
  if (titleEl) {
    titleEl.value = '';
    titleEl.dataset.charCountAttached = '';
  }
  if (bodyEl) {
    bodyEl.value = '';
    bodyEl.dataset.charCountAttached = '';
  }
  resetAutoTags();
  refreshTags();
  modalAttachFiles = [];
  renderModalAttach();
  // C-02: set initial due_date based on default priority (medium)
  const dueDateEl = document.getElementById('modalDueDate');
  if (dueDateEl && typeof window.calcDueDate === 'function') {
    dueDateEl.value = window.calcDueDate('medium');
  }
  document.getElementById('modalBg').classList.add('open');
  setTimeout(() => {
    if (typeof window.attachCharCount === 'function') {
      window.attachCharCount(titleEl, 100);
      window.attachCharCount(bodyEl, 5000);
    }
    titleEl && titleEl.focus();
  }, 80);
}
function closeModal() {
  document.getElementById('modalBg').classList.remove('open');
}
function handleBgClick(e) {
  if (e.target === document.getElementById('modalBg')) closeModal();
}

function onTitleInput(el) {
  document.getElementById('titleCount').textContent = `${el.value.length} / 200`;
  refreshTags();
}
function onBodyInput() {
  refreshTags();
}

// ── N-01 Auto-tag suggestion ──────────────────────────────────────────────────
// KEYWORD_MAP: keyword fragment → suggested tag name
const KEYWORD_MAP = {
  키보드: 'Hardware',
  마우스: 'Hardware',
  속도: 'Performance',
  느림: 'Performance',
  타임아웃: 'Performance',
  에러: 'Bug',
  오류: 'Bug',
  실패: 'Bug',
  로그인: 'Auth',
  인증: 'Auth',
  권한: 'Auth',
  ui: 'UI/UX',
  화면: 'UI/UX',
  레이아웃: 'UI/UX',
  데이터: 'Data',
  집계: 'Data',
  차트: 'Data',
};

// Tags that have been accepted by the user (moved from suggestions to selected)
let selectedTags = new Set();

function resetAutoTags() {
  selectedTags = new Set();
}

function addSuggestedTag(tag) {
  selectedTags.add(tag);
  renderSelectedTags();
  // Re-render suggestions to remove the accepted chip
  renderSuggestions(getCurrentSuggestions());
}

function removeSelectedTag(tag) {
  selectedTags.delete(tag);
  renderSelectedTags();
  renderSuggestions(getCurrentSuggestions());
}

function getCurrentSuggestions() {
  const txt = (
    (document.getElementById('titleInput')?.value || '') +
    ' ' +
    (document.getElementById('bodyInput')?.value || '')
  ).toLowerCase();
  const matched = new Set();
  Object.entries(KEYWORD_MAP).forEach(([kw, tagName]) => {
    if (txt.includes(kw.toLowerCase()) && !selectedTags.has(tagName)) {
      matched.add(tagName);
    }
  });
  return [...matched];
}

function renderSuggestions(suggestions) {
  const row = document.getElementById('autotagRow');
  if (!row) return;
  if (suggestions.length === 0 && selectedTags.size === 0) {
    row.innerHTML =
      '<span class="at-label">자동 태그 추천:</span>' +
      '<span style="font-size:11.5px;color:var(--text-quaternary)">제목·본문 입력 시 자동으로 추천됩니다</span>';
    return;
  }
  const suggChips = suggestions
    .map(
      (t) =>
        `<button type="button" class="at-suggest-chip" onclick="addSuggestedTag(${JSON.stringify(t)})" title="클릭하여 추가">+ ${window.escHtml ? window.escHtml(t) : t}</button>`,
    )
    .join('');
  const selChips = [...selectedTags]
    .map(
      (t) =>
        `<span class="at-pill at-selected-chip">${window.escHtml ? window.escHtml(t) : t}<button type="button" class="at-remove-tag" onclick="removeSelectedTag(${JSON.stringify(t)})" aria-label="태그 제거">×</button></span>`,
    )
    .join('');
  row.innerHTML =
    '<span class="at-label">자동 태그 추천:</span>' +
    suggChips +
    (selChips ? '<span class="at-sep">선택됨:</span>' + selChips : '');
}

function renderSelectedTags() {
  renderSuggestions(getCurrentSuggestions());
}

let tagTimer;
function refreshTags() {
  clearTimeout(tagTimer);
  tagTimer = setTimeout(() => {
    renderSuggestions(getCurrentSuggestions());
  }, 300);
}
