const ROLE_MAP = { admin: 'Admin', manager: 'Manager', user: 'User' };
const ROLE_CLS = { admin: 'role-admin', manager: 'role-manager', user: 'role-user' };
function renderUsers() {
  const tbody = document.getElementById('usersBody');
  tbody.innerHTML = ADMIN_USERS.map(
    (u) => `
    <tr id="user-row-${u.id}" style="transition:opacity .2s">
      <td><div style="display:flex;align-items:center;gap:9px">
        <div class="user-avatar-sm">${u.init}</div>
        <span class="td-primary">${u.name}</span>
      </div></td>
      <td style="font-family:var(--font-mono);font-size:12px;color:var(--text-tertiary)">${u.email}</td>
      <td><span class="role-pill ${ROLE_CLS[u.role]}">${ROLE_MAP[u.role]}</span></td>
      <td>
        <span class="status-dot ${u.active ? 'on' : 'off'}"></span>
        <span style="font-size:12px;color:${u.active ? 'var(--status-green)' : 'var(--text-quaternary)'}">${u.active ? '활성' : '비활성'}</span>
      </td>
      <td style="font-size:12px;color:var(--text-tertiary)">${u.lastSeen}</td>
      <td style="text-align:right">
        <div style="display:flex;gap:6px;justify-content:flex-end">
          <button class="a-btn" onclick="editUser(${u.id})">역할 변경</button>
          <button class="a-btn danger" onclick="deleteUser(${u.id})">삭제</button>
        </div>
      </td>
    </tr>`,
  ).join('');
  document.getElementById('userCount').textContent = `${ADMIN_USERS.length}명`;
}

// ── Tag Rule actions
let pendingKws = [];
function toggleAddRuleForm() {
  const f = document.getElementById('addRuleForm');
  f.classList.toggle('open');
  if (f.classList.contains('open')) {
    pendingKws = [];
    syncKwTokens();
    setTimeout(() => document.getElementById('kwRawInput').focus(), 50);
  }
}
function handleKwInput(e) {
  if (e.key === 'Enter' || e.key === ',') {
    e.preventDefault();
    const v = e.target.value.trim();
    if (v && !pendingKws.includes(v)) {
      pendingKws.push(v);
      syncKwTokens();
    }
    e.target.value = '';
  } else if (e.key === 'Backspace' && !e.target.value && pendingKws.length) {
    pendingKws.pop();
    syncKwTokens();
  }
}
function syncKwTokens() {
  const wrap = document.getElementById('kwInputWrap');
  const inp = document.getElementById('kwRawInput');
  wrap.querySelectorAll('.kw-tag-token').forEach((t) => t.remove());
  pendingKws.forEach((k, i) => {
    const t = document.createElement('span');
    t.className = 'kw-tag-token';
    t.innerHTML = `${k}<span class="rm" onclick="removeKw(${i})">✕</span>`;
    wrap.insertBefore(t, inp);
  });
}
function removeKw(i) {
  pendingKws.splice(i, 1);
  syncKwTokens();
}
function addRule() {
  const tag = document.getElementById('newRuleTag').value.trim();
  const type = document.getElementById('newRuleType').value;
  if (!pendingKws.length || !tag) return;
  ADMIN_RULES.push({ id: ruleNextId++, kw: [...pendingKws], tag, type, active: true });
  renderTagRules();
  document.getElementById('newRuleTag').value = '';
  document.getElementById('addRuleForm').classList.remove('open');
  pendingKws = [];
}
function toggleRuleActive(id) {
  const r = ADMIN_RULES.find((x) => x.id === id);
  if (r) {
    r.active = !r.active;
    renderTagRules();
  }
}
function deleteRule(id) {
  const row = document.getElementById(`rule-row-${id}`);
  if (row) {
    row.style.opacity = '0';
    setTimeout(() => {
      ADMIN_RULES = ADMIN_RULES.filter((x) => x.id !== id);
      renderTagRules();
    }, 200);
  }
}

// ── Category actions
function toggleAddCatForm() {
  document.getElementById('addCatForm').classList.toggle('open');
}
function addCategory() {
  const name = document.getElementById('newCatName').value.trim();
  const color = document.getElementById('newCatColor').value;
  const desc = document.getElementById('newCatDesc').value.trim();
  if (!name) return;
  ADMIN_CATS.push({ id: catNextId++, name, color, desc, count: 0 });
  renderCategories();
  document.getElementById('newCatName').value = '';
  document.getElementById('newCatDesc').value = '';
  document.getElementById('addCatForm').classList.remove('open');
}
function editCat(id) {
  const c = ADMIN_CATS.find((x) => x.id === id);
  if (!c) return;
  const name = prompt('카테고리명', c.name);
  if (!name) return;
  const desc = prompt('설명', c.desc) || '';
  c.name = name.trim();
  c.desc = desc.trim();
  renderCategories();
}
function deleteCat(id) {
  const row = document.getElementById(`cat-row-${id}`);
  if (row) {
    row.style.opacity = '0';
    setTimeout(() => {
      ADMIN_CATS = ADMIN_CATS.filter((x) => x.id !== id);
      renderCategories();
    }, 200);
  }
}

// ── User actions
function toggleAddUserForm() {
  document.getElementById('addUserForm').classList.toggle('open');
}
function inviteUser() {
  const name = document.getElementById('newUserName').value.trim();
  const email = document.getElementById('newUserEmail').value.trim();
  const role = document.getElementById('newUserRole').value;
  if (!name || !email) return;
  ADMIN_USERS.push({
    id: userNextId++,
    name,
    init: name[0],
    email,
    role,
    active: true,
    lastSeen: '방금 전',
  });
  renderUsers();
  document.getElementById('newUserName').value = '';
  document.getElementById('newUserEmail').value = '';
  document.getElementById('addUserForm').classList.remove('open');
}
function editUser(id) {
  const u = ADMIN_USERS.find((x) => x.id === id);
  if (!u) return;
  const opts = Object.entries(ROLE_MAP)
    .map(([k, v]) => v)
    .join(' / ');
  const input = prompt(`역할 변경 (${opts})`, ROLE_MAP[u.role]);
  if (!input) return;
  const found = Object.entries(ROLE_MAP).find(
    ([, v]) => v.toLowerCase() === input.trim().toLowerCase(),
  );
  if (found) {
    u.role = found[0];
    renderUsers();
  } else alert(`올바른 역할: ${opts}`);
}
function deleteUser(id) {
  const row = document.getElementById(`user-row-${id}`);
  if (row) {
    row.style.opacity = '0';
    setTimeout(() => {
      ADMIN_USERS = ADMIN_USERS.filter((x) => x.id !== id);
      renderUsers();
    }, 200);
  }
}
