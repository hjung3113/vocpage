// ── P-8 Trash Confirm Modal (Stage B-7 D23) — extracted from admin-trash.js
// Depends on: #trConfirmBg, #trConfirmTitle, #trConfirmBody, #trConfirmFooter
(function () {
  var _inited = false;

  function initTrConfirmBg() {
    if (_inited) return;
    _inited = true;
    var bg = document.getElementById('trConfirmBg');
    if (!bg) return;
    bg.addEventListener('click', function (e) {
      if (e.target === bg) closeTrConfirm();
    });
  }

  function openTrConfirm(opts) {
    // opts: { title, bodyHtml, confirmLabel, danger, onConfirm }
    var bg = document.getElementById('trConfirmBg');
    if (!bg) return;
    initTrConfirmBg();

    document.getElementById('trConfirmTitle').textContent = opts.title;
    document.getElementById('trConfirmBody').innerHTML = opts.bodyHtml;

    var footer = document.getElementById('trConfirmFooter');
    footer.innerHTML =
      '<div></div>' +
      '<div class="footer-actions">' +
      '<button type="button" class="btn-ghost" onclick="closeTrConfirm()">취소</button>' +
      '<button type="button" class="a-btn ' +
      (opts.danger ? 'danger' : 'primary') +
      '" id="trConfirmOk">' +
      escHtml(opts.confirmLabel) +
      '</button>' +
      '</div>';

    document.getElementById('trConfirmOk').onclick = function () {
      closeTrConfirm();
      opts.onConfirm();
    };

    bg.hidden = false;
    bg.classList.add('open');
    lucide.createIcons({ nodes: [bg] });
  }

  function closeTrConfirm() {
    var bg = document.getElementById('trConfirmBg');
    if (!bg) return;
    bg.classList.remove('open');
    bg.hidden = true;
  }

  window.openTrConfirm = openTrConfirm;
  window.closeTrConfirm = closeTrConfirm;
})();
