// Stage B-2 P-1.C2 — Internal Notes drawer section
//권한: Manager/Admin 항상, Dev는 본인 담당 VOC만, User/외부 Dev → DOM 미렌더
// 의존성 없음 — escHtml, toast 모두 자체 정의 (result-review.js 패턴 차용)

(function () {
  // ── helpers ──────────────────────────────────────────────────────────────

  function escHtml(s) {
    return String(s).replace(
      /[&<>"']/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
    );
  }

  // ── mock data ─────────────────────────────────────────────────────────────
  // VOC id별 2건. author / role 필드는 실제 API 응답 모양을 모사.

  const internalNotes = [
    {
      id: 'n1',
      vocId: 'VOC-001',
      author: '김관리',
      role: 'manager',
      content: '고객 재확인 후 처리 예정. 우선순위 높음.',
      createdAt: '2025-04-20 09:15',
    },
    {
      id: 'n2',
      vocId: 'VOC-001',
      author: '이분석',
      role: 'admin',
      content: '동일 이슈 3건 클러스터 — 릴리즈 핫픽스 포함 여부 논의 필요.',
      createdAt: '2025-04-21 14:40',
    },
    {
      id: 'n3',
      vocId: 'VOC-002',
      author: '박개발',
      role: 'dev',
      content: '재현 스텝 확인 완료. 로컬 환경 스택트레이스 첨부 예정.',
      createdAt: '2025-04-22 11:00',
    },
    {
      id: 'n4',
      vocId: 'VOC-002',
      author: '김관리',
      role: 'manager',
      content: '보류 사유: 동일 이슈 JIRA 티켓 연결 대기.',
      createdAt: '2025-04-22 15:30',
    },
    {
      id: 'n5',
      vocId: 'VOC-003',
      author: '이분석',
      role: 'admin',
      content: '외부 파트너 답변 대기 중. ETA 2025-04-30.',
      createdAt: '2025-04-23 10:20',
    },
    {
      id: 'n6',
      vocId: 'VOC-003',
      author: '김관리',
      role: 'manager',
      content: '트리아지 완료 — severity: medium으로 조정.',
      createdAt: '2025-04-23 16:05',
    },
    {
      id: 'n7',
      vocId: 'VOC-004',
      author: '이분석',
      role: 'admin',
      content: '유사 VOC VOC-001과 연계 처리 검토.',
      createdAt: '2025-04-24 09:00',
    },
    {
      id: 'n8',
      vocId: 'VOC-004',
      author: '이분석',
      role: 'admin',
      content: '처리 완료 후 고객 만족도 조사 발송 예정.',
      createdAt: '2025-04-24 17:00',
    },
    {
      id: 'n9',
      vocId: 'VOC-005',
      author: '박개발',
      role: 'dev',
      content: '개발 환경 재현 실패 — 추가 로그 요청.',
      createdAt: '2025-04-25 08:45',
    },
    {
      id: 'n10',
      vocId: 'VOC-005',
      author: '김관리',
      role: 'manager',
      content: '고객 측 네트워크 환경 특이사항 확인 필요.',
      createdAt: '2025-04-25 13:20',
    },
  ];

  // ── permission guard ──────────────────────────────────────────────────────

  /**
   * 렌더 허용 여부 반환.
   * @param {string} role - 'admin' | 'manager' | 'dev' | 'user'
   * @param {boolean} isOwner - Dev 역할일 때 본인 담당 VOC 여부
   */
  function canViewNotes(role, isOwner) {
    if (role === 'admin' || role === 'manager') return true;
    if (role === 'dev' && isOwner) return true;
    return false;
  }

  // ── note list HTML ────────────────────────────────────────────────────────

  function buildNoteItems(vocId) {
    const notes = internalNotes.filter((n) => n.vocId === vocId);
    if (notes.length === 0) {
      return `<p class="note-empty">등록된 내부 메모가 없습니다.</p>`;
    }
    return notes
      .map(
        (n) => `
      <div class="note-item" data-note-id="${escHtml(n.id)}">
        <div class="note-meta">
          <span class="note-author">${escHtml(n.author)}</span>
          <span class="note-date">${escHtml(n.createdAt)}</span>
        </div>
        <div class="note-body">${escHtml(n.content)}</div>
      </div>`,
      )
      .join('');
  }

  // ── public: build full section ────────────────────────────────────────────

  /**
   * Internal Notes 섹션 HTML 반환.
   * 권한 미충족 시 빈 문자열 반환 (DOM 생성 자체 차단).
   *
   * @param {string} vocId
   * @param {string} currentRole - 'admin' | 'manager' | 'dev' | 'user'
   * @param {boolean} isOwner
   * @returns {string}
   */
  function buildInternalNotesSection(vocId, currentRole, isOwner) {
    if (!canViewNotes(currentRole, isOwner)) return '';

    const count = internalNotes.filter((n) => n.vocId === vocId).length;
    const countLabel = count > 0 ? `내부 메모 ${count}개` : '내부 메모';

    return `
    <section class="notes-section" id="notes-section-${escHtml(vocId)}" aria-label="Internal Notes">
      <div class="notes-section-header">
        <button
          class="notes-toggle-btn"
          aria-expanded="true"
          aria-controls="notes-body-${escHtml(vocId)}"
          onclick="window._notesToggle('${escHtml(vocId)}')"
        >
          <span class="notes-header-title">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M12 8v4M12 16h.01"/></svg>
            내부 메모 (Internal Notes)
          </span>
          <span class="notes-count-badge">${count}</span>
          <svg class="notes-chevron" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="18 15 12 9 6 15"/></svg>
        </button>
      </div>
      <div class="notes-body" id="notes-body-${escHtml(vocId)}">
        <div class="note-list" id="note-list-${escHtml(vocId)}">
          ${buildNoteItems(vocId)}
        </div>
        <div class="note-input-area">
          <textarea
            id="note-textarea-${escHtml(vocId)}"
            class="note-input"
            placeholder="내부 메모를 입력하세요 (담당자·관리자만 볼 수 있음)"
            rows="3"
          ></textarea>
          <div class="note-toolbar">
            <button class="btn-ghost note-cancel-btn" style="padding:5px 10px;font-size:12px" onclick="window._notesClear('${escHtml(vocId)}')">취소</button>
            <button class="note-save-btn" onclick="window.addInternalNote('${escHtml(vocId)}')">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
              저장
            </button>
          </div>
        </div>
        <p class="notes-visibility-hint">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          담당자·관리자에게만 공개. 공개 댓글과 별도 저장.
        </p>
      </div>
    </section>`;
  }

  // ── public: add note ──────────────────────────────────────────────────────

  /**
   * textarea 값을 읽어 internalNotes에 push하고 섹션을 re-render.
   * @param {string} vocId
   */
  function addInternalNote(vocId) {
    const ta = document.getElementById(`note-textarea-${vocId}`);
    if (!ta) return;
    const content = ta.value.trim();
    if (!content) {
      showNotesToast('메모 내용을 입력해 주세요.', 'warn');
      return;
    }

    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const createdAt = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

    // TODO: replace with real currentUser when auth is wired
    const author = (window.currentUser && window.currentUser.name) || '현재 사용자';
    const role = (window.currentUser && window.currentUser.role) || 'manager';

    internalNotes.push({
      id: `n-${Date.now()}`,
      vocId,
      author,
      role,
      content,
      createdAt,
    });

    ta.value = '';
    renderInternalNotes(vocId);
    showNotesToast('내부 메모가 저장되었습니다.', 'ok');
  }

  // ── public: re-render note list ───────────────────────────────────────────

  /**
   * 노트 리스트만 다시 그림 (저장 후 호출).
   * @param {string} vocId
   */
  function renderInternalNotes(vocId) {
    const listEl = document.getElementById(`note-list-${vocId}`);
    if (!listEl) return;
    listEl.innerHTML = buildNoteItems(vocId);

    // 뱃지 카운트 갱신
    const section = document.getElementById(`notes-section-${vocId}`);
    if (section) {
      const badge = section.querySelector('.notes-count-badge');
      if (badge) {
        badge.textContent = String(internalNotes.filter((n) => n.vocId === vocId).length);
      }
    }
  }

  // ── toast ─────────────────────────────────────────────────────────────────
  // review-toast 스타일 재사용 (별도 CSS 클래스 미정의)

  function showNotesToast(msg, kind) {
    let host = document.getElementById('reviewToastHost');
    if (!host) {
      host = document.createElement('div');
      host.id = 'reviewToastHost';
      host.className = 'review-toast-host';
      host.setAttribute('role', 'status');
      host.setAttribute('aria-live', 'polite');
      document.body.appendChild(host);
    }
    const t = document.createElement('div');
    t.className = `review-toast review-toast-${kind || 'ok'}`;
    t.textContent = msg;
    host.appendChild(t);
    setTimeout(() => t.classList.add('out'), 1800);
    setTimeout(() => t.remove(), 2200);
  }

  // ── internal helpers exposed on window (prefixed to avoid collisions) ─────

  window._notesToggle = function (vocId) {
    const body = document.getElementById(`notes-body-${vocId}`);
    const btn = document.querySelector(`#notes-section-${vocId} .notes-toggle-btn`);
    if (!body || !btn) return;
    const expanded = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!expanded));
    body.classList.toggle('notes-body--collapsed', expanded);
  };

  window._notesClear = function (vocId) {
    const ta = document.getElementById(`note-textarea-${vocId}`);
    if (ta) ta.value = '';
  };

  // ── public API (two globals only) ─────────────────────────────────────────
  window.buildInternalNotesSection = buildInternalNotesSection;
  window.addInternalNote = addInternalNote;
})();
