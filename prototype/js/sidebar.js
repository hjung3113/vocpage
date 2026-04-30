// ── Sidebar system/menu filter
function renderSidebar() {
  const el = document.getElementById('sidebarSystems');
  if (!el) return;
  el.innerHTML = SYSTEMS.filter((s) => !s.archived)
    .map((sys) => {
      const sysMenus = MENUS.filter((m) => m.systemId === sys.id && !m.archived);
      const sysCount = VOCDATA.filter((v) => v.systemId === sys.id).length;
      const isOpen = openSysId === sys.id;
      const isSysActive = activeSysId === sys.id && !activeMenuId;
      return `
      <div class="sys-header${isOpen ? ' open' : ''}${isSysActive ? ' active' : ''}" onclick="setSysFilter('${sys.id}')">
        <i data-lucide="${sys.icon}" class="sys-header-icon"></i>
        <span class="sys-header-name">${sys.name}</span>
        <span class="nav-badge muted">${sysCount}</span>
        <i data-lucide="chevron-right" class="sys-chevron"></i>
      </div>
      <div class="sys-menus${isOpen ? ' open' : ''}">
        ${sysMenus
          .map((m) => {
            const cnt = VOCDATA.filter((v) => v.menuId === m.id).length;
            const isActive = activeMenuId === m.id;
            return `<div class="sys-menu-item${isActive ? ' active' : ''}" onclick="setMenuFilter('${m.id}')">${m.name} <span class="nav-badge muted" style="margin-left:auto">${cnt}</span></div>`;
          })
          .join('')}
      </div>`;
    })
    .join('');
  lucide.createIcons();
}

function switchToVocPage() {
  const vocPage = document.getElementById('page-voc');
  const isAdminActive = [...document.querySelectorAll('.admin-page')].some((p) =>
    p.classList.contains('active'),
  );
  if (isAdminActive) {
    document.querySelectorAll('.admin-page').forEach((p) => p.classList.remove('active'));
    document.querySelectorAll('.info-page').forEach((p) => p.classList.remove('active'));
    vocPage.classList.remove('hidden');
  }
  document.querySelectorAll('.nav-item').forEach((n) => n.classList.remove('active'));
}

function updateVocTitle() {
  const titleEl = document.getElementById('topbarTitle');
  if (!titleEl) return;
  if (activeSysId && activeMenuId) {
    const sys = SYS_MAP[activeSysId];
    const menu = MENU_MAP[activeMenuId];
    titleEl.textContent = `VOC / ${sys?.name || activeSysId} / ${menu?.name || activeMenuId}`;
  } else if (activeSysId) {
    const sys = SYS_MAP[activeSysId];
    titleEl.textContent = `VOC / ${sys?.name || activeSysId}`;
  } else {
    const titleMap = { all: '전체 VOC', mine: '내 VOC', assigned: '담당 VOC' };
    titleEl.textContent = titleMap[currentView] || '전체 VOC';
  }
}

function setSysFilter(sysId) {
  switchToVocPage();
  if (activeSysId === sysId && !activeMenuId) {
    openSysId = openSysId === sysId ? null : sysId;
  } else {
    activeSysId = sysId;
    activeMenuId = null;
    openSysId = sysId;
  }
  updateVocTitle();
  renderSidebar();
  currentPage = 1;
  renderVOCList();
}

function setMenuFilter(menuId) {
  const menu = MENU_MAP[menuId];
  if (!menu) return;
  switchToVocPage();
  activeSysId = menu.systemId;
  activeMenuId = menuId;
  openSysId = menu.systemId;
  updateVocTitle();
  renderSidebar();
  currentPage = 1;
  renderVOCList();
}

// ── Nav
function setNav(el) {
  document.querySelectorAll('.nav-item').forEach((n) => n.classList.remove('active'));
  el.classList.add('active');
  const view = el.dataset.view;
  const page = el.dataset.page;
  const vocPage = document.getElementById('page-voc');
  const adminPages = document.querySelectorAll('.admin-page');
  const infoPages = document.querySelectorAll('.info-page');

  if (view === 'notices' || view === 'faq') {
    vocPage.classList.add('hidden');
    adminPages.forEach((p) => p.classList.remove('active'));
    infoPages.forEach((p) => p.classList.remove('active'));
    const target = document.getElementById('page-' + view);
    if (target) target.classList.add('active');
    document.getElementById('topbarTitle').textContent = view === 'notices' ? '공지사항' : 'FAQ';
    if (view === 'notices') renderNotices();
    if (view === 'faq') renderFaq();
    lucide.createIcons();
  } else if (!page) {
    vocPage.classList.remove('hidden');
    adminPages.forEach((p) => p.classList.remove('active'));
    infoPages.forEach((p) => p.classList.remove('active'));
    activeSysId = null;
    activeMenuId = null;
    openSysId = null;
    currentView = view || 'all';
    const titleMap = { all: '전체 VOC', mine: '내 VOC', assigned: '담당 VOC' };
    document.getElementById('topbarTitle').textContent = titleMap[currentView];
    currentPage = 1;
    renderSidebar();
    renderVOCList();
  } else {
    vocPage.classList.add('hidden');
    adminPages.forEach((p) => p.classList.remove('active'));
    infoPages.forEach((p) => p.classList.remove('active'));
    const target = document.getElementById('page-' + page);
    if (target) target.classList.add('active');
    if (page === 'tag-rules') renderTagRules();
    if (page === 'system-menu') renderSystemMenu();
    if (page === 'voc-type') renderVocTypes();
    if (page === 'users') renderUsers();
    if (page === 'result-review') renderResultReview();
    if (page === 'dashboard') dashboardInit();
    if (page === 'trash') AdminTrash.render();
    lucide.createIcons();
  }
}

// ── Accordion
function toggleExpand(btnId, containerId) {
  const btn = document.getElementById(btnId);
  const wrap = document.getElementById(containerId);
  if (!btn || !wrap) return;
  btn.classList.toggle('open');
  wrap.classList.toggle('open');
}
