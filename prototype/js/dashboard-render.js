function dashCellStyle(v, max) {
  if (v === 0) return 'class="empty"';
  const op = Math.max(0.06, (v / max) * 0.62).toFixed(2);
  const textColor = op > 0.35 ? 'color:var(--text-primary)' : 'color:var(--text-secondary)';
  return `style="background:oklch(63% .19 258 / ${op});${textColor}"`;
}

function dashPriorityBadge(p) {
  if (p === 'urgent') return '<span class="d-badge d-badge-urgent">Urgent</span>';
  if (p === 'high') return '<span class="d-badge d-badge-high">High</span>';
  return '<span class="d-badge d-badge-medium">Medium</span>';
}

function dashRenderHeatmap() {
  const data = DASH_HM[dashHmAxis];
  const headers = data.headers;
  const sysName = dashGlobalTab !== 'all' ? '채널 ' + dashGlobalTab : null;
  let rows,
    isMenuView = false,
    isSingleMenu = false;
  if (dashActiveMenu && sysName) {
    const menuRows = data.menus[sysName] || {};
    const menuVals = menuRows[dashActiveMenu];
    rows = menuVals ? [[dashActiveMenu, menuVals]] : [];
    isMenuView = true;
    isSingleMenu = true;
  } else if (sysName) {
    rows = Object.entries(data.menus[sysName] || {});
    isMenuView = true;
  } else {
    rows = Object.entries(data.systems);
  }
  const showTotalRow = !isSingleMenu;
  const colTotals = headers.map((_, i) => rows.reduce((s, [, v]) => s + v[i], 0));
  const grandTotal = colTotals.reduce((a, b) => a + b, 0);
  const allVals = rows.flatMap(([, v]) => v);
  const max = Math.max(...allVals, 1);
  let html = '<table class="heatmap-table"><colgroup>';
  html += '<col style="width:130px">';
  for (let i = 0; i < headers.length + 1; i++) html += '<col>';
  html += '</colgroup>';
  html += '<thead><tr>';
  html += `<th class="rl">${isMenuView ? '메뉴' : '시스템'}</th>`;
  for (const h of headers) html += `<th>${h}</th>`;
  html += '<th>합계</th></tr></thead><tbody>';
  if (showTotalRow) {
    const totalLabel = isMenuView ? `${sysName} 전체` : '전체';
    html += '<tr class="hm-total-row">';
    html += `<td class="rl">${totalLabel}</td>`;
    for (const v of colTotals)
      html += `<td style="color:var(--text-secondary);font-weight:700">${v}</td>`;
    html += `<td class="tc" style="font-weight:700">${grandTotal}</td></tr>`;
  }
  for (const [name, vals] of rows) {
    const total = vals.reduce((a, b) => a + b, 0);
    html += '<tr>';
    if (!isMenuView) {
      html += `<td class="rl clickable" onclick="dashDrillHeatmap('${name}')" title="클릭 → 메뉴 상세">▶ ${name}</td>`;
    } else {
      html += `<td class="rl">${name}</td>`;
    }
    for (const v of vals) {
      if (v === 0) html += `<td class="empty">—</td>`;
      else html += `<td ${dashCellStyle(v, max)}>${v}</td>`;
    }
    html += `<td class="tc">${total}</td></tr>`;
  }
  html += '</tbody></table>';
  if (!isMenuView)
    html +=
      '<div style="margin-top:7px;font-size:10px;color:var(--text-quaternary)">▶ 시스템명 클릭 → 메뉴별 상세 보기 &nbsp;|&nbsp; 셀 클릭 → VOC 목록 이동</div>';
  else if (isSingleMenu)
    html +=
      '<div style="margin-top:7px;font-size:10px;color:var(--text-quaternary)">메뉴 선택 시 단일 행 표시 &nbsp;|&nbsp; 셀 클릭 → VOC 목록 이동</div>';
  else
    html +=
      '<div style="margin-top:7px;font-size:10px;color:var(--text-quaternary)">셀 클릭 → 해당 메뉴+상태 필터로 VOC 목록 이동</div>';
  document.getElementById('hmTable').innerHTML = html;
  const bc = document.getElementById('hmBreadcrumb');
  if (sysName && dashActiveMenu) {
    bc.innerHTML = `<span class="crumb" onclick="dashBackToAll()">전체</span><span class="sep">›</span><span class="crumb" onclick="dashBackToSystem()">${sysName}</span><span class="sep">›</span><span>${dashActiveMenu}</span>`;
  } else if (sysName) {
    bc.innerHTML = `<span class="crumb" onclick="dashBackToAll()">전체</span><span class="sep">›</span><span>${sysName}</span>`;
  } else {
    bc.innerHTML = `<span class="crumb" style="cursor:default">전체</span>`;
  }
}

