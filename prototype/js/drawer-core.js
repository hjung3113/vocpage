// ── Attach store (runtime, keyed by voc id)
const attachStore = {
  voc1: [
    { name: 'AD_오류_스크린샷.png', size: '284 KB', icon: 'image' },
    { name: '세션_로그_2025-06-14.txt', size: '12 KB', icon: 'file-text' },
  ],
  voc8: [{ name: 'spark_oom_stacktrace.log', size: '48 KB', icon: 'file-text' }],
};
let newSubCounter = 100;

function attachItemHTML(vocId, f, idx) {
  return `<div class="attach-item" data-idx="${idx}">
    <div class="attach-icon"><i data-lucide="${f.icon || 'file'}" style="width:13px;height:13px"></i></div>
    <span class="attach-name">${f.name}</span>
    <span class="attach-size">${f.size}</span>
    <div class="icon-btn" style="width:24px;height:24px" data-tip="삭제" onclick="removeAttach('${vocId}',${idx})">
      <i data-lucide="x" style="width:11px;height:11px"></i>
    </div>
  </div>`;
}

function buildSubsSection(d) {
  const subs = (d.subs || []).map((sid) => SUBDATA[sid]).filter(Boolean);
  const subsHTML = subs
    .map(
      (s) => `
    <div class="sub-row" onclick="openDrawer('${s.id}')">
      ${statusHTML(s.status)}
      <span class="sub-row-title">${s.title}</span>
      <div class="mini-av ${s.assigneeCls || ''}" style="width:20px;height:20px;font-size:9px;flex-shrink:0">${s.assigneeInit || '—'}</div>
    </div>`,
    )
    .join('');
  const isSubtask = !!d.parentId;
  const addBlock = isSubtask
    ? `<div class="sub-add-row" style="color:var(--text-quaternary);cursor:not-allowed;opacity:.7" data-tip="Sub-task 아래에는 추가할 수 없습니다 (최대 1레벨)">
         <i data-lucide="ban" style="width:13px;height:13px"></i> 서브태스크 추가 불가 (최대 1레벨)
       </div>`
    : `<div class="sub-add-row" id="sub-add-row-${d.id}" onclick="showSubForm('${d.id}')">
         <i data-lucide="plus" style="width:13px;height:13px"></i> 서브태스크 추가
       </div>
       <div class="sub-inline-form" id="sub-form-${d.id}" style="display:none">
         <input class="sub-inline-input" id="sub-input-${d.id}" placeholder="서브태스크 제목 입력..."
                onkeydown="subKeydown(event,'${d.id}')" />
         <select id="subtaskTypeSelect-${d.id}" class="form-select" style="width:120px;flex-shrink:0">
           ${VOC_TYPES.map((t) => `<option value="${t.slug}">${t.name}</option>`).join('')}
         </select>
         <button class="btn-primary" style="padding:5px 11px;font-size:12px;white-space:nowrap" onclick="confirmSub('${d.id}')">
           <i data-lucide="check" style="width:11px;height:11px"></i>
         </button>
         <button class="btn-ghost" style="padding:5px 10px;font-size:12px" onclick="cancelSub('${d.id}')">취소</button>
       </div>`;
  return `
    <div class="d-subtasks">
      <div class="d-section-title" style="display:flex;align-items:center;gap:6px">
        서브태스크<span style="font-size:10.5px;color:var(--text-quaternary);font-weight:400;text-transform:none">${subs.length}개</span>
      </div>
      <div class="subtask-list" id="sub-list-${d.id}">${subsHTML}</div>
      ${addBlock}
    </div>`;
}

// N-07: Mock demo thumbnails (data URIs for 5 sample images)
const MOCK_THUMB_COLORS = [
  'var(--brand-bg)',
  'var(--status-green-bg)',
  'var(--status-amber-bg)',
  'var(--status-purple-bg)',
  'var(--status-red-bg)',
];
const MOCK_THUMBS = [
  { name: 'screenshot_01.png', size: '284 KB', mockColor: MOCK_THUMB_COLORS[0] },
  { name: 'error_log_capture.png', size: '156 KB', mockColor: MOCK_THUMB_COLORS[1] },
  { name: 'ui_glitch.png', size: '412 KB', mockColor: MOCK_THUMB_COLORS[2] },
  { name: 'network_trace.png', size: '98 KB', mockColor: MOCK_THUMB_COLORS[3] },
  { name: 'console_output.png', size: '203 KB', mockColor: MOCK_THUMB_COLORS[4] },
];
const ATT_MAX = 5;

