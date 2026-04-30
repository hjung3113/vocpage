// ── P-12 Notifications ───────────────────────────────────────────────────────

const NOTIF_TYPES = {
  COMMENT: { key: 'comment', icon: 'message-circle', label: '댓글', color: 'brand' },
  STATUS: { key: 'status', icon: 'refresh-cw', label: '상태', color: 'blue' },
  ASSIGNEE: { key: 'assignee', icon: 'user-check', label: '담당자', color: 'green' },
  NOTICE: { key: 'notice', icon: 'megaphone', label: '공지', color: 'amber' },
  FAQ: { key: 'faq', icon: 'help-circle', label: 'FAQ', color: 'purple' },
  DEFAULT: { key: 'default', icon: 'bell', label: '기타', color: 'brand' },
};

// urgent is a flag on assignee/status items (not a type); actor/vocId/action avoids raw HTML.
const MOCK_NOTIFS = [
  {
    id: 1,
    type: 'assignee',
    unread: true,
    urgent: true,
    actor: '',
    vocId: '분석-2025-0009',
    action: 'Urgent VOC 담당자로 배정됐습니다.',
    time: '방금 전',
  },
  {
    id: 2,
    type: 'comment',
    unread: true,
    urgent: false,
    actor: '박개발',
    vocId: '분석-2025-0001',
    action: '님이 댓글을 달았습니다.',
    time: '5분 전',
  },
  {
    id: 3,
    type: 'status',
    unread: true,
    urgent: false,
    actor: '',
    vocId: '분석-2025-0001',
    action: '상태가 처리중으로 변경됐습니다.',
    time: '어제 14:23',
  },
  {
    id: 4,
    type: 'status',
    unread: true,
    urgent: true,
    actor: '',
    vocId: '파이프-2025-0007',
    action: 'Urgent VOC 상태가 긴급검토로 변경됐습니다.',
    time: '어제 11:40',
  },
  {
    id: 5,
    type: 'assignee',
    unread: false,
    urgent: false,
    actor: '',
    vocId: '분석-2025-0047',
    action: '담당자로 배정됐습니다.',
    time: '어제 10:05',
  },
  {
    id: 6,
    type: 'comment',
    unread: false,
    urgent: false,
    actor: '이분석',
    vocId: '파이프-2025-0002',
    action: '님이 댓글을 달았습니다.',
    time: '2025.06.11',
  },
  {
    id: 7,
    type: 'notice',
    unread: false,
    urgent: false,
    actor: '',
    vocId: null,
    action: '서비스 점검 공지: 6월 15일(일) 02:00–04:00 점검 예정.',
    time: '2025.06.10',
  },
  {
    id: 8,
    type: 'faq',
    unread: false,
    urgent: false,
    actor: '',
    vocId: null,
    action: 'FAQ 결재 프로세스 안내 항목이 업데이트됐습니다.',
    time: '2025.06.09',
  },
  {
    id: 9,
    type: 'status',
    unread: false,
    urgent: false,
    actor: '',
    vocId: '분석-2025-0033',
    action: '상태가 완료로 변경됐습니다.',
    time: '2025.06.08',
  },
];

// Active filter key ('all', a NOTIF_TYPES key, or 'urgent')
let _activeFilter = 'all';

// CR2: module flag to ensure delegated listener is set up only once
let _nfListInited = false;

// ── Helpers ───────────────────────────────────────────────────────────────────
const esc = window.escHtml;

// Builds escaped notification text; actor/vocId wrapped with <strong> after escaping.
function buildNotifText(n) {
  const urgentBadge = n.urgent
    ? `<span class="nf-urgent-badge" aria-label="Urgent"><i data-lucide="alert-octagon"></i></span>`
    : '';
  const noticeBadge = n.type === 'notice' ? `<span class="notice-badge-important">중요</span>` : '';
  if (n.actor) {
    return `${noticeBadge}<strong>${esc(n.actor)}</strong>(${esc(n.vocId || '')})${esc(n.action)}${urgentBadge}`;
  }
  if (n.vocId) {
    return `${noticeBadge}(<strong>${esc(n.vocId)}</strong>)${esc(n.action)}${urgentBadge}`;
  }
  return `${noticeBadge}${esc(n.action)}${urgentBadge}`;
}

// ── Render ────────────────────────────────────────────────────────────────────
function renderNotifPanel() {
  const list = document.getElementById('nfList');
  if (!list) return;

  // "Urgent" filter is orthogonal to type — filters by flag
  let filtered;
  if (_activeFilter === 'all') {
    filtered = MOCK_NOTIFS;
  } else if (_activeFilter === 'urgent') {
    filtered = MOCK_NOTIFS.filter((n) => n.urgent === true);
  } else {
    filtered = MOCK_NOTIFS.filter((n) => n.type === _activeFilter);
  }

  if (filtered.length === 0) {
    list.innerHTML = `<div class="nf-empty"><i data-lucide="bell-off"></i><span>알림이 없습니다.</span></div>`;
    lucide.createIcons({ nodes: [list] });
    return;
  }

  list.innerHTML = filtered
    .map((n) => {
      const typeInfo = Object.values(NOTIF_TYPES).find((t) => t.key === n.type);
      if (!typeInfo) console.warn('[notif] unknown type:', n.type, '— falling back to DEFAULT');
      const info = typeInfo || NOTIF_TYPES.DEFAULT;

      const unreadDot = n.unread ? `<div class="notif-dot-unread"></div>` : '';
      return `
      <div class="notif-item${n.unread ? ' unread' : ''}${n.urgent ? ' nf-urgent-row' : ''}"
           data-nf-id="${esc(String(n.id))}">
        <div class="notif-icon nf-icon--${info.color}">
          <i data-lucide="${info.icon}"></i>
        </div>
        <div class="notif-content">
          <p>${buildNotifText(n)}</p>
          <div class="notif-time">${esc(n.time)}</div>
        </div>
        ${unreadDot}
      </div>`;
    })
    .join('');

  lucide.createIcons({ nodes: [list] });

  // CR2: attach delegated listener once after first render
  if (!_nfListInited) {
    list.addEventListener('click', (e) => {
      const item = e.target.closest('[data-nf-id]');
      if (!item) return;
      const id = parseInt(item.dataset.nfId, 10);
      if (id) markReadById(id);
    });
    _nfListInited = true;
  }
}

