// ── Admin Data
let ADMIN_RULES = [
  {
    id: 1,
    kw: ['집계', '수집', '스트리밍', '파이프라인', '중복', '인덱스'],
    tag: '데이터수집',
    type: 'keyword',
    active: true,
  },
  {
    id: 2,
    kw: ['api', '엔드포인트', 'rest', 'graphql'],
    tag: 'API',
    type: 'keyword',
    active: true,
  },
  {
    id: 3,
    kw: ['성능', '속도', '느림', '최적화', '응답시간'],
    tag: '성능',
    type: 'keyword',
    active: true,
  },
  {
    id: 4,
    kw: ['ui', 'ux', '화면', '레이아웃', '디자인'],
    tag: 'UI/UX',
    type: 'keyword',
    active: true,
  },
  {
    id: 5,
    kw: ['데이터', '조회', '쿼리', 'sql', 'db'],
    tag: '데이터',
    type: 'keyword',
    active: true,
  },
  {
    id: 6,
    kw: ['보고서', '리포트', '엑셀', '출력', '다운로드'],
    tag: '리포트',
    type: 'keyword',
    active: true,
  },
  { id: 7, kw: ['etl', '배치', '파이프라인', '스케줄'], tag: 'ETL', type: 'keyword', active: true },
  {
    id: 8,
    kw: ['타임아웃', '만료', '에러', '오류', '실패', '500'],
    tag: '오류',
    type: 'keyword',
    active: true,
  },
  {
    id: 9,
    kw: ['대시보드', 'kpi', '위젯', '보고서'],
    tag: '대시보드',
    type: 'keyword',
    active: true,
  },
  { id: 10, kw: ['이메일', '메일', 'smtp', '알림'], tag: '이메일', type: 'keyword', active: true },
  { id: 11, kw: ['\\b(bug|fix|issue)\\b'], tag: '버그', type: 'regex', active: false },
];
let ADMIN_CATS = [
  { id: 1, name: '데이터수집', color: '#5e6ad2', desc: '수집·집계·스트리밍 관련 VOC', count: 3 },
  { id: 2, name: '데이터 분석', color: '#00b58a', desc: '분석 도구·대시보드 KPI', count: 3 },
  { id: 3, name: '데이터 파이프라인', color: '#e8a838', desc: 'ETL·배치·스케줄러', count: 2 },
  { id: 4, name: '대시보드', color: '#e85d3e', desc: '위젯·레이아웃·보고서', count: 2 },
  { id: 5, name: 'API', color: '#9b59b6', desc: 'REST·GraphQL 엔드포인트', count: 0 },
];
let ADMIN_USERS = [
  {
    id: 1,
    name: '홍길동',
    init: '홍',
    email: 'hong@vocpage.io',
    role: 'admin',
    active: true,
    lastSeen: '방금 전',
  },
  {
    id: 2,
    name: '김관리',
    init: '김',
    email: 'kim@vocpage.io',
    role: 'manager',
    active: true,
    lastSeen: '1시간 전',
  },
  {
    id: 3,
    name: '박개발',
    init: '박',
    email: 'park@vocpage.io',
    role: 'user',
    active: true,
    lastSeen: '어제',
  },
  {
    id: 4,
    name: '이분석',
    init: '이',
    email: 'lee@vocpage.io',
    role: 'user',
    active: true,
    lastSeen: '3일 전',
  },
  {
    id: 5,
    name: '최영업',
    init: '최',
    email: 'choi@vocpage.io',
    role: 'user',
    active: false,
    lastSeen: '14일 전',
  },
  // B-15: 2nd admin so D14 last-admin guard is reachable (deactivate 홍길동 first
  // is blocked by D16 self-deactivate; promoting another to admin then changing
  // 윤대표 back hits the last-admin-among-others case).
  {
    id: 6,
    name: '윤대표',
    init: '윤',
    email: 'yoon@vocpage.io',
    role: 'admin',
    active: true,
    lastSeen: '방금 전',
  },
];
let ruleNextId = 12,
  catNextId = 6,
  userNextId = 7;