// Seed demo attachments for voc1 with mock thumbnails
if (!attachStore['voc1'] || attachStore['voc1'].length < 2) {
  attachStore['voc1'] = MOCK_THUMBS.slice(0, 2).map((t) => ({ ...t, icon: 'image' }));
}

function attThumbHTML(f, idx, vocId) {
  const bg = f.mockColor || 'var(--bg-elevated)';
  const safeName = window.escHtml ? window.escHtml(f.name) : f.name;
  return `<div class="att-item" data-idx="${idx}">
    <div class="att-thumb" style="background:${bg}" title="${safeName}">
      <i data-lucide="image" style="width:20px;height:20px;color:var(--text-quaternary)"></i>
    </div>
    <span class="att-item-name">${safeName}</span>
    <button class="att-remove" type="button" onclick="removeAttach('${vocId}',${idx})" aria-label="삭제">×</button>
  </div>`;
}

function buildAttachSection(d) {
  const files = attachStore[d.id] || [];
  const count = files.length;
  const full = count >= ATT_MAX;
  const gridHTML = files.map((f, i) => attThumbHTML(f, i, d.id)).join('');
  const dropDisabledClass = full ? ' att-drop--disabled' : '';
  const dropText = full
    ? `<span style="color:var(--text-quaternary)">첨부 한도 도달 (${count}/${ATT_MAX})</span>`
    : `이미지 드래그 또는 <button class="att-select-btn" type="button" onclick="drawerAddAttach('${d.id}')">선택</button> · 10MB까지 · <span class="att-count-badge">${count}/${ATT_MAX}</span>`;

  return `
    <div class="d-attachments">
      <div class="d-section-title" style="display:flex;align-items:center;gap:6px">
        첨부파일<span style="font-size:10.5px;color:var(--text-quaternary);font-weight:400;text-transform:none">${count}개</span>
      </div>
      <div class="att-zone" id="att-zone-${d.id}" data-voc-id="${d.id}">
        <input type="file" id="attach-input-${d.id}" multiple
          accept="image/png,image/jpeg,image/gif,image/webp"
          style="display:none" onchange="drawerFileSelected(event,'${d.id}')">
        <div class="att-drop${dropDisabledClass}" id="att-drop-${d.id}"
          ondragenter="attDragEnter(event,'${d.id}')"
          ondragover="attDragOver(event,'${d.id}')"
          ondragleave="attDragLeave(event,'${d.id}')"
          ondrop="attDrop(event,'${d.id}')">
          ${dropText}
        </div>
        <div class="att-grid" id="att-grid-${d.id}">${gridHTML}</div>
      </div>
    </div>`;
}

// ── N-07 Drag & Drop handlers ─────────────────────────────────────────────────
function attDragEnter(e, vocId) {
  e.preventDefault();
  const drop = document.getElementById('att-drop-' + vocId);
  if (drop && !drop.classList.contains('att-drop--disabled')) drop.classList.add('att-drop--over');
}
function attDragOver(e, vocId) {
  e.preventDefault();
  const drop = document.getElementById('att-drop-' + vocId);
  if (drop && !drop.classList.contains('att-drop--disabled')) drop.classList.add('att-drop--over');
}
function attDragLeave(e, vocId) {
  const drop = document.getElementById('att-drop-' + vocId);
  if (drop) drop.classList.remove('att-drop--over');
}
function attDrop(e, vocId) {
  e.preventDefault();
  const drop = document.getElementById('att-drop-' + vocId);
  if (drop) drop.classList.remove('att-drop--over');
  if (drop && drop.classList.contains('att-drop--disabled')) return;

  const files = Array.from(e.dataTransfer?.files || []);
  if (!files.length) return;
  processAttachFiles(files, vocId);
}

