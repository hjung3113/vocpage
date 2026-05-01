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

const RULES = [
  { kw: ['집계', '수집', '스트리밍', '파이프라인', '인덱스', '중복'], tag: '데이터수집' },
  { kw: ['차트', '그래프', '통계', '분석', '시각화'], tag: '데이터분석' },
  { kw: ['etl', '배치', '파이프라인', '스케줄'], tag: 'ETL' },
  { kw: ['타임아웃', '만료', '에러', '오류', '실패', '500'], tag: '오류' },
  { kw: ['대시보드', 'kpi', '위젯', '보고서'], tag: '대시보드' },
  { kw: ['이메일', '메일', 'smtp', '알림'], tag: '이메일' },
];
let tagTimer;
function refreshTags() {
  clearTimeout(tagTimer);
  tagTimer = setTimeout(() => {
    const txt = (
      (document.getElementById('titleInput').value || '') +
      ' ' +
      (document.getElementById('bodyInput').value || '')
    ).toLowerCase();
    const matched = [
      ...new Set(RULES.filter((r) => r.kw.some((k) => txt.includes(k))).map((r) => r.tag)),
    ];
    const row = document.getElementById('autotagRow');
    row.innerHTML = matched.length
      ? '<span class="at-label">자동 태그 추천:</span>' +
        matched.map((t) => `<span class="at-pill"># ${t}</span>`).join('')
      : '<span class="at-label">자동 태그 추천:</span><span style="font-size:11.5px;color:var(--text-quaternary)">제목·본문 입력 시 자동으로 추천됩니다</span>';
  }, 280);
}