// ── Admin Renders
function renderTagRules() {
  const tbody = document.getElementById('tagRulesBody');
  tbody.innerHTML = ADMIN_RULES.map(
    (r, i) => `
    <tr id="rule-row-${r.id}" style="transition:opacity .2s">
      <td style="color:var(--text-quaternary);font-size:12px">${i + 1}</td>
      <td><div class="kw-list">${r.kw.map((k) => `<span class="kw-pill">${k}</span>`).join('')}</div></td>
      <td><span class="tag-pill-sm"># ${r.tag}</span></td>
      <td><span class="type-badge-admin type-${r.type}">${r.type === 'keyword' ? '키워드' : '정규식'}</span></td>
      <td><span style="cursor:pointer;user-select:none" onclick="toggleRuleActive(${r.id})">
        <span class="status-dot ${r.active ? 'on' : 'off'}"></span>
        <span style="font-size:12px;color:${r.active ? 'var(--status-green)' : 'var(--text-quaternary)'}">${r.active ? '활성' : '비활성'}</span>
      </span></td>
      <td style="text-align:right"><button class="a-btn danger" onclick="deleteRule(${r.id})">삭제</button></td>
    </tr>`,
  ).join('');
  document.getElementById('tagRuleCount').textContent = `${ADMIN_RULES.length}개`;
}

function renderSystemMenu() {
  const el = document.getElementById('adminSystemMenuContent');
  if (!el) return;
  let rows = '';
  SYSTEMS.forEach((s) => {
    const sysMenus = MENUS.filter((m) => m.systemId === s.id);
    const cnt = VOCDATA.filter((v) => v.systemId === s.id).length;
    const sysState = s.archived
      ? `<span style="font-size:12px;color:var(--text-quaternary)"><span class="status-dot off"></span>아카이브</span>`
      : `<span style="font-size:12px;color:var(--status-green)"><span class="status-dot on"></span>활성</span>`;
    rows += `<tr>
      <td><div style="display:flex;align-items:center;gap:8px">
        <i data-lucide="${s.icon}" style="width:14px;height:14px;color:var(--text-tertiary);flex-shrink:0"></i>
        <span class="td-primary" style="${s.archived ? 'opacity:.55' : ''}">${s.name}</span>
      </div></td>
      <td style="font-family:var(--font-mono);font-size:12px;color:var(--text-tertiary)">${s.slug}</td>
      <td style="font-size:12px;color:var(--text-tertiary);text-align:right">${cnt}</td>
      <td>${sysState}</td>
      <td style="text-align:right">
        <button class="a-btn" onclick="toggleArchiveSystem('${s.id}')">${s.archived ? '복원' : '아카이브'}</button>
      </td>
    </tr>`;
    sysMenus.forEach((m) => {
      const mc = VOCDATA.filter((v) => v.menuId === m.id).length;
      const menuState = m.archived
        ? `<span style="font-size:12px;color:var(--text-quaternary)"><span class="status-dot off"></span>아카이브</span>`
        : `<span style="font-size:12px;color:var(--status-green)"><span class="status-dot on"></span>활성</span>`;
      rows += `<tr>
        <td style="padding-left:32px;font-size:13px;color:var(--text-secondary);${m.archived ? 'opacity:.55' : ''}">└ ${m.name}</td>
        <td></td>
        <td style="font-size:12px;color:var(--text-tertiary);text-align:right">${mc}</td>
        <td>${menuState}</td>
        <td style="text-align:right">
          <button class="a-btn" onclick="toggleArchiveMenu('${m.id}')">${m.archived ? '복원' : '아카이브'}</button>
        </td>
      </tr>`;
    });
  });
  el.innerHTML = rows;
  const cnt = document.getElementById('sysMenuCount');
  if (cnt) cnt.textContent = `시스템 ${SYSTEMS.length} · 메뉴 ${MENUS.length}`;
  lucide.createIcons();
}

