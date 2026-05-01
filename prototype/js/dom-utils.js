// Shared DOM utilities — loaded before result-review.js and internal-notes.js.
// Exposes window.escHtml and window.showToast to avoid duplicate definitions.

window.escHtml = function escHtml(s) {
  return String(s).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
};

// ── N-02 Character count helper ─────────────────────────────────────────────
// attachCharCount(input, max) — appends a live counter element after the input.
// Thresholds: < 90% → default (--text-quaternary), ≥ 90% → amber, > max → red + disables saveBtn.
// saveBtn: nearest ancestor .modal or .drawer-body → first btn-primary inside it.
window.attachCharCount = function attachCharCount(input, max) {
  if (!input || input.dataset.charCountAttached) return;
  input.dataset.charCountAttached = 'true';
  input.dataset.charMax = String(max);

  const counter = document.createElement('div');
  counter.className = 'char-count';
  counter.setAttribute('aria-live', 'polite');
  input.insertAdjacentElement('afterend', counter);

  function findSaveBtn() {
    const ctx = input.closest('.modal') || input.closest('.drawer-body');
    return ctx ? ctx.querySelector('.btn-primary') : null;
  }

  function update() {
    const len = input.value.length;
    counter.textContent = `${len} / ${max}`;
    if (len > max) {
      counter.className = 'char-count char-count--over';
      const btn = findSaveBtn();
      if (btn) btn.disabled = true;
    } else if (len >= Math.floor(max * 0.9)) {
      counter.className = 'char-count char-count--warn';
      const btn = findSaveBtn();
      if (btn) btn.disabled = false;
    } else {
      counter.className = 'char-count';
      const btn = findSaveBtn();
      if (btn) btn.disabled = false;
    }
  }

  input.addEventListener('input', update);
  update();
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