function processAttachFiles(files, vocId) {
  if (!attachStore[vocId]) attachStore[vocId] = [];
  const current = attachStore[vocId].length;
  const allowed = ATT_MAX - current;

  if (allowed <= 0) {
    if (typeof window.showAttachmentError === 'function') window.showAttachmentError('400-count');
    return;
  }

  const imageTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
  const toAdd = files.slice(0, allowed);
  const skipped = files.length - toAdd.length;

  toAdd.forEach((f) => {
    if (!imageTypes.includes(f.type)) {
      if (typeof window.showAttachmentError === 'function') window.showAttachmentError('415');
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      if (typeof window.showAttachmentError === 'function') window.showAttachmentError('413');
      return;
    }
    const size =
      f.size > 1024 * 1024
        ? (f.size / 1024 / 1024).toFixed(1) + ' MB'
        : Math.round(f.size / 1024) + ' KB';
    attachStore[vocId].push({ name: f.name, size, icon: 'image' });
  });

  if (skipped > 0 || current + toAdd.length > ATT_MAX) {
    if (typeof window.showAttachmentError === 'function') window.showAttachmentError('400-count');
  }

  refreshAttZone(vocId);
}

function refreshAttZone(vocId) {
  const files = attachStore[vocId] || [];
  const count = files.length;
  const full = count >= ATT_MAX;
  const grid = document.getElementById('att-grid-' + vocId);
  const drop = document.getElementById('att-drop-' + vocId);
  const section = grid?.closest('.d-attachments');
  const titleSpan = section?.querySelector('.d-section-title span');

  if (grid) grid.innerHTML = files.map((f, i) => attThumbHTML(f, i, vocId)).join('');
  if (titleSpan) titleSpan.textContent = count + '개';

  if (drop) {
    if (full) {
      drop.classList.add('att-drop--disabled');
      drop.innerHTML = `<span style="color:var(--text-quaternary)">첨부 한도 도달 (${count}/${ATT_MAX})</span>`;
    } else {
      drop.classList.remove('att-drop--disabled');
      drop.innerHTML = `이미지 드래그 또는 <button class="att-select-btn" type="button" onclick="drawerAddAttach('${vocId}')">선택</button> · 10MB까지 · <span class="att-count-badge">${count}/${ATT_MAX}</span>`;
    }
  }
  lucide.createIcons({ nodes: [grid, drop].filter(Boolean) });
}

// ── Subtask interactions
function showSubForm(vocId) {
  document.getElementById('sub-add-row-' + vocId).style.display = 'none';
  const form = document.getElementById('sub-form-' + vocId);
  form.style.display = 'flex';
  setTimeout(() => document.getElementById('sub-input-' + vocId)?.focus(), 30);
}
function cancelSub(vocId) {
  document.getElementById('sub-form-' + vocId).style.display = 'none';
  document.getElementById('sub-add-row-' + vocId).style.display = '';
  const inp = document.getElementById('sub-input-' + vocId);
  if (inp) inp.value = '';
}
function confirmSub(vocId) {
  const inp = document.getElementById('sub-input-' + vocId);
  const title = inp?.value.trim();
  if (!title) {
    inp?.focus();
    return;
  }
  const typeSel = document.getElementById('subtaskTypeSelect-' + vocId);
  const type = typeSel?.value || 'bug';
  const voc = VOC_MAP[vocId];
  const newId = 'sub-new-' + ++newSubCounter;
  const newSub = {
    id: newId,
    parentId: vocId,
    code: (voc?.code || vocId) + '-' + newSubCounter,
    title,
    type,
    status: '접수',
    priority: 'medium',
    assignee: '',
    assigneeInit: '',
    assigneeCls: '',
    author: '김관리',
    authorInit: '김',
    authorCls: '',
    tags: [],
    date: '',
    body: '',
  };
  VOC_MAP[newId] = newSub;
  if (voc && !voc.subs) voc.subs = [];
  if (voc) voc.subs.push(newId);
  const list = document.getElementById('sub-list-' + vocId);
  if (list) {
    const div = document.createElement('div');
    div.innerHTML = `<div class="sub-row" onclick="openDrawer('${newId}')">
      ${statusHTML('접수')}
      <span class="sub-row-title">${window.escHtml ? window.escHtml(title) : title}</span>
      <div class="mini-av" style="width:20px;height:20px;font-size:9px;flex-shrink:0">—</div>
    </div>`;
    list.appendChild(div.firstElementChild);
    lucide.createIcons({ nodes: [list.lastElementChild] });
  }
  const titleSpan = list?.closest('.d-subtasks')?.querySelector('.d-section-title span');
  if (titleSpan) titleSpan.textContent = (voc?.subs?.length || 1) + '개';
  cancelSub(vocId);
}
function subKeydown(e, vocId) {
  if (e.key === 'Enter') {
    e.preventDefault();
    confirmSub(vocId);
  }
  if (e.key === 'Escape') cancelSub(vocId);
}