function dashDrillHeatmap(systemName) {
  const tabMap = { '채널 A': 'A', '채널 B': 'B', '채널 C': 'C', '채널 D': 'D', '채널 E': 'E' };
  const key = tabMap[systemName];
  if (key) {
    const btns = document.querySelectorAll('.global-tab');
    const idx = ['all', 'A', 'B', 'C', 'D', 'E'].indexOf(key);
    switchGlobalTab(key, btns[idx] || null);
  }
}

function dashBackToAll() {
  const btn = document.querySelector('.global-tab');
  switchGlobalTab('all', btn);
}

function dashBackToSystem() {
  dashActiveMenu = null;
  document.getElementById('menuSelect').value = '';
  dashRenderHeatmap();
  dashUpdateFilterContext();
}

function dashRenderAssignTable() {
  const data = DASH_ASSIGN[dashAssignAxis];
  const allVals = data.rows.flatMap((r) => r.slice(1));
  const max = Math.max(...allVals, 1);
  const rows = dashActiveAssignee
    ? data.rows.filter((r) => r[0] === dashActiveAssignee || r[0] === '미배정')
    : data.rows;
  let html = '<table class="assign-table"><thead><tr>';
  html += '<th class="rl">담당자</th>';
  for (const h of data.headers) html += `<th>${h}</th>`;
  html += '<th>합계</th></tr></thead><tbody>';
  for (const row of rows) {
    const [name, ...vals] = row;
    const total = vals.reduce((a, b) => a + b, 0);
    const isHighlighted = dashActiveAssignee && name === dashActiveAssignee;
    html += `<tr${isHighlighted ? ' class="assign-row-highlight"' : ''}>`;
    html +=
      name === '미배정' ? `<td class="rl unassigned">${name}</td>` : `<td class="rl">${name}</td>`;
    for (const v of vals) {
      if (v === 0) html += `<td class="empty">—</td>`;
      else html += `<td ${dashCellStyle(v, max)}>${v}</td>`;
    }
    html += `<td class="tc">${total}</td></tr>`;
  }
  html += '</tbody></table>';
  document.getElementById('assignTable').innerHTML = html;
}

function dashRenderAgingTable() {
  const sysName = dashGlobalTab !== 'all' ? '채널 ' + dashGlobalTab : null;
  const agingDimSysBtn = document.getElementById('agingDimSys');
  const isMenuDim =
    agingDimSysBtn &&
    agingDimSysBtn.textContent === '메뉴별' &&
    agingDimSysBtn.classList.contains('active');
  let data,
    locLabel = '시스템';
  if (sysName && isMenuDim) {
    data = DASH_AGING_MENU[sysName] || DASH_AGING_ALL.filter((r) => r.loc === sysName);
    locLabel = '메뉴';
  } else if (sysName) {
    data = DASH_AGING_ALL.filter((r) => r.loc === sysName);
  } else {
    data = DASH_AGING_ALL;
  }
  let html = `<table class="aging-table"><thead><tr><th>Issue</th><th>제목</th><th>${locLabel}</th><th>우선순위</th><th>경과일</th></tr></thead><tbody>`;
  for (const r of data) {
    html += `<tr><td class="code">${r.code}</td><td class="title-col">${r.title}</td><td>${r.loc}</td><td>${dashPriorityBadge(r.priority)}</td><td><span class="d-badge ${r.daysCls}">${r.days}일</span></td></tr>`;
  }
  html += '</tbody></table>';
  document.getElementById('agingTableWrap').innerHTML = html;
}