// ── Filter ────────────────────────────────────────────────────────────────────
function filterByType(key) {
  _activeFilter = key;
  document.querySelectorAll('.nf-chip').forEach((chip) => {
    chip.classList.toggle('nf-chip--active', chip.dataset.filter === key);
  });
  renderNotifPanel();
}

// ── Mark read ─────────────────────────────────────────────────────────────────
function markReadById(id) {
  const notif = MOCK_NOTIFS.find((n) => n.id === id);
  if (!notif || !notif.unread) return;
  notif.unread = false; // only unread toggled; urgent preserved
  renderNotifPanel();
  syncBadge();
}

function markRead(item) {
  // Legacy DOM-based handler (kept for backward compat)
  const id = parseInt(item.dataset.nfId, 10);
  if (id) {
    markReadById(id);
    return;
  }
  item.classList.remove('unread');
  const dot = item.querySelector('.notif-dot-unread');
  if (dot) dot.remove();
  syncBadge();
}

function markAllRead() {
  MOCK_NOTIFS.forEach((n) => {
    n.unread = false;
  }); // urgent preserved
  renderNotifPanel();
  syncBadge();
}

// ── Badge sync ────────────────────────────────────────────────────────────────
function syncBadge() {
  const unreadCount = MOCK_NOTIFS.filter((n) => n.unread).length;
  const hasUrgent = MOCK_NOTIFS.some((n) => n.unread && n.urgent);

  const dot = document.querySelector('.notif-dot');
  if (dot) dot.style.display = unreadCount ? '' : 'none';

  // M3: badges are mutually exclusive — urgent takes priority over count
  const notifBtn = document.getElementById('notifBtn');
  let countBadge = document.querySelector('.nf-count-badge');
  let urgentBadge = document.querySelector('.nf-bell-urgent');

  if (hasUrgent) {
    // Show ONLY urgent badge
    countBadge?.remove();
    if (!urgentBadge) {
      urgentBadge = document.createElement('span');
      urgentBadge.className = 'nf-bell-urgent';
      urgentBadge.setAttribute('aria-label', 'Urgent 알림');
      urgentBadge.textContent = '!';
      notifBtn?.appendChild(urgentBadge);
    }
  } else if (unreadCount > 0) {
    // Show ONLY count badge
    urgentBadge?.remove();
    if (!countBadge) {
      countBadge = document.createElement('span');
      countBadge.className = 'nf-count-badge';
      notifBtn?.appendChild(countBadge);
    }
    countBadge.textContent = unreadCount > 99 ? '99+' : unreadCount;
  } else {
    // No unread — remove both
    countBadge?.remove();
    urgentBadge?.remove();
  }

  // Update header unread count label
  const countLabel = document.getElementById('nfUnreadLabel');
  if (countLabel) countLabel.textContent = unreadCount ? ` (${unreadCount})` : '';
}

// ── Panel toggle ──────────────────────────────────────────────────────────────
function toggleNotif() {
  const panel = document.getElementById('notifPanel');
  const isOpen = panel.classList.toggle('open');
  if (isOpen) {
    renderNotifPanel();
  }
}

// ── Legacy syncNotifDot (kept for backward compat) ───────────────────────────
function syncNotifDot() {
  syncBadge();
}

// ── Global close handlers ─────────────────────────────────────────────────────
document.addEventListener('click', (e) => {
  const panel = document.getElementById('notifPanel');
  const notBtn = document.getElementById('notifBtn');
  if (panel?.classList.contains('open') && !panel.contains(e.target) && !notBtn.contains(e.target))
    panel.classList.remove('open');
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (document.getElementById('modalBg').classList.contains('open')) return closeModal();
    if (document.getElementById('drawer').classList.contains('open')) return closeDrawer();
    document.getElementById('notifPanel').classList.remove('open');
  }
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    openModal();
  }
});

// ── Notice popup helpers ──────────────────────────────────────────────────────
function handleHideToday(id, checked) {
  const today = new Date().toISOString().slice(0, 10);
  if (checked) localStorage.setItem('notice_hide_' + id, today);
  else localStorage.removeItem('notice_hide_' + id);
}

function handleHideTodayAll(checked, ids) {
  ids.forEach((id) => handleHideToday(id, checked));
}

function closeNoticePopup() {
  const el = document.getElementById('noticePopupOverlay');
  if (el) el.remove();
}

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  syncBadge();
});
