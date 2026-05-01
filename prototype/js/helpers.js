// ── Helpers
function calcPageSize() {
  const fixed = 56 + 44 + 32 + 62 + 20; // topbar+filterbar+list-header+pagination+padding
  const available = window.innerHeight - fixed;
  return Math.max(10, Math.floor(available / 52));
}

const PRI_ICON = { urgent: 'flame', high: 'chevron-up', medium: 'minus', low: 'chevron-down' };
const PRI_CLS = { urgent: 'p-urgent', high: 'p-high', medium: 'p-medium', low: 'p-low' };
const PRI_LABEL = { urgent: 'Urgent', high: 'High', medium: 'Medium', low: 'Low' };
const PRI_ORDER = { urgent: 0, high: 1, medium: 2, low: 3 };

function priHTML(p) {
  return `<div class="pri-badge ${PRI_CLS[p]}"><i data-lucide="${PRI_ICON[p]}"></i>${PRI_LABEL[p]}</div>`;
}
function statusHTML(s) {
  return `<div class="status-badge s-${s}"><div class="status-dot"></div>${s}</div>`;
}
function assigneeHTML(v) {
  if (!v.assignee)
    return `<div class="assignee-cell" style="color:var(--text-quaternary)"><i data-lucide="user-x" style="width:15px;height:15px"></i> 미배정</div>`;
  return `<div class="assignee-cell"><div class="mini-av ${v.assigneeCls}">${v.assigneeInit}</div>${v.assignee}</div>`;
}
// N-04: search highlight — uses escapeHtml (dom-utils.js) for XSS safety
// and escapes regex special chars to prevent regex injection.
function highlight(text, q) {
  // escHtml available after dom-utils.js loads; fall back to identity for safety
  const safe = typeof window.escHtml === 'function' ? window.escHtml(String(text)) : String(text);
  if (!q) return safe;
  const escRegex = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const safeQ = typeof window.escHtml === 'function' ? window.escHtml(q) : q;
  const escRegexSafe = safeQ.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return safe.replace(
    new RegExp(`(${escRegexSafe})`, 'gi'),
    '<mark class="search-highlight">$1</mark>',
  );
}
function formatDateKo(d) {
  if (!d) return '';
  const parts = d.split('.');
  if (parts.length < 3) return d;
  return `${parts[0]}년 ${parseInt(parts[1])}월 ${parseInt(parts[2])}일`;
}