function dashApplyGlobalTabState() {
  const isAll = dashGlobalTab === 'all';
  const sysName = isAll ? null : '채널 ' + dashGlobalTab;
  ['distDimSys', 'matDimSys', 'lineDimSys', 'tagDimSys'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.style.display = isAll ? '' : 'none';
  });
  ['distDimMenu', 'matDimMenu', 'lineDimMenu', 'tagDimMenu'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.disabled = isAll;
  });
  const agingDimSys = document.getElementById('agingDimSys');
  if (agingDimSys) agingDimSys.textContent = isAll ? '시스템별' : '메뉴별';
  const menuWrap = document.getElementById('menuSelectorWrap');
  const menuSelect = document.getElementById('menuSelect');
  if (isAll) {
    menuWrap.style.display = 'none';
    menuSelect.innerHTML = '<option value="">메뉴: 전체</option>';
  } else {
    menuWrap.style.display = 'flex';
    const menus = DASH_MENU_DATA[sysName] || [];
    menuSelect.innerHTML =
      `<option value="">메뉴: 전체</option>` +
      menus.map((m) => `<option value="${m.name}">${m.name}</option>`).join('');
  }
  dashRenderHeatmap();
  const slaEl = document.getElementById('slaCardWrap');
  const agingEl = document.getElementById('agingCardWrap');
  let slaItems;
  if (isAll) {
    slaItems = DASH_SYS_DATA.map((s) => ({
      name: s.name,
      d: DASH_SLA.systems[s.name] || { avg: 0, sla: 0, safe: 0, warn: 0, crit: 0 },
    }));
  } else {
    slaItems = (DASH_MENU_DATA[sysName] || []).map((m) => ({
      name: m.name,
      d: (DASH_SLA.menus[sysName] || {})[m.name] || { avg: 0, sla: 0, safe: 0, warn: 0, crit: 0 },
    }));
  }
  const slaRows = slaItems
    .map(({ name, d }) => {
      const cls = d.sla >= 85 ? 'good' : d.sla >= 70 ? 'warn' : 'bad';
      return `<div class="sla-row"><span class="sla-name">${name}</span><span class="sla-avg">${d.avg.toFixed(1)}일</span><span class="sla-rate ${cls}">${d.sla}%</span></div>`;
    })
    .join('');
  const agingBars = slaItems
    .map(({ name, d }) => {
      const total = d.safe + d.warn + d.crit || 1;
      const sp = Math.round((d.safe / total) * 100);
      const wp = Math.round((d.warn / total) * 100);
      const cp = 100 - sp - wp;
      return `<div class="aging-item">
      <div class="aging-item-label">
        <span class="aging-name">${name}</span>
        <span class="aging-counts"><span class="aging-safe">${d.safe}</span><span class="aging-warn">${d.warn}</span><span class="aging-crit">${d.crit}</span></span>
      </div>
      <div class="aging-bar"><div class="aging-seg safe" style="width:${sp}%"></div><div class="aging-seg warn" style="width:${wp}%"></div><div class="aging-seg crit" style="width:${cp}%"></div></div>
    </div>`;
    })
    .join('');
  slaEl.innerHTML = `
    <div class="sla-section">
      <div class="sla-header"><span>시스템</span><span class="sla-col-avg">평균 처리</span><span class="sla-col-rate">SLA 준수</span></div>
      ${slaRows}
    </div>`;
  agingEl.innerHTML = `
    <div class="aging-section">
      <div class="aging-legend"><span class="aging-legend-item safe">≤7일</span><span class="aging-legend-item warn">8~30일</span><span class="aging-legend-item crit">31일+</span></div>
      ${agingBars}
    </div>`;
  dashRenderAgingTable();
  dashUpdateFilterContext();
}

function dashSelectMenu(menuName) {
  dashActiveMenu = menuName || null;
  dashRenderHeatmap();
  dashUpdateFilterContext();
}

function dashSelectAssignee(name) {
  dashActiveAssignee = name || null;
  dashRenderAssignTable();
  dashUpdateFilterContext();
}

function dashUpdateFilterContext() {
  const parts = [];
  if (dashGlobalTab !== 'all') parts.push('채널 ' + dashGlobalTab);
  if (dashActiveMenu) parts.push(dashActiveMenu);
  if (dashActiveAssignee) parts.push('담당자: ' + dashActiveAssignee);
  const banner = document.getElementById('filterContext');
  const text = document.getElementById('filterContextText');
  if (parts.length > 0) {
    text.textContent = parts.join(' › ');
    banner.style.display = 'flex';
  } else {
    banner.style.display = 'none';
  }
}
