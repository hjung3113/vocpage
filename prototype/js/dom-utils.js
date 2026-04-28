// Shared DOM utilities — loaded before result-review.js and internal-notes.js.
// Exposes window.escHtml and window.showToast to avoid duplicate definitions.

window.escHtml = function escHtml(s) {
  return String(s).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
};

window.showToast = function showToast(msg, kind) {
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
};
