// ── Notifications
function toggleNotif() {
  document.getElementById('notifPanel').classList.toggle('open');
}
function markRead(item) {
  item.classList.remove('unread');
  const dot = item.querySelector('.notif-dot-unread');
  if (dot) dot.remove();
  const icon = item.querySelector('.notif-icon');
  if (icon) {
    icon.style.background = '';
    const svg = icon.querySelector('svg');
    if (svg) svg.style.color = '';
  }
  syncNotifDot();
}
function markAllRead() {
  document.querySelectorAll('.notif-item.unread').forEach(markRead);
}
function syncNotifDot() {
  const dot = document.querySelector('.notif-dot');
  if (dot) dot.style.display = document.querySelectorAll('.notif-item.unread').length ? '' : 'none';
}

// ── Global close handlers
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

// ── Notice popup helpers (overlay element is built by init.js initNoticePopup IIFE)
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
