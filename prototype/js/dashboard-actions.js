function dashToggleEdit() {
  dashEditMode = !dashEditMode;
  const page = document.getElementById('page-dashboard');
  page.classList.toggle('edit-mode', dashEditMode);
  const btn = document.getElementById('dashEditBtn');
  if (dashEditMode) {
    btn.classList.add('dash-edit-btn-active');
    btn.innerHTML = '<i data-lucide="check" style="width:13px;height:13px"></i> 완료';
    // Inject edit bars into each widget section
    document.querySelectorAll('.dash-body > div').forEach((el, i) => {
      el.classList.add('dash-widget');
      if (el.querySelector('.widget-edit-bar')) return;
      const name = DASH_WIDGET_NAMES[i] || '위젯 ' + (i + 1);
      const isHidden = el.classList.contains('widget-hidden');
      const bar = document.createElement('div');
      bar.className = 'widget-edit-bar';
      bar.innerHTML = `<span class="widget-edit-grip">⠿</span><span class="widget-edit-name">${name}</span><span style="flex:1"></span><button class="widget-vis-btn" title="${isHidden ? '표시' : '숨기기'}" onclick="dashWidgetToggleVis(this.closest('.dash-widget'))"><i data-lucide="${isHidden ? 'eye-off' : 'eye'}"></i></button><button class="widget-lock-btn" title="잠금"><i data-lucide="lock"></i></button>`;
      const overlay = document.createElement('div');
      overlay.className = 'widget-hidden-overlay';
      overlay.textContent = '숨김';
      el.insertBefore(bar, el.firstChild);
      el.appendChild(overlay);
    });
    lucide.createIcons();
  } else {
    btn.classList.remove('dash-edit-btn-active');
    btn.innerHTML =
      '<i data-lucide="layout-panel-left" style="width:13px;height:13px"></i> 레이아웃 편집';
    document
      .querySelectorAll('.widget-edit-bar,.widget-hidden-overlay')
      .forEach((el) => el.remove());
    document.querySelectorAll('.dash-widget').forEach((el) => el.classList.remove('dash-widget'));
    lucide.createIcons();
  }
}

function dashWidgetToggleVis(widget) {
  widget.classList.toggle('widget-hidden');
  const isHidden = widget.classList.contains('widget-hidden');
  const btn = widget.querySelector('.widget-vis-btn');
  btn.title = isHidden ? '표시' : '숨기기';
  btn.querySelector('svg')?.remove();
  const i = document.createElement('i');
  i.setAttribute('data-lucide', isHidden ? 'eye-off' : 'eye');
  btn.appendChild(i);
  lucide.createIcons();
}

function dashSaveLayout() {
  const target = document.querySelector('.ds-save-target.active')?.dataset.target;
  const label = target === 'admin' ? '기본값(전체 사용자)' : '내 설정';
  alert(`"${label}"으로 저장되었습니다. (프로토타입 — 실제 저장 미구현)`);
  dashToggleEdit();
}

function dashToggleSessionSettings() {
  alert('내 설정 슬라이드오버 (프로토타입 — 미구현)');
}

document.addEventListener('click', (e) => {
  const target = e.target.closest('.ds-save-target');
  if (!target) return;
  target
    .closest('.ds-save-target-group')
    ?.querySelectorAll('.ds-save-target')
    .forEach((b) => b.classList.remove('active'));
  target.classList.add('active');
});

function dashSwitchHmAxis(axis, btn) {
  dashHmAxis = axis;
  document.querySelectorAll('#hmXAxisBtns .dash-btn').forEach((b) => b.classList.remove('active'));
  btn.classList.add('active');
  dashRenderHeatmap();
}

function dashSwitchAssignAxis(axis, btn) {
  dashAssignAxis = axis;
  document
    .querySelectorAll('#assignXAxisBtns .dash-btn')
    .forEach((b) => b.classList.remove('active'));
  btn.classList.add('active');
  dashRenderAssignTable();
}

function switchGlobalTab(tab, btn) {
  dashGlobalTab = tab;
  dashActiveMenu = null;
  document.getElementById('menuSelect').value = '';
  if (btn) {
    document.querySelectorAll('.global-tab').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
  }
  dashApplyGlobalTabState();
}

function dashSwitchDistTab(btn, key) {
  document.querySelectorAll('#distTabs .d-tab').forEach((t) => t.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('distContent').innerHTML = DASH_DIST_CONTENT[key];
}

function dashSwitchDim(selId, btn) {
  document.querySelectorAll(`#${selId} .dim-btn`).forEach((b) => b.classList.remove('active'));
  btn.classList.add('active');
  if (selId === 'agingDimSel') dashRenderAgingTable();
}

function dashboardInit() {
  if (dashInited) return;
  dashInited = true;
  document.getElementById('distContent').innerHTML = DASH_DIST_CONTENT['status'];
  dashRenderHeatmap();
  dashRenderAssignTable();
  dashRenderAgingTable();
  dashApplyGlobalTabState();
}