function toggleAddSystemForm() {
  const f = document.getElementById('addSystemForm');
  f.classList.toggle('open');
  document.getElementById('addMenuForm')?.classList.remove('open');
  if (f.classList.contains('open'))
    setTimeout(() => document.getElementById('newSystemName').focus(), 40);
}
function toggleAddMenuForm() {
  const f = document.getElementById('addMenuForm');
  f.classList.toggle('open');
  document.getElementById('addSystemForm')?.classList.remove('open');
  const sel = document.getElementById('newMenuSystem');
  if (sel)
    sel.innerHTML = SYSTEMS.filter((s) => !s.archived)
      .map((s) => `<option value="${s.id}">${s.name}</option>`)
      .join('');
  if (f.classList.contains('open'))
    setTimeout(() => document.getElementById('newMenuName').focus(), 40);
}
function addSystem() {
  const name = document.getElementById('newSystemName').value.trim();
  const slug = document.getElementById('newSystemSlug').value.trim();
  if (!name || !slug) return;
  const id = 'sys' + ++sysNextSeq;
  SYSTEMS.push({ id, name, slug, icon: 'folder', archived: false });
  // 시스템 생성 시 "기타" 메뉴 자동 생성 (req §8.8 / §9.4.2)
  MENUS.push({ id: 'm' + ++menuNextSeq, systemId: id, name: '기타', archived: false });
  SYS_MAP[id] = SYSTEMS[SYSTEMS.length - 1];
  MENU_MAP[MENUS[MENUS.length - 1].id] = MENUS[MENUS.length - 1];
  document.getElementById('newSystemName').value = '';
  document.getElementById('newSystemSlug').value = '';
  document.getElementById('addSystemForm').classList.remove('open');
  renderSystemMenu();
  renderSidebar();
}
function addMenu() {
  const sysId = document.getElementById('newMenuSystem').value;
  const name = document.getElementById('newMenuName').value.trim();
  if (!sysId || !name) return;
  const m = { id: 'm' + ++menuNextSeq, systemId: sysId, name, archived: false };
  MENUS.push(m);
  MENU_MAP[m.id] = m;
  document.getElementById('newMenuName').value = '';
  document.getElementById('addMenuForm').classList.remove('open');
  renderSystemMenu();
  renderSidebar();
}
function toggleArchiveSystem(id) {
  const s = SYSTEMS.find((x) => x.id === id);
  if (s) {
    s.archived = !s.archived;
    renderSystemMenu();
    renderSidebar();
  }
}
function toggleArchiveMenu(id) {
  const m = MENUS.find((x) => x.id === id);
  if (m) {
    m.archived = !m.archived;
    renderSystemMenu();
    renderSidebar();
  }
}

const TYPE_KIND_LABEL = {
  system: 'system',
  menu: 'menu',
  'issue-kind': 'issue-kind',
  external: 'external',
};
function renderVocTypes() {
  const el = document.getElementById('adminVocTypeContent');
  if (!el) return;
  el.innerHTML = VOC_TYPES.map((t) => {
    const cnt = VOCDATA.filter((v) => v.type === t.slug).length;
    const state = t.archived
      ? `<span style="font-size:12px;color:var(--text-quaternary)"><span class="status-dot off"></span>아카이브</span>`
      : `<span style="font-size:12px;color:var(--status-green)"><span class="status-dot on"></span>활성</span>`;
    const kindCls = t.typeKind ? `type-${t.typeKind}` : 'type-issue-kind';
    const kindLabel = TYPE_KIND_LABEL[t.typeKind] || t.typeKind || '—';
    return `<tr>
      <td><div style="display:flex;align-items:center;gap:8px">
        <span class="color-swatch" style="background:${t.color};flex-shrink:0"></span>
        <span class="td-primary" style="${t.archived ? 'opacity:.55' : ''}">${t.name}</span>
      </div></td>
      <td style="font-family:var(--font-mono);font-size:12px;color:var(--text-tertiary)">${t.slug}</td>
      <td><span class="type-kind-badge ${kindCls}">${kindLabel}</span></td>
      <td style="font-size:12px;color:var(--text-tertiary);text-align:right">${cnt}</td>
      <td>${state}</td>
      <td style="text-align:right">
        <button class="a-btn" onclick="toggleArchiveType('${t.slug}')">${t.archived ? '복원' : '아카이브'}</button>
      </td>
    </tr>`;
  }).join('');
  const badge = document.getElementById('vocTypeCount');
  if (badge) badge.textContent = `${VOC_TYPES.length}개`;
}

function toggleAddTypeForm() {
  const f = document.getElementById('addTypeForm');
  f.classList.toggle('open');
  if (f.classList.contains('open'))
    setTimeout(() => document.getElementById('newTypeName').focus(), 40);
}
function addType() {
  const name = document.getElementById('newTypeName').value.trim();
  const slug = document.getElementById('newTypeSlug').value.trim();
  const color = document.getElementById('newTypeColor').value;
  if (!name || !slug) return;
  if (TYPE_MAP[slug]) {
    alert('이미 존재하는 슬러그입니다.');
    return;
  }
  const t = { id: 't' + ++typeNextSeq, name, slug, color, archived: false };
  VOC_TYPES.push(t);
  TYPE_MAP[slug] = t;
  document.getElementById('newTypeName').value = '';
  document.getElementById('newTypeSlug').value = '';
  document.getElementById('addTypeForm').classList.remove('open');
  renderVocTypes();
}
function toggleArchiveType(slug) {
  const t = VOC_TYPES.find((x) => x.slug === slug);
  if (t) {
    t.archived = !t.archived;
    renderVocTypes();
  }
}