// ── Attachment interactions
function drawerAddAttach(vocId) {
  document.getElementById('attach-input-' + vocId)?.click();
}
function drawerFileSelected(e, vocId) {
  const files = Array.from(e.target.files || []);
  if (!files.length) return;
  processAttachFiles(files, vocId);
  e.target.value = '';
}
function removeAttach(vocId, idx) {
  if (!attachStore[vocId]) return;
  attachStore[vocId].splice(idx, 1);
  refreshAttZone(vocId);
}

// ── Comment inline edit
function editComment(btn) {
  const card = btn.closest('.comment-card');
  const bodyEl = card.querySelector('.c-body');
  if (!bodyEl || bodyEl.classList.contains('editing')) return;
  const origText = bodyEl.textContent;
  bodyEl.dataset.orig = origText;
  bodyEl.classList.add('editing');
  bodyEl.innerHTML = `<textarea class="c-edit-textarea">${origText}</textarea>
    <div class="c-edit-actions">
      <button class="btn-ghost" style="padding:5px 10px;font-size:12px" onclick="cancelEditComment(this)">취소</button>
      <button class="btn-primary" style="padding:5px 11px;font-size:12px" onclick="saveComment(this)">저장</button>
    </div>`;
  const ta = bodyEl.querySelector('textarea');
  ta.focus();
  ta.selectionStart = ta.selectionEnd = ta.value.length;
}
function saveComment(btn) {
  const bodyEl = btn.closest('.c-body');
  const newText = bodyEl.querySelector('textarea')?.value.trim();
  if (!newText) return;
  bodyEl.classList.remove('editing');
  bodyEl.innerHTML = newText.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const card = bodyEl.closest('.comment-card');
  let editedEl = card.querySelector('.c-edited');
  if (!editedEl) {
    editedEl = document.createElement('div');
    editedEl.className = 'c-edited';
    card.appendChild(editedEl);
  }
  editedEl.textContent = '(수정됨)';
}
function cancelEditComment(btn) {
  const bodyEl = btn.closest('.c-body');
  bodyEl.classList.remove('editing');
  bodyEl.textContent = bodyEl.dataset.orig || '';
}
function deleteComment(btn) {
  const card = btn.closest('.comment-card');
  card.style.transition = 'opacity 0.15s, transform 0.15s';
  card.style.opacity = '0';
  card.style.transform = 'translateY(-4px)';
  setTimeout(() => {
    const list = card.parentElement;
    card.remove();
    const vocId = list?.id?.replace('comment-list-', '');
    const countEl = vocId && document.getElementById('comment-count-' + vocId);
    if (countEl && list)
      countEl.textContent = '댓글 ' + list.querySelectorAll('.comment-card').length + '개';
  }, 150);
}

// ── New comment submit
function submitComment(vocId) {
  const inp = document.getElementById('new-comment-input-' + vocId);
  const text = inp?.value.trim();
  if (!text) {
    inp?.focus();
    return;
  }
  const list = document.getElementById('comment-list-' + vocId);
  if (list) {
    const div = document.createElement('div');
    div.className = 'comment-card';
    div.innerHTML = `
      <div class="comment-header">
        <div class="mini-av" style="width:24px;height:24px;font-size:10px">김</div>
        <span class="c-author">김관리</span>
        <span class="c-date">방금 전</span>
        <div style="margin-left:auto;display:flex;gap:4px">
          <div class="icon-btn" style="width:24px;height:24px" data-tip="수정" onclick="editComment(this)"><i data-lucide="pencil" style="width:11px;height:11px"></i></div>
          <div class="icon-btn" style="width:24px;height:24px" data-tip="삭제" onclick="deleteComment(this)"><i data-lucide="trash-2" style="width:11px;height:11px"></i></div>
        </div>
      </div>
      <div class="c-body">${text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>`;
    list.appendChild(div);
    lucide.createIcons({ nodes: [div] });
    const countEl = document.getElementById('comment-count-' + vocId);
    if (countEl)
      countEl.textContent = '댓글 ' + list.querySelectorAll('.comment-card').length + '개';
  }
  inp.value = '';
}
function clearNewComment(vocId) {
  const inp = document.getElementById('new-comment-input-' + vocId);
  if (inp) inp.value = '';
}
function newCommentKey(e, vocId) {
  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
    e.preventDefault();
    submitComment(vocId);
  }
}
