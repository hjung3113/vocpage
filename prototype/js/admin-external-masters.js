// Stage B-12 P-10 — External Masters 관리 prototype module
// Depends on: dom-utils.js (escHtml, showToast), admin-external-masters-data.js
// Export: window.AdminExternalMasters = { render }

var EM_STATUS = {
  loaded: { label: '정상', cls: 'em-badge-loaded' },
  'cold-start': { label: '콜드 스타트', cls: 'em-badge-cold' },
  snapshot: { label: '스냅샷 모드', cls: 'em-badge-snapshot' },
  error: { label: '오류', cls: 'em-badge-error' },
};
var EM_HIST = {
  ok: { icon: 'check-circle', cls: 'em-hist-ok' },
  error: { icon: 'x-circle', cls: 'em-hist-error' },
};
var EM_COOLDOWN_MS = 5 * 60 * 1000;

function showEmToast(msg, kind) {
  if (typeof window.showToast === 'function') window.showToast(msg, kind);
}

// Shared timestamp formatter (DRY)
function emFormatNow() {
  var now = new Date();
  return (
    now.getFullYear() +
    '-' +
    String(now.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(now.getDate()).padStart(2, '0') +
    ' ' +
    String(now.getHours()).padStart(2, '0') +
    ':' +
    String(now.getMinutes()).padStart(2, '0') +
    ':' +
    String(now.getSeconds()).padStart(2, '0')
  );
}

// Returns "M:SS" remaining string, or null if cooldown expired
function emCooldownRemaining(lastRefreshedAt) {
  if (!lastRefreshedAt) return null;
  var remaining = EM_COOLDOWN_MS - (Date.now() - lastRefreshedAt);
  if (remaining <= 0) return null;
  return (
    Math.floor(remaining / 60000) +
    ':' +
    String(Math.floor((remaining % 60000) / 1000)).padStart(2, '0')
  );
}

function renderEmCard(m) {
  var esc = window.escHtml;
  var status = EM_STATUS[m.status] || EM_STATUS['error'];
  var histHtml;

  if (m.history && m.history.length) {
    var rows = m.history
      .map(function (h) {
        var hc = EM_HIST[h.result] || EM_HIST['error'];
        return (
          '<li class="em-hist-row ' +
          hc.cls +
          '">' +
          '<i data-lucide="' +
          hc.icon +
          '" class="em-hist-icon"></i>' +
          '<span class="em-hist-time">' +
          esc(h.at) +
          '</span>' +
          '<span class="em-hist-note">' +
          esc(h.note) +
          '</span></li>'
        );
      })
      .join('');
    histHtml =
      '<details class="em-history" open>' +
      '<summary class="em-history-summary">' +
      '<i data-lucide="history" style="width:12px;height:12px;vertical-align:-2px"></i>' +
      ' 최근 새로고침 이력</summary><ul class="em-hist-list">' +
      rows +
      '</ul></details>';
  } else {
    histHtml =
      '<div class="em-no-history">' +
      '<i data-lucide="clock-x" style="width:13px;height:13px;color:var(--text-quaternary);vertical-align:-2px"></i>' +
      ' <span>이력 없음 — 아직 새로고침이 실행된 적 없습니다.</span></div>';
  }

  // Snapshot: surface both snapshotAt and lastAttemptAt as 2 lines
  var timestampHtml;
  if (m.status === 'snapshot' && m.snapshotAt && m.lastAttemptAt) {
    timestampHtml =
      '<div style="display:flex;flex-direction:column;gap:2px">' +
      '<span class="em-meta-item"><i data-lucide="camera" style="width:11px;height:11px;vertical-align:-2px"></i> 스냅샷: ' +
      esc(m.snapshotAt) +
      '</span>' +
      '<span class="em-meta-item"><i data-lucide="clock" style="width:11px;height:11px;vertical-align:-2px"></i> 최근 시도: ' +
      esc(m.lastAttemptAt) +
      '</span>' +
      '</div>';
  } else {
    var loadedStr = m.loadedAt
      ? esc(m.loadedAt)
      : '<span style="color:var(--text-quaternary)">—</span>';
    timestampHtml =
      '<span class="em-meta-item"><i data-lucide="clock" style="width:11px;height:11px;vertical-align:-2px"></i> 마지막 갱신: ' +
      loadedStr +
      '</span>';
  }

  var countStr = m.loadedAt
    ? esc(String(m.itemCount)) + '건'
    : '<span style="color:var(--text-quaternary)">0건</span>';

  var cooldownLeft = emCooldownRemaining(m.lastRefreshedAt);
  var refreshBtn;
  if (m.refreshable) {
    if (cooldownLeft) {
      refreshBtn =
        '<button type="button" class="admin-btn" disabled>' +
        '<i data-lucide="clock" style="width:12px;height:12px;vertical-align:-2px"></i>' +
        ' 쿨다운 (' +
        esc(cooldownLeft) +
        ')</button>';
    } else {
      refreshBtn =
        '<button type="button" class="admin-btn em-refresh-btn" data-id="' +
        esc(m.id) +
        '">' +
        '<i data-lucide="refresh-cw" style="width:12px;height:12px;vertical-align:-2px"></i> 새로고침</button>';
    }
  } else {
    refreshBtn =
      '<span class="em-no-refresh">' +
      '<i data-lucide="lock" style="width:11px;height:11px;vertical-align:-2px"></i> 서버 재시작 전용</span>';
  }

  return (
    '<div class="em-card" data-id="' +
    esc(m.id) +
    '">' +
    '<div class="em-card-header">' +
    '<span class="em-card-name">' +
    esc(m.name) +
    '</span>' +
    '<span class="em-badge ' +
    status.cls +
    '">' +
    esc(status.label) +
    '</span>' +
    '</div>' +
    '<div class="em-card-source">' +
    '<i data-lucide="database" style="width:11px;height:11px;vertical-align:-2px;color:var(--text-quaternary)"></i> ' +
    esc(m.source) +
    '</div>' +
    '<div class="em-card-meta">' +
    '<span class="em-meta-item"><i data-lucide="layers" style="width:11px;height:11px;vertical-align:-2px"></i> ' +
    countStr +
    '</span>' +
    timestampHtml +
    '</div>' +
    histHtml +
    '<div class="em-card-footer">' +
    refreshBtn +
    '</div>' +
    '</div>'
  );
}

// Cold-start is system-wide; show banner if any source is cold-start or mock flag is set
function renderColdStartBanner() {
  var banner = document.getElementById('emColdStartBanner');
  if (!banner) return;
  var data = window.externalMastersData || [];
  var isColdStart = data.some(function (m) {
    return m.status === 'cold-start';
  });
  banner.style.display = isColdStart || window.emMockColdStart ? 'flex' : 'none';
}

function renderExternalMasters() {
  var section = document.getElementById('page-external-masters');
  if (!section) return;
  renderColdStartBanner();
  var data = window.externalMastersData || [];
  var grid = document.getElementById('emGrid');
  if (!grid) return;

  if (!data.length) {
    grid.innerHTML =
      '<div class="em-empty-state">' +
      '<i data-lucide="database-x" style="width:32px;height:32px;color:var(--text-quaternary)"></i>' +
      '<span>등록된 외부 마스터가 없습니다.</span></div>';
  } else {
    grid.innerHTML = data.map(renderEmCard).join('');
  }

  if (window.lucide) lucide.createIcons();

  grid.querySelectorAll('.em-refresh-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      emRefreshOne(btn.dataset.id);
    });
  });

  // Re-render every second while a cooldown is active
  var hasCooldown = data.some(function (m) {
    return m.lastRefreshedAt && emCooldownRemaining(m.lastRefreshedAt) !== null;
  });
  if (hasCooldown) setTimeout(renderExternalMasters, 1000);
}

