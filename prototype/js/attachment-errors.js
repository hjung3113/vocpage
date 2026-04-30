// ── B-16: Attachment Upload Error Toast Simulator ───────────────────────────
// Additive only — does NOT modify drawer.js / drawer-core.js / drawer-advanced.js.
// Hooks via MutationObserver on #drawer.open (drawer:opened CustomEvent not yet
// present; observer is equivalent and fully non-invasive).

(function () {
  'use strict';

  const TOAST_LIMIT = 3;
  const TOAST_DURATION_MS = 4000;
  const TRIGGER_ID = 'att-err-sim-trigger';

  // ── Error scenario definitions ─────────────────────────────────────────────
  const SCENARIOS = [
    { value: '', label: '에러 시뮬레이션 선택…' },
    {
      value: '413',
      label: '413 — 파일 크기 초과',
      message: (esc) =>
        `파일 크기가 10MB를 초과합니다 (${esc('sample.pdf')}, 12.5MB). 더 작은 파일을 선택하세요.`,
    },
    {
      value: '415',
      label: '415 — 허용되지 않는 파일 형식',
      message: (esc) =>
        `허용되지 않는 파일 형식입니다 (${esc('.exe')}). 가능: pdf, png, jpg, xlsx 등.`,
    },
    {
      value: '400-count',
      label: '400 — 첨부 한도 초과',
      message: () => 'VOC당 첨부 한도(30건)를 초과합니다 (31/30).',
    },
    {
      value: '400-other',
      label: '400 — 업로드 실패 (기타)',
      message: () => '첨부 업로드에 실패했습니다. 잠시 후 다시 시도하세요.',
    },
  ];

  // ── Toast host (singleton) ─────────────────────────────────────────────────
  function getOrCreateHost() {
    let host = document.getElementById('attErrToastHost');
    if (!host) {
      host = document.createElement('div');
      host.id = 'attErrToastHost';
      host.className = 'att-err-toast-host';
      host.setAttribute('role', 'status');
      host.setAttribute('aria-live', 'assertive');
      document.body.appendChild(host);
    }
    return host;
  }

  // ── Render one error toast ─────────────────────────────────────────────────
  function showAttachmentError(kind) {
    const scenario = SCENARIOS.find((s) => s.value === kind);
    if (!scenario || !scenario.message) return;

    const esc = window.escHtml || ((s) => String(s));
    const msgText = scenario.message(esc);

    const host = getOrCreateHost();

    // Enforce stack limit — remove oldest if at cap
    const existing = host.querySelectorAll('.att-err-toast');
    if (existing.length >= TOAST_LIMIT) {
      dismissToast(existing[0]);
    }

    const toast = document.createElement('div');
    toast.className = 'att-err-toast';
    toast.setAttribute('role', 'alert');
    toast.innerHTML =
      `<svg class="att-err-toast-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">` +
      `<circle cx="8" cy="8" r="6.5"/>` +
      `<line x1="8" y1="5" x2="8" y2="8.5"/>` +
      `<circle cx="8" cy="11" r="0.5" fill="currentColor" stroke="none"/>` +
      `</svg>` +
      `<span class="att-err-toast-body">${msgText}</span>` +
      `<button class="att-err-toast-close" type="button" aria-label="닫기">&#x2715;</button>`;

    // Manual close
    toast.querySelector('.att-err-toast-close').addEventListener('click', () => {
      dismissToast(toast);
    });

    host.appendChild(toast);

    // Auto-dismiss after TOAST_DURATION_MS
    const timer = setTimeout(() => dismissToast(toast), TOAST_DURATION_MS);
    toast._attErrTimer = timer;

    // Re-initialize lucide icons if present
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  // ── Dismiss helper ─────────────────────────────────────────────────────────
  function dismissToast(toast) {
    if (!toast || !toast.parentNode) return;
    clearTimeout(toast._attErrTimer);
    toast.classList.add('out');
    setTimeout(() => toast.remove(), 320);
  }

  // ── Build the simulation trigger UI ───────────────────────────────────────
  function buildTrigger() {
    const wrap = document.createElement('div');
    wrap.className = 'att-err-trigger-wrap';
    wrap.id = 'att-err-trigger-wrap';

    const label = document.createElement('span');
    label.className = 'att-err-trigger-label';
    label.textContent = '에러 시뮬';

    const sel = document.createElement('select');
    sel.className = 'att-err-trigger';
    sel.id = TRIGGER_ID;
    sel.setAttribute('aria-label', '첨부 업로드 에러 시뮬레이션');

    SCENARIOS.forEach((s) => {
      const opt = document.createElement('option');
      opt.value = s.value;
      opt.textContent = s.label;
      if (!s.value) opt.disabled = false; // placeholder stays selectable to reset
      sel.appendChild(opt);
    });

    sel.addEventListener('change', () => {
      const kind = sel.value;
      if (kind) {
        showAttachmentError(kind);
        // Reset to placeholder so same option can fire again
        setTimeout(() => {
          sel.value = '';
        }, 100);
      }
    });

    wrap.appendChild(label);
    wrap.appendChild(sel);
    return wrap;
  }

  // ── Inject trigger into attachment section ────────────────────────────────
  function injectTrigger() {
    // Avoid double-injection
    if (document.getElementById('att-err-trigger-wrap')) return;

    const attSection = document.querySelector('.d-attachments');
    if (!attSection) return;

    attSection.appendChild(buildTrigger());
  }

  // ── Watch for drawer open via MutationObserver ────────────────────────────
  // drawer:opened CustomEvent is not yet dispatched; observe #drawer.open class.
  function observeDrawer() {
    const drawer = document.getElementById('drawer');
    if (!drawer) return;

    let wasOpen = drawer.classList.contains('open');

    const obs = new MutationObserver(() => {
      const isOpen = drawer.classList.contains('open');
      if (isOpen && !wasOpen) {
        // Drawer just opened — inject after DOM settles
        requestAnimationFrame(() => {
          requestAnimationFrame(injectTrigger);
        });
      }
      wasOpen = isOpen;
    });

    obs.observe(drawer, { attributes: true, attributeFilter: ['class'] });
  }

  // ── Init ──────────────────────────────────────────────────────────────────
  function init() {
    observeDrawer();
    // Expose for manual testing in console
    window.showAttachmentError = showAttachmentError;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
