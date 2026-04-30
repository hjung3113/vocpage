// ── P-12 Notifications ───────────────────────────────────────────────────────

const NOTIF_TYPES = {
  COMMENT: { key: 'comment', icon: 'message-circle', label: '댓글', color: 'brand' },
  STATUS: { key: 'status', icon: 'refresh-cw', label: '상태', color: 'blue' },
  ASSIGNEE: { key: 'assignee', icon: 'user-check', label: '담당자', color: 'green' },
  URGENT: { key: 'urgent', icon: 'alert-triangle', label: 'Urgent', color: 'red' },
  NOTICE: { key: 'notice', icon: 'megaphone', label: '공지', color: 'amber' },
  FAQ: { key: 'faq', icon: 'help-circle', label: 'FAQ', color: 'purple' },
};

const MOCK_NOTIFS = [
  {
    id: 1,
    type: 'urgent',
    unread: true,
    urgent: true,
    voc: '분석-2025-0009',
    text: '<strong>분석-2025-0009</strong> Urgent VOC 담당자로 배정됐습니다.',
    time: '방금 전',
  },
  {
    id: 2,
    type: 'comment',
    unread: true,
    urgent: false,
    voc: '분석-2025-0001',
    text: '<strong>박개발</strong>님이 <strong>분석-2025-0001</strong>에 댓글을 달았습니다.',
    time: '5분 전',
  },
  {
    id: 3,
    type: 'status',
    unread: true,
    urgent: false,
    voc: '분석-2025-0001',
    text: '<strong>분석-2025-0001</strong> 상태가 <strong>처리중</strong>으로 변경됐습니다.',
    time: '어제 14:23',
  },
  {
    id: 4,
    type: 'urgent',
    unread: true,
    urgent: true,
    voc: '파이프-2025-0007',
    text: '<strong>파이프-2025-0007</strong> Urgent VOC 상태가 <strong>긴급검토</strong>로 변경됐습니다.',
    time: '어제 11:40',
  },
  {
    id: 5,
    type: 'assignee',
    unread: false,
    urgent: false,
    voc: '분석-2025-0047',
    text: '<strong>분석-2025-0047</strong>의 담당자로 배정됐습니다.',
    time: '어제 10:05',
  },
  {
    id: 6,
    type: 'comment',
    unread: false,
    urgent: false,
    voc: '파이프-2025-0002',
    text: '<strong>이분석</strong>님이 <strong>파이프라인-2025-0002</strong>에 댓글을 달았습니다.',
    time: '2025.06.11',
  },
  {
    id: 7,
    type: 'notice',
    unread: false,
    urgent: false,
    voc: null,
    text: '서비스 점검 공지: 6월 15일(일) 02:00–04:00 시스템 점검 예정입니다.',
    time: '2025.06.10',
  },
  {
    id: 8,
    type: 'faq',
    unread: false,
    urgent: false,
    voc: null,
    text: 'FAQ <strong>결재 프로세스 안내</strong> 항목이 업데이트됐습니다.',
    time: '2025.06.09',
  },
  {
    id: 9,
    type: 'status',
    unread: false,
    urgent: false,
    voc: '분석-2025-0033',
    text: '<strong>분석-2025-0033</strong> 상태가 <strong>완료</strong>로 변경됐습니다.',
    time: '2025.06.08',
  },
];

// Active filter key ('all' or a NOTIF_TYPES key)
let _activeFilter = 'all';

// ── Render ────────────────────────────────────────────────────────────────────
function renderNotifPanel() {
  const list = document.getElementById('nfList');
  if (!list) return;

  const filtered =
    _activeFilter === 'all' ? MOCK_NOTIFS : MOCK_NOTIFS.filter((n) => n.type === _activeFilter);

  if (filtered.length === 0) {
    list.innerHTML = `<div class="nf-empty"><i data-lucide="bell-off"></i><span>알림이 없습니다.</span></div>`;
    lucide.createIcons({ nodes: [list] });
    return;
  }

  list.innerHTML = filtered
    .map((n) => {
      const typeInfo =
        Object.values(NOTIF_TYPES).find((t) => t.key === n.type) || NOTIF_TYPES.COMMENT;
      const urgentBadge = n.urgent
        ? `<span class="nf-urgent-badge" aria-label="Urgent"><i data-lucide="alert-octagon"></i></span>`
        : '';
      const unreadDot = n.unread ? `<div class="notif-dot-unread"></div>` : '';
      return `
      <div class="notif-item${n.unread ? ' unread' : ''}${n.urgent ? ' nf-urgent-row' : ''}"
           data-nf-id="${n.id}" onclick="markReadById(${n.id})">
        <div class="notif-icon nf-icon--${typeInfo.color}">
          <i data-lucide="${typeInfo.icon}"></i>
        </div>
        <div class="notif-content">
          <p>${n.text}${urgentBadge}</p>
          <div class="notif-time">${n.time}</div>
        </div>
        ${unreadDot}
      </div>`;
    })
    .join('');

  lucide.createIcons({ nodes: [list] });
}

// ── Filter ────────────────────────────────────────────────────────────────────
function filterByType(key) {
  _activeFilter = key;
  // Update chip active state
  document.querySelectorAll('.nf-chip').forEach((chip) => {
    chip.classList.toggle('nf-chip--active', chip.dataset.filter === key);
  });
  renderNotifPanel();
}

// ── Mark read ─────────────────────────────────────────────────────────────────
function markReadById(id) {
  const notif = MOCK_NOTIFS.find((n) => n.id === id);
  if (!notif || !notif.unread) return;
  notif.unread = false;
  if (notif.urgent) notif.urgent = false; // clear urgent badge when read
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
    n.urgent = false;
  });
  renderNotifPanel();
  syncBadge();
}

// ── Badge sync ────────────────────────────────────────────────────────────────
function syncBadge() {
  const unreadCount = MOCK_NOTIFS.filter((n) => n.unread).length;
  const hasUrgent = MOCK_NOTIFS.some((n) => n.unread && n.urgent);

  // Dot (legacy)
  const dot = document.querySelector('.notif-dot');
  if (dot) dot.style.display = unreadCount ? '' : 'none';

  // Count badge
  let countBadge = document.querySelector('.nf-count-badge');
  if (unreadCount > 0) {
    if (!countBadge) {
      countBadge = document.createElement('span');
      countBadge.className = 'nf-count-badge';
      document.getElementById('notifBtn')?.appendChild(countBadge);
    }
    countBadge.textContent = unreadCount > 99 ? '99+' : unreadCount;
  } else {
    countBadge?.remove();
  }

  // Urgent exclamation badge
  let urgentBadge = document.querySelector('.nf-bell-urgent');
  if (hasUrgent) {
    if (!urgentBadge) {
      urgentBadge = document.createElement('span');
      urgentBadge.className = 'nf-bell-urgent';
      urgentBadge.setAttribute('aria-label', 'Urgent 알림');
      urgentBadge.textContent = '!';
      document.getElementById('notifBtn')?.appendChild(urgentBadge);
    }
  } else {
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
