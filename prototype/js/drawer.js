// ── C-02 Due Date helpers ────────────────────────────────────────────────────
// calcDueDate(priority, baseDate?) → 'YYYY-MM-DD'
// P0(urgent)=+1d, P1(high)=+3d, P2(medium)=+7d, P3(low)=+30d
window.calcDueDate = function calcDueDate(priority, baseDate) {
  const base = baseDate ? new Date(baseDate) : new Date();
  const offsets = { urgent: 1, high: 3, medium: 7, low: 30 };
  const days = offsets[priority] ?? 7;
  base.setDate(base.getDate() + days);
  return base.toISOString().slice(0, 10);
};

function openDrawer(id) {
  const d = VOC_MAP[id];
  if (!d) return;

  document.getElementById('dCode').textContent = d.code;
  document.getElementById('dTitle').textContent = d.title;

  const assigneeSelectHTML = `
    <div class="mini-av ${d.assigneeCls}" style="width:24px;height:24px;font-size:11px">${d.assigneeInit || '?'}</div>
    <select class="meta-sel" style="flex:1">
      <option ${d.assignee === '김관리' ? 'selected' : ''}>김관리</option>
      <option ${d.assignee === '박개발' ? 'selected' : ''}>박개발</option>
      <option ${d.assignee === '이분석' ? 'selected' : ''}>이분석</option>
      <option ${!d.assignee ? 'selected' : ''}>미배정</option>
    </select>`;

  const tagsHTML =
    d.tags && d.tags.length
      ? d.tags
          .map((t) => `<span class="tag-pill" style="padding:3px 10px;font-size:12px">${t}</span>`)
          .join('')
      : `<span style="font-size:12px;color:var(--text-quaternary)">태그 없음</span>`;

  document.getElementById('drawerBody').innerHTML = `
    <div class="d-meta">
      <div class="meta-item">
        <div class="meta-lbl">상태</div>
        <!-- 상태 전환 매트릭스: 접수→검토중/드랍, 검토중→처리중/드랍, 처리중→완료/드랍, 완료→처리중 -->
        <!-- allowed[현재상태] = 전환가능한 상태 목록 (현재 상태 자신 포함) -->
        <select class="meta-sel">
          <option ${d.status === '접수' ? 'selected' : ''}>접수</option>
          <option ${d.status === '검토중' ? 'selected' : ''} ${['검토중', '처리중', '완료'].includes(d.status) ? 'disabled' : ''} style="${['검토중', '처리중', '완료'].includes(d.status) ? 'color:var(--text-quaternary)' : ''}">검토중</option>
          <option ${d.status === '처리중' ? 'selected' : ''} ${['접수', '검토중'].includes(d.status) ? 'disabled' : ''} style="${['접수', '검토중'].includes(d.status) ? 'color:var(--text-quaternary)' : ''}">처리중</option>
          <option ${d.status === '완료' ? 'selected' : ''} ${['접수', '검토중', '완료'].includes(d.status) ? 'disabled' : ''} style="${['접수', '검토중', '완료'].includes(d.status) ? 'color:var(--text-quaternary)' : ''}">완료</option>
          <option ${d.status === '드랍' ? 'selected' : ''}>드랍</option>
        </select>
      </div>
      <div class="meta-item">
        <div class="meta-lbl">우선순위</div>
        <select class="meta-sel" id="drawer-priority-${d.id}" onchange="drawerPriorityChange('${d.id}', this.value)" data-role-allow="manager,admin,dev">
          <option value="urgent" ${d.priority === 'urgent' ? 'selected' : ''}>Urgent</option>
          <option value="high"   ${d.priority === 'high' ? 'selected' : ''}>High</option>
          <option value="medium" ${d.priority === 'medium' ? 'selected' : ''}>Medium</option>
          <option value="low"    ${d.priority === 'low' ? 'selected' : ''}>Low</option>
        </select>
      </div>
      <div class="meta-item">
        <!-- C-02 마감일 권한: User=읽기전용, Manager/Admin/Dev=쓰기 -->
        <div class="meta-lbl">마감일</div>
        <input type="date" class="meta-sel" id="drawer-duedate-${d.id}"
          value="${d.dueDate || window.calcDueDate(d.priority)}"
          style="font-size:13px;color:var(--text-primary)"
          data-role-allow="manager,admin,dev"
          onchange="drawerDueDateChange('${d.id}', this.value)" />
      </div>
      <div class="meta-item">
        <div class="meta-lbl">담당자</div>
        <div class="meta-val">${assigneeSelectHTML}</div>
      </div>
      <div class="meta-item">
        <div class="meta-lbl">시스템</div>
        <div class="meta-val">${SYS_MAP[d.systemId]?.name || '—'}</div>
      </div>
      <div class="meta-item">
        <div class="meta-lbl">메뉴</div>
        <div class="meta-val">${MENU_MAP[d.menuId]?.name || '—'}</div>
      </div>
      <div class="meta-item">
        <div class="meta-lbl">유형</div>
        <div class="meta-val">${((typeInfo) =>
          typeInfo
            ? `<span class="type-badge" style="background:${typeInfo.color}18;color:${typeInfo.color}"><span class="type-badge-dot" style="background:${typeInfo.color}"></span>${typeInfo.name}</span>`
            : d.type || '—')(TYPE_MAP[d.type])}</div>
      </div>
      <div class="meta-item">
        <div class="meta-lbl">작성자</div>
        <div class="meta-val"><div class="mini-av ${d.authorCls || ''}" style="width:24px;height:24px;font-size:11px">${d.authorInit || '?'}</div>${d.author || '—'}</div>
      </div>
      <div class="meta-item">
        <div class="meta-lbl">등록일</div>
        <div class="meta-val" style="color:var(--text-tertiary)">${formatDateKo(d.date)}</div>
      </div>
    </div>

    <div class="d-tags">
      <span class="at-label">태그</span>
      ${tagsHTML}
      <span style="font-size:10.5px;color:var(--text-quaternary);margin-left:auto" data-tip="본문 키워드 기반 자동 태깅 (수동 편집 불가)">
        <i data-lucide="sparkles" style="width:11px;height:11px;vertical-align:-2px"></i> 자동 태깅
      </span>
    </div>

    <div class="d-section">
      <div class="d-section-title">본문</div>
      <div class="d-body-text">${d.body || '<p>본문이 없습니다.</p>'}</div>
    </div>

    <div class="d-section">
      <div class="d-section-title">변경 이력</div>
      <div class="hist-item">
        <div class="hist-dot" style="background:var(--status-green)"></div>
        <div class="hist-text"><strong>${d.assignee || '관리자'}</strong>님이 상태를 <strong>검토중 → ${d.status}</strong>으로 변경했습니다.</div>
        <div class="hist-time">어제 14:23</div>
      </div>
      <div class="hist-item">
        <div class="hist-dot" style="background:var(--accent)"></div>
        <div class="hist-text"><strong>${d.assignee || '—'}</strong>님이 담당자로 배정되었습니다.</div>
        <div class="hist-time">어제 10:05</div>
      </div>
      <div class="hist-item">
        <div class="hist-dot"></div>
        <div class="hist-text"><strong>${d.author || '작성자'}</strong>님이 VOC를 등록했습니다.</div>
        <div class="hist-time">${d.date}</div>
      </div>
    </div>

    ${buildSubsSection(d)}

    ${buildAttachSection(d)}

    ${(function () {
      // TODO: replace hardcoded role with real auth when wired.
      // window.currentUser is set by boot mock (init.js) or real auth layer.
      // Fix S1: fail-closed — 'user' when window.currentUser is not set.
      const role = (window.currentUser && window.currentUser.role) || 'user';
      const isOwner = !!(
        window.currentUser &&
        d.assignee_id &&
        window.currentUser.id === d.assignee_id
      );
      return typeof window.InternalNotes === 'object'
        ? window.InternalNotes.build(d.id, role, isOwner)
        : '';
    })()}

    <div class="d-comments">
      <div class="d-section-title" id="comment-count-${d.id}">댓글 1개</div>
      <div id="comment-list-${d.id}">
        <div class="comment-card">
          <div class="comment-header">
            <div class="mini-av" style="width:24px;height:24px;font-size:10px">${d.assigneeInit || '관'}</div>
            <span class="c-author">${d.assignee || '관리자'}</span>
            <span class="c-date">어제 14:30</span>
            <div style="margin-left:auto;display:flex;gap:4px">
              <div class="icon-btn" style="width:24px;height:24px" data-tip="수정" onclick="editComment(this)"><i data-lucide="pencil" style="width:11px;height:11px"></i></div>
              <div class="icon-btn" style="width:24px;height:24px" data-tip="삭제" onclick="deleteComment(this)"><i data-lucide="trash-2" style="width:11px;height:11px"></i></div>
            </div>
          </div>
          <div class="c-body">내용 검토 후 처리 예정입니다. 추가 정보가 필요하면 댓글로 남겨주세요.</div>
        </div>
      </div>
      <div class="comment-input">
        <textarea id="new-comment-input-${d.id}" placeholder="댓글을 입력하세요 (Markdown 지원, Toast UI Editor 마운트 예정)" onkeydown="newCommentKey(event,'${d.id}')"></textarea>
        <div class="comment-toolbar">
          <span class="comment-hint">Ctrl+Enter로 등록</span>
          <button class="btn-ghost" style="padding:5px 10px;font-size:12px" onclick="clearNewComment('${d.id}')">취소</button>
          <button class="btn-primary" style="padding:5px 11px;font-size:12px" onclick="submitComment('${d.id}')"><i data-lucide="send"></i> 등록</button>
        </div>
      </div>
    </div>`;

  document.getElementById('drawerOverlay').classList.add('open');
  document.getElementById('drawer').classList.add('open');
  document.querySelectorAll('.voc-row').forEach((r) => r.classList.remove('selected'));
  const row = document.getElementById('row-' + id);
  if (row) row.classList.add('selected');
  lucide.createIcons();

  // N-02: attach charcount to drawer comment input
  if (typeof window.attachCharCount === 'function') {
    const commentInput = document.getElementById('new-comment-input-' + id);
    if (commentInput) window.attachCharCount(commentInput, 1000);
    // internal-notes textarea (rendered by InternalNotes.build)
    const notesInput = document.querySelector('.in-compose-ta');
    if (notesInput) window.attachCharCount(notesInput, 1000);
  }

  // C-02: apply role-based readonly for due-date and priority
  const role = (window.currentUser && window.currentUser.role) || 'user';
  const dueDateEl = document.getElementById('drawer-duedate-' + id);
  const priorityEl = document.getElementById('drawer-priority-' + id);
  if (role === 'user') {
    if (dueDateEl) {
      dueDateEl.disabled = true;
      dueDateEl.title = '권한 없음 (User 조회만 가능)';
    }
    if (priorityEl) {
      priorityEl.disabled = true;
    }
  }

  document.dispatchEvent(new CustomEvent('drawer:opened', { detail: { vocId: id, voc: d } }));
}

