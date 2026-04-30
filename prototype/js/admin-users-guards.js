// admin-users-guards.js — B-15 User 관리 가드 토스트
// Guards: D14 last-admin | D15 self-role | D16 self-deactivate
// Depends on: ADMIN_USERS (admin-master.js), showToast (dom-utils.js), CURRENT_USER_ID

// ── Current user id (홍길동 = id 1)
const GUARD_CURRENT_USER_ID = 1;

// ── Guard toast helper (wraps showToast warn, 4 s)
function guardToast(msg) {
  // showToast auto-dismisses at 1.8s; for a 4s warn we create a separate element
  let host = document.getElementById('guardToastHost');
  if (!host) {
    host = document.createElement('div');
    host.id = 'guardToastHost';
    host.className = 'guard-toast-host';
    host.setAttribute('aria-live', 'assertive');
    document.body.appendChild(host);
  }
  const el = document.createElement('div');
  el.className = 'guard-toast';
  el.setAttribute('role', 'alert');
  el.innerHTML =
    '<span class="guard-toast-icon" aria-hidden="true">&#9888;</span>' +
    '<span>' + escHtml(msg) + '</span>';
  host.appendChild(el);
  // trigger reflow so transition fires
  void el.offsetWidth;
  el.classList.add('guard-toast-in');
  setTimeout(function () { el.classList.add('guard-toast-out'); }, 3600);
  setTimeout(function () { el.remove(); }, 4000);
}

// ── D15: self-role guard
// Triggered by role <select> change on the current user's row
function onRoleSelectChange(selectEl, userId) {
  if (userId !== GUARD_CURRENT_USER_ID) return; // not self — allow
  const u = ADMIN_USERS.find(function (x) { return x.id === userId; });
  if (!u) return;
  // revert
  selectEl.value = u.role;
  guardToast('본인의 권한은 변경할 수 없습니다.');
}

// ── D14: last-admin guard
// Called before committing a role change away from 'admin'
// Returns true if the guard fired (caller should revert and stop)
function checkLastAdmin(userId, newRole) {
  if (newRole === 'admin') return false; // still admin — no guard
  const u = ADMIN_USERS.find(function (x) { return x.id === userId; });
  if (!u || u.role !== 'admin') return false; // not currently admin
  const activeAdminCount = ADMIN_USERS.filter(function (x) {
    return x.role === 'admin' && x.active;
  }).length;
  if (activeAdminCount <= 1) {
    guardToast('마지막 Admin은 다른 역할로 변경할 수 없습니다.');
    return true;
  }
  return false;
}

// ── D16: self-deactivate guard
// Triggered by is_active toggle for the current user's row
// Returns true if guard fired
function checkSelfDeactivate(userId, newActiveValue) {
  if (userId !== GUARD_CURRENT_USER_ID) return false;
  if (newActiveValue !== false && newActiveValue !== 0) return false;
  guardToast('본인 계정은 비활성화할 수 없습니다.');
  return true;
}

// ── Expose guards globally
window.onRoleSelectChange = onRoleSelectChange;
window.checkLastAdmin = checkLastAdmin;
window.checkSelfDeactivate = checkSelfDeactivate;

// ── Patch renderUsers to inject guard controls
// Override after admin-users.js has set up renderUsers
(function patchUsersTable() {
  const ROLE_OPTIONS = ['admin', 'manager', 'dev', 'user'];
  const ROLE_LABEL = { admin: 'Admin', manager: 'Manager', dev: 'Dev', user: 'User' };

  function buildRoleSelect(u) {
    var opts = ROLE_OPTIONS.map(function (r) {
      var sel = r === u.role ? ' selected' : '';
      return '<option value="' + r + '"' + sel + '>' + escHtml(ROLE_LABEL[r]) + '</option>';
    }).join('');
    var onChange = 'handleGuardRoleChange(this,' + u.id + ')';
    return '<select class="guard-role-select" onchange="' + onChange + '">' + opts + '</select>';
  }

  function buildActiveToggle(u) {
    var checked = u.active ? ' checked' : '';
    var onChange = 'handleGuardActiveChange(this,' + u.id + ')';
    return (
      '<label class="guard-toggle" title="' + (u.active ? '활성' : '비활성') + '">' +
      '<input type="checkbox"' + checked + ' onchange="' + onChange + '">' +
      '<span class="guard-toggle-track"></span>' +
      '</label>'
    );
  }

  function renderUsersGuard() {
    var tbody = document.getElementById('usersBody');
    if (!tbody) return;
    tbody.innerHTML = ADMIN_USERS.map(function (u) {
      var isSelf = u.id === GUARD_CURRENT_USER_ID;
      var selfMark = isSelf ? ' <span class="guard-self-badge">나</span>' : '';
      return (
        '<tr id="user-row-' + u.id + '" style="transition:opacity .2s">' +
        '<td><div style="display:flex;align-items:center;gap:9px">' +
        '<div class="user-avatar-sm">' + escHtml(u.init) + '</div>' +
        '<span class="td-primary">' + escHtml(u.name) + '</span>' + selfMark +
        '</div></td>' +
        '<td style="font-family:var(--font-mono);font-size:12px;color:var(--text-tertiary)">' +
        escHtml(u.email) + '</td>' +
        '<td>' + buildRoleSelect(u) + '</td>' +
        '<td>' + buildActiveToggle(u) + '</td>' +
        '<td style="font-size:12px;color:var(--text-tertiary)">' + escHtml(u.lastSeen) + '</td>' +
        '<td style="text-align:right">' +
        '<button class="a-btn danger" onclick="deleteUser(' + u.id + ')">삭제</button>' +
        '</td>' +
        '</tr>'
      );
    }).join('');
    document.getElementById('userCount').textContent = ADMIN_USERS.length + '명';
  }

  // D15 + D14 combined handler for role <select>
  window.handleGuardRoleChange = function (selectEl, userId) {
    var newRole = selectEl.value;
    // D15: self-role guard
    if (userId === GUARD_CURRENT_USER_ID) {
      var u = ADMIN_USERS.find(function (x) { return x.id === userId; });
      if (u) selectEl.value = u.role;
      guardToast('본인의 권한은 변경할 수 없습니다.');
      return;
    }
    // D14: last-admin guard
    if (checkLastAdmin(userId, newRole)) {
      var u2 = ADMIN_USERS.find(function (x) { return x.id === userId; });
      if (u2) selectEl.value = u2.role;
      return;
    }
    // Allow: commit the change
    var target = ADMIN_USERS.find(function (x) { return x.id === userId; });
    if (target) target.role = newRole;
  };

  // D16 handler for active toggle
  window.handleGuardActiveChange = function (checkboxEl, userId) {
    var newVal = checkboxEl.checked;
    if (!newVal && checkSelfDeactivate(userId, false)) {
      checkboxEl.checked = true; // revert
      return;
    }
    var target = ADMIN_USERS.find(function (x) { return x.id === userId; });
    if (target) target.active = newVal;
  };

  // Replace renderUsers once DOM is ready
  document.addEventListener('DOMContentLoaded', function () {
    window.renderUsers = renderUsersGuard;
    renderUsersGuard();
  });
})();
