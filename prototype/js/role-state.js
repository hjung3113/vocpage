// B-5 Role Toggle (Wave 2) — admin / manager / dev / user demo switcher.
// spec: docs/specs/requires/feature-voc.md §8.3 / §8.2.1, uidesign §13.3, requirements §15.1
// Loads BEFORE init.js so init can call RoleState.init() at startup.
//
// SECURITY MODEL — IMPORTANT FOR PHASE 8 REACT MIGRATION:
// `data-role-allow` 속성 기반 nav 숨김은 **client-side cosmetic only**. 권한의 정본은
// BE 단일 helper `assertCanManageVoc(user, voc, action)` (feature-voc.md §8.4-bis).
// React 이관 시 이 패턴을 그대로 옮기면 라우트 가드 누락 위험 — 각 admin 페이지에
// 독립적인 server-side 인증/인가 가드를 별도 구현해야 함. devtools에서 attribute 1개로
// 우회 가능하므로 보안 경계로 사용 금지.

(function () {
  'use strict';

  // Mock users per role — names + ids for demo only.
  // 'admin' overrides init.js default to keep behavior identical out-of-box.
  var ROLE_USERS = {
    admin: { id: 'u-admin', name: '이분석', role: 'admin', avatar: '이' },
    manager: { id: 'u-manager', name: '박매니저', role: 'manager', avatar: '박' },
    dev: { id: 'u-dev', name: '김개발', role: 'dev', avatar: '김' },
    user: { id: 'u-user', name: '홍길동', role: 'user', avatar: '홍' },
  };

  var ROLE_LABEL = { admin: 'Admin', manager: 'Manager', dev: 'Dev', user: 'User' };
  // Order per uidesign.md §13.3 line 900 — descending capability.
  var ROLE_ORDER = ['admin', 'manager', 'dev', 'user'];

  function escHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function getRole() {
    return (window.currentUser && window.currentUser.role) || 'user';
  }

  function setCurrentRole(role) {
    if (!ROLE_USERS[role]) {
      console.warn('[RoleState] unknown role:', role);
      return;
    }
    window.currentUser = Object.assign({}, ROLE_USERS[role]);
    renderSidebarUser();
    applyRoleVisibility();
    closePopover();
    showRoleToast(role);
    // Re-render any active admin page that depends on role.
    // global: admin-users.js exposes renderUsers() at top level.
    var activeAdmin = document.querySelector('.admin-page.active');
    if (activeAdmin && activeAdmin.id === 'page-users' && typeof renderUsers === 'function') {
      renderUsers();
    }
    // Notify other modules (B-13 drawer, B-15 user guards, B-17 dashboard settings)
    document.dispatchEvent(new CustomEvent('role:change', { detail: { role: role } }));
  }

  function renderSidebarUser() {
    var u = window.currentUser || ROLE_USERS.user;
    var avatarEl = document.querySelector('.sidebar-user .user-avatar');
    var nameEl = document.querySelector('.sidebar-user .user-name');
    var roleEl = document.querySelector('.sidebar-user .user-role');
    if (avatarEl) avatarEl.textContent = u.avatar || (u.name || '?').slice(0, 1);
    if (nameEl) nameEl.textContent = u.name || '';
    if (roleEl) {
      roleEl.innerHTML =
        '<span class="role-pill role-' +
        escHtml(u.role) +
        '">' +
        escHtml(ROLE_LABEL[u.role] || u.role) +
        '</span>';
    }
  }

  /**
   * Apply role-based visibility to nav items.
   * Each `[data-role-allow]` element is shown only when the current role is in
   * its space-separated whitelist. The "관리자" section auto-collapses (along
   * with the preceding `.sidebar-divider`) when all its items are hidden.
   *
   * NOTE: cosmetic only — see SECURITY MODEL header. Not a permission boundary.
   */
  function applyRoleVisibility() {
    var role = getRole();
    document.querySelectorAll('[data-role-allow]').forEach(function (el) {
      var allow = (el.getAttribute('data-role-allow') || '').split(/\s+/);
      var ok = allow.indexOf(role) !== -1;
      el.setAttribute('data-role-hide', ok ? 'false' : 'true');
    });
    var adminSection = document.querySelector('[data-role-section="admin"]');
    if (adminSection) {
      var visible = adminSection.querySelectorAll(
        '.nav-item[data-role-allow]:not([data-role-hide="true"])',
      ).length;
      adminSection.setAttribute('data-role-hide', visible === 0 ? 'true' : 'false');
      var divider = adminSection.previousElementSibling;
      if (divider && divider.classList.contains('sidebar-divider')) {
        divider.setAttribute('data-role-hide', visible === 0 ? 'true' : 'false');
      }
    }
  }

  function buildPopover() {
    var pop = document.getElementById('rolePopover');
    if (pop) return pop;
    pop = document.createElement('div');
    pop.id = 'rolePopover';
    pop.className = 'role-popover';
    pop.setAttribute('role', 'menu');
    pop.setAttribute('aria-label', '역할 전환 (데모)');
    pop.innerHTML =
      '<div class="role-popover-label">역할 (데모)</div>' +
      ROLE_ORDER.map(function (r) {
        var u = ROLE_USERS[r];
        return (
          '<button class="role-popover-item" role="menuitemradio" data-role="' +
          escHtml(r) +
          '" type="button" tabindex="-1">' +
          '<span class="role-pill role-' +
          escHtml(r) +
          '">' +
          escHtml(ROLE_LABEL[r]) +
          '</span>' +
          '<span class="role-pop-name">' +
          escHtml(u.name) +
          '</span>' +
          '<i data-lucide="check" class="role-pop-check"></i>' +
          '</button>'
        );
      }).join('');
    document.body.appendChild(pop);
    pop.addEventListener('click', function (e) {
      var btn = e.target.closest('.role-popover-item');
      if (!btn) return;
      setCurrentRole(btn.getAttribute('data-role'));
    });
    pop.addEventListener('keydown', onPopoverKey);
    return pop;
  }

  function syncPopoverChecked() {
    var role = getRole();
    document.querySelectorAll('#rolePopover .role-popover-item').forEach(function (b) {
      b.setAttribute('aria-checked', b.getAttribute('data-role') === role ? 'true' : 'false');
    });
  }

  function popoverItems() {
    return [].slice.call(document.querySelectorAll('#rolePopover .role-popover-item'));
  }

  function focusItem(idx) {
    var items = popoverItems();
    if (!items.length) return;
    var i = ((idx % items.length) + items.length) % items.length;
    items[i].focus();
  }

  function onPopoverKey(e) {
    var items = popoverItems();
    if (!items.length) return;
    var current = items.indexOf(document.activeElement);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      focusItem(current < 0 ? 0 : current + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      focusItem(current < 0 ? items.length - 1 : current - 1);
    } else if (e.key === 'Home') {
      e.preventDefault();
      focusItem(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      focusItem(items.length - 1);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closePopover();
      var trigger = document.querySelector('.sidebar-user');
      if (trigger) trigger.focus();
    }
  }

  function setExpanded(open) {
    var trigger = document.querySelector('.sidebar-user');
    if (trigger) trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  function openPopover() {
    var pop = buildPopover();
    syncPopoverChecked();
    pop.setAttribute('data-open', 'true');
    setExpanded(true);
    if (window.lucide && typeof lucide.createIcons === 'function') {
      try {
        lucide.createIcons({ el: pop });
      } catch (_) {
        lucide.createIcons();
      }
    }
    // Move focus to checked item for keyboard users.
    setTimeout(function () {
      var checked = pop.querySelector('.role-popover-item[aria-checked="true"]');
      if (checked) checked.focus();
    }, 0);
  }

  function closePopover() {
    var pop = document.getElementById('rolePopover');
    if (pop) pop.setAttribute('data-open', 'false');
    setExpanded(false);
  }

  function togglePopover(e) {
    if (e) e.stopPropagation();
    var pop = document.getElementById('rolePopover');
    if (pop && pop.getAttribute('data-open') === 'true') closePopover();
    else openPopover();
  }

  function showRoleToast(role) {
    var existing = document.getElementById('roleToast');
    if (existing) existing.remove();
    var t = document.createElement('div');
    t.id = 'roleToast';
    t.className = 'role-toast';
    t.setAttribute('role', 'status');
    t.innerHTML =
      '<span class="role-pill role-' +
      escHtml(role) +
      '">' +
      escHtml(ROLE_LABEL[role]) +
      '</span>' +
      '<span>로 전환했습니다 (데모)</span>';
    document.body.appendChild(t);
    setTimeout(function () {
      t.classList.add('fade-out');
      setTimeout(function () {
        if (t.parentNode) t.parentNode.removeChild(t);
      }, 300);
    }, 2400);
  }

  function init() {
    // Default role: keep init.js mock (admin) unless overridden.
    if (!window.currentUser || !ROLE_USERS[window.currentUser.role]) {
      window.currentUser = Object.assign({}, ROLE_USERS.admin);
    } else {
      window.currentUser = Object.assign(
        {},
        ROLE_USERS[window.currentUser.role],
        window.currentUser,
      );
    }
    renderSidebarUser();
    applyRoleVisibility();
    var trigger = document.querySelector('.sidebar-user');
    if (trigger) {
      trigger.setAttribute('role', 'button');
      trigger.setAttribute('aria-haspopup', 'menu');
      trigger.setAttribute('aria-expanded', 'false');
      trigger.setAttribute('tabindex', '0');
      trigger.addEventListener('click', togglePopover);
      trigger.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          togglePopover(e);
        } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault();
          openPopover();
        }
      });
    }
    document.addEventListener('click', function (e) {
      var pop = document.getElementById('rolePopover');
      if (!pop || pop.getAttribute('data-open') !== 'true') return;
      if (pop.contains(e.target) || (trigger && trigger.contains(e.target))) return;
      closePopover();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        var pop = document.getElementById('rolePopover');
        if (pop && pop.getAttribute('data-open') === 'true') {
          closePopover();
          if (trigger) trigger.focus();
        }
      }
    });
  }

  window.RoleState = {
    init: init,
    setCurrentRole: setCurrentRole,
    getRole: getRole,
    applyRoleVisibility: applyRoleVisibility,
    ROLE_USERS: ROLE_USERS,
    ROLE_LABEL: ROLE_LABEL,
    ROLE_ORDER: ROLE_ORDER,
  };
})();