// ── C-02 Due Date event handlers ─────────────────────────────────────────────
function drawerPriorityChange(vocId, newPriority) {
  const dueDateEl = document.getElementById('drawer-duedate-' + vocId);
  if (!dueDateEl) return;
  const newDue = window.calcDueDate(newPriority);
  dueDateEl.value = newDue;
  dueDateEl.classList.add('due-date-dirty');
  dueDateEl.title = '우선순위 변경으로 자동 재계산됨';
  if (VOC_MAP[vocId]) VOC_MAP[vocId].dueDate = newDue;
}

function drawerDueDateChange(vocId, newDate) {
  // Manager+ manual override — mark dirty
  const dueDateEl = document.getElementById('drawer-duedate-' + vocId);
  if (dueDateEl) dueDateEl.classList.add('due-date-dirty');
  if (VOC_MAP[vocId]) VOC_MAP[vocId].dueDate = newDate;
}

function closeDrawer() {
  document.getElementById('drawerOverlay').classList.remove('open');
  document.getElementById('drawer').classList.remove('open');
  document.querySelectorAll('.voc-row').forEach((r) => r.classList.remove('selected'));
}

function toggleFullscreen() {
  const drawer = document.getElementById('drawer');
  const btn = document.getElementById('expandBtn');
  const isFs = drawer.classList.toggle('fullscreen');
  btn.dataset.tip = isFs ? '이전 크기로' : '큰 화면으로 보기';
  btn.querySelector('svg')?.remove();
  btn.innerHTML = isFs ? '<i data-lucide="minimize-2"></i>' : '<i data-lucide="maximize-2"></i>';
  lucide.createIcons();
}