function emRefreshOne(id) {
  var data = window.externalMastersData || [];
  var m = data.find(function (x) {
    return x.id === id;
  });
  if (!m || !m.refreshable) return;
  showEmToast(m.name + ' 새로고침 중…', 'info');
  setTimeout(function () {
    var ts = emFormatNow();
    m.loadedAt = ts;
    m.status = 'loaded';
    m.itemCount = m.itemCount + Math.floor(Math.random() * 5);
    m.lastRefreshedAt = Date.now();
    if (!m.history) m.history = [];
    m.history.unshift({ at: ts, result: 'ok', note: '새로고침 성공 (' + m.itemCount + '건)' });
    if (m.history.length > 3) m.history = m.history.slice(0, 3);
    showEmToast(m.name + ' 새로고침 완료 (' + m.itemCount + '건)', 'ok');
    renderExternalMasters();
  }, 900);
}

// Bulk refresh MSSQL sources only (program master requires server restart)
function emRefreshAll() {
  var data = window.externalMastersData || [];
  var refreshable = data.filter(function (m) {
    return m.refreshable;
  });
  if (!refreshable.length) return;
  refreshable.forEach(function (m) {
    showEmToast(m.name + ' 새로고침 중…', 'info');
  });
  setTimeout(function () {
    var ts = emFormatNow();
    refreshable.forEach(function (m) {
      // Q5 atomic-swap demo: set window.emSimulateError=true to leave equipment in error state
      if (window.emSimulateError && m.id === 'equipment') {
        m.status = 'error';
        if (!m.history) m.history = [];
        m.history.unshift({
          at: ts,
          result: 'error',
          note: '전체 새로고침 — 연결 실패 (다른 소스는 정상 완료)',
        });
        if (m.history.length > 3) m.history = m.history.slice(0, 3);
        showEmToast(m.name + ' 실패 — 나머지 소스는 정상 완료', 'error');
        return;
      }
      m.loadedAt = ts;
      m.status = 'loaded';
      m.itemCount = m.itemCount + Math.floor(Math.random() * 5);
      m.lastRefreshedAt = Date.now();
      if (!m.history) m.history = [];
      m.history.unshift({
        at: ts,
        result: 'ok',
        note: '전체 새로고침 성공 (' + m.itemCount + '건)',
      });
      if (m.history.length > 3) m.history = m.history.slice(0, 3);
      showEmToast(m.name + ' 완료 (' + m.itemCount + '건)', 'ok');
    });
    renderExternalMasters();
  }, 1200);
}

window.AdminExternalMasters = { render: renderExternalMasters };
window.emRefreshAll = emRefreshAll;
