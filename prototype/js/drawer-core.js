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

function buildAttachSection(d) {
  const files = attachStore[d.id] || [];
  const filesHTML = files.map((f, i) => attachItemHTML(d.id, f, i)).join('');
  return `
    <div class="d-attachments">
      <div class="d-section-title" style="display:flex;align-items:center;gap:6px">
        첨부파일<span style="font-size:10.5px;color:var(--text-quaternary);font-weight:400;text-transform:none">${files.length}개</span>
      </div>
      <div class="attach-list" id="attach-list-${d.id}">${filesHTML}</div>
      <button class="attach-add-btn" onclick="drawerAddAttach('${d.id}')" type="button">
        <i data-lucide="paperclip" style="width:13px;height:13px"></i> 파일 첨부
      </button>
      <input type="file" id="attach-input-${d.id}" style="display:none" multiple onchange="drawerFileSelected(event,'${d.id}')">
    </div>`;
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
      <span class="sub-row-title">${title}</span>
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
  if (!attachStore[vocId]) attachStore[vocId] = [];
  const list = document.getElementById('attach-list-' + vocId);
  files.forEach((f) => {
    const size =
      f.size > 1024 * 1024
        ? (f.size / 1024 / 1024).toFixed(1) + ' MB'
        : Math.round(f.size / 1024) + ' KB';
    const ext = f.name.split('.').pop()?.toLowerCase();
    const icon = ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)
      ? 'image'
      : ['pdf'].includes(ext)
        ? 'file-text'
        : ['zip', 'tar', 'gz'].includes(ext)
          ? 'archive'
          : 'file';
    const idx = attachStore[vocId].length;
    attachStore[vocId].push({ name: f.name, size, icon });
    if (list) {
      const div = document.createElement('div');
      div.innerHTML = attachItemHTML(vocId, { name: f.name, size, icon }, idx);
      list.appendChild(div.firstElementChild);
      lucide.createIcons({ nodes: [list.lastElementChild] });
    }
  });
  const titleSpan = document
    .querySelector(`#attach-list-${vocId}`)
    ?.closest('.d-attachments')
    ?.querySelector('.d-section-title span');
  if (titleSpan) titleSpan.textContent = attachStore[vocId].length + '개';
  e.target.value = '';
}
function removeAttach(vocId, idx) {
  if (!attachStore[vocId]) return;
  attachStore[vocId].splice(idx, 1);
  const list = document.getElementById('attach-list-' + vocId);
  if (list) {
    list.innerHTML = attachStore[vocId].map((f, i) => attachItemHTML(vocId, f, i)).join('');
    lucide.createIcons({ nodes: [list] });
  }
  const titleSpan = list?.closest('.d-attachments')?.querySelector('.d-section-title span');
  if (titleSpan) titleSpan.textContent = attachStore[vocId].length + '개';
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
  bodyEl.innerHTML = bodyEl.dataset.orig || '';
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
