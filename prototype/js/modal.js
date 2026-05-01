// ── Modal file attach
let modalAttachFiles = [];
function modalAddAttach(e) {
  e.preventDefault();
  document.getElementById('modal-file-input')?.click();
}
function modalFileSelected(e) {
  const files = Array.from(e.target.files || []);
  if (!files.length) return;
  files.forEach((f) => {
    const size =
      f.size > 1024 * 1024
        ? (f.size / 1024 / 1024).toFixed(1) + ' MB'
        : Math.round(f.size / 1024) + ' KB';
    modalAttachFiles.push({ name: f.name, size });
  });
  renderModalAttach();
  e.target.value = '';
}
function renderModalAttach() {
  const list = document.getElementById('modal-attach-list');
  if (!list) return;
  list.innerHTML = modalAttachFiles
    .map(
      (f, i) => `
    <div class="modal-attach-row">
      <i data-lucide="file" style="width:13px;height:13px;color:var(--accent);flex-shrink:0"></i>
      <span class="modal-attach-name">${f.name}</span>
      <span class="modal-attach-size">${f.size}</span>
      <div class="icon-btn" style="width:22px;height:22px" onclick="removeModalAttach(${i})"><i data-lucide="x" style="width:10px;height:10px"></i></div>
    </div>`,
    )
    .join('');
  lucide.createIcons({ nodes: [list] });
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
