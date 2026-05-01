// ═══════════════════════════════════════════════════════════════
// Dashboard
// ═══════════════════════════════════════════════════════════════
const DASH_HM = {
  status: {
    headers: ['접수', '검토중', '처리중', '완료', '드랍'],
    systems: {
      '채널 A': [42, 89, 134, 28, 15],
      '채널 B': [31, 67, 156, 44, 19],
      '채널 C': [18, 48, 112, 19, 0],
      '채널 D': [14, 36, 89, 13, 7],
      '채널 E': [10, 23, 62, 0, 0],
    },
    menus: {
      '채널 A': {
        '메뉴 1 (홈)': [12, 24, 38, 8, 3],
        '메뉴 2 (검색)': [8, 18, 42, 9, 5],
        '메뉴 3 (마이페이지)': [10, 22, 29, 7, 4],
        '메뉴 4 (결제)': [7, 15, 18, 4, 3],
        '메뉴 5 (설정)': [5, 10, 7, 0, 0],
      },
      '채널 B': {
        '메뉴 1 (대시)': [9, 20, 44, 12, 6],
        '메뉴 2 (리포트)': [8, 16, 38, 11, 4],
        '메뉴 3 (알림)': [7, 14, 32, 9, 5],
        '메뉴 4 (설정)': [7, 17, 42, 12, 4],
      },
      '채널 C': {
        '메뉴 1 (홈)': [6, 18, 40, 7, 0],
        '메뉴 2 (검색)': [5, 14, 35, 6, 0],
        '메뉴 3 (마이)': [7, 16, 37, 6, 0],
      },
      '채널 D': {
        '메뉴 1 (메인)': [5, 12, 28, 5, 3],
        '메뉴 2 (설정)': [4, 11, 31, 4, 2],
        '메뉴 3 (알림)': [5, 13, 30, 4, 2],
      },
      '채널 E': {
        '메뉴 1 (홈)': [4, 9, 22, 0, 0],
        '메뉴 2 (검색)': [3, 8, 20, 0, 0],
        '메뉴 3 (프로필)': [3, 6, 20, 0, 0],
      },
    },
  },
  priority: {
    headers: ['Urgent', 'High', 'Medium', 'Low'],
    systems: {
      '채널 A': [28, 72, 142, 66],
      '채널 B': [24, 80, 156, 57],
      '채널 C': [12, 45, 104, 36],
      '채널 D': [8, 34, 82, 35],
      '채널 E': [5, 17, 56, 17],
    },
    menus: {
      '채널 A': {
        '메뉴 1 (홈)': [8, 20, 42, 15],
        '메뉴 2 (검색)': [6, 18, 40, 18],
        '메뉴 3 (마이페이지)': [5, 15, 38, 14],
        '메뉴 4 (결제)': [5, 12, 14, 16],
        '메뉴 5 (설정)': [4, 7, 8, 3],
      },
      '채널 B': {
        '메뉴 1 (대시)': [6, 22, 42, 15],
        '메뉴 2 (리포트)': [6, 20, 38, 13],
        '메뉴 3 (알림)': [5, 18, 38, 11],
        '메뉴 4 (설정)': [7, 20, 38, 18],
      },
      '채널 C': {
        '메뉴 1 (홈)': [4, 15, 36, 16],
        '메뉴 2 (검색)': [4, 13, 34, 9],
        '메뉴 3 (마이)': [4, 17, 34, 11],
      },
      '채널 D': {
        '메뉴 1 (메인)': [3, 10, 28, 12],
        '메뉴 2 (설정)': [2, 12, 30, 8],
        '메뉴 3 (알림)': [3, 12, 24, 15],
      },
      '채널 E': {
        '메뉴 1 (홈)': [2, 6, 20, 8],
        '메뉴 2 (검색)': [1, 5, 18, 7],
        '메뉴 3 (프로필)': [2, 6, 18, 3],
      },
    },
  },
  tag: {
    headers: ['UI/UX', '성능', '오류/버그', '결제', '로그인'],
    systems: {
      '채널 A': [68, 52, 48, 38, 24],
      '채널 B': [72, 58, 54, 42, 28],
      '채널 C': [42, 38, 32, 22, 14],
      '채널 D': [32, 28, 24, 16, 12],
      '채널 E': [22, 18, 16, 0, 0],
    },
    menus: {
      '채널 A': {
        '메뉴 1 (홈)': [20, 14, 12, 8, 6],
        '메뉴 2 (검색)': [16, 12, 10, 8, 6],
        '메뉴 3 (마이페이지)': [14, 10, 10, 6, 6],
        '메뉴 4 (결제)': [10, 8, 10, 14, 4],
        '메뉴 5 (설정)': [8, 8, 6, 2, 2],
      },
      '채널 B': {
        '메뉴 1 (대시)': [18, 14, 12, 10, 6],
        '메뉴 2 (리포트)': [18, 14, 14, 10, 8],
        '메뉴 3 (알림)': [16, 14, 14, 10, 6],
        '메뉴 4 (설정)': [20, 16, 14, 12, 8],
      },
      '채널 C': {
        '메뉴 1 (홈)': [14, 12, 10, 8, 4],
        '메뉴 2 (검색)': [14, 12, 12, 8, 4],
        '메뉴 3 (마이)': [14, 14, 10, 6, 6],
      },
      '채널 D': {
        '메뉴 1 (메인)': [10, 10, 8, 6, 4],
        '메뉴 2 (설정)': [10, 8, 8, 6, 4],
        '메뉴 3 (알림)': [12, 10, 8, 4, 4],
      },
      '채널 E': {
        '메뉴 1 (홈)': [8, 6, 6, 0, 0],
        '메뉴 2 (검색)': [6, 6, 4, 0, 0],
        '메뉴 3 (프로필)': [8, 6, 6, 0, 0],
      },
    },
  },
};

const DASH_ASSIGN = {
  status: {
    headers: ['접수', '검토중', '처리중', '완료', '드랍'],
    rows: [
      ['김지훈', 8, 22, 34, 12, 4],
      ['이수연', 6, 18, 28, 10, 3],
      ['박민준', 5, 14, 24, 8, 2],
      ['최유진', 7, 20, 30, 11, 3],
      ['정해원', 4, 12, 20, 7, 2],
      ['미배정', 12, 32, 48, 0, 6],
    ],
  },
  priority: {
    headers: ['Urgent', 'High', 'Medium', 'Low'],
    rows: [
      ['김지훈', 18, 28, 36, 18],
      ['이수연', 14, 22, 30, 14],
      ['박민준', 10, 18, 26, 10],
      ['최유진', 16, 24, 32, 16],
      ['정해원', 8, 14, 22, 8],
      ['미배정', 10, 38, 52, 0],
    ],
  },
  tag: {
    headers: ['UI/UX', '성능', '오류/버그', '결제', '로그인'],
    rows: [
      ['김지훈', 16, 14, 12, 8, 6],
      ['이수연', 14, 12, 10, 6, 4],
      ['박민준', 12, 10, 8, 6, 4],
      ['최유진', 14, 12, 10, 8, 4],
      ['정해원', 10, 8, 8, 4, 4],
      ['미배정', 28, 22, 18, 12, 8],
    ],
  },
};

const DASH_MENU_DATA = {
  '채널 A': [
    { name: '메뉴 1 (홈)', total: 85, unresolved: 8 },
    { name: '메뉴 2 (검색)', total: 82, unresolved: 7 },
    { name: '메뉴 3 (마이페이지)', total: 72, unresolved: 6 },
    { name: '메뉴 4 (결제)', total: 47, unresolved: 5 },
    { name: '메뉴 5 (설정)', total: 22, unresolved: 2 },
  ],
  '채널 B': [
    { name: '메뉴 1 (대시)', total: 89, unresolved: 9 },
    { name: '메뉴 2 (리포트)', total: 77, unresolved: 8 },
    { name: '메뉴 3 (알림)', total: 74, unresolved: 7 },
    { name: '메뉴 4 (설정)', total: 77, unresolved: 7 },
  ],
  '채널 C': [
    { name: '메뉴 1 (홈)', total: 68, unresolved: 5 },
    { name: '메뉴 2 (검색)', total: 60, unresolved: 4 },
    { name: '메뉴 3 (마이)', total: 69, unresolved: 3 },
  ],
  '채널 D': [
    { name: '메뉴 1 (메인)', total: 55, unresolved: 3 },
    { name: '메뉴 2 (설정)', total: 50, unresolved: 3 },
    { name: '메뉴 3 (알림)', total: 54, unresolved: 3 },
  ],
  '채널 E': [
    { name: '메뉴 1 (홈)', total: 35, unresolved: 3 },
    { name: '메뉴 2 (검색)', total: 31, unresolved: 2 },
    { name: '메뉴 3 (프로필)', total: 29, unresolved: 2 },
  ],
};

const DASH_SYS_DATA = [
  { name: '채널 A', total: 308, unresolved: 28 },
  { name: '채널 B', total: 317, unresolved: 31 },
  { name: '채널 C', total: 197, unresolved: 12 },
  { name: '채널 D', total: 159, unresolved: 9 },
  { name: '채널 E', total: 95, unresolved: 7 },
  { name: '채널 F', total: 72, unresolved: 0 },
  { name: '채널 G', total: 56, unresolved: 0 },
];

const DASH_SLA = {
  systems: {
    '채널 A': { avg: 8.2, sla: 71, safe: 168, warn: 112, crit: 28 },
    '채널 B': { avg: 9.1, sla: 68, safe: 172, warn: 118, crit: 27 },
    '채널 C': { avg: 6.4, sla: 81, safe: 118, warn: 68, crit: 11 },
    '채널 D': { avg: 7.8, sla: 75, safe: 94, warn: 56, crit: 9 },
    '채널 E': { avg: 5.9, sla: 88, safe: 62, warn: 28, crit: 5 },
    '채널 F': { avg: 4.2, sla: 94, safe: 52, warn: 18, crit: 2 },
    '채널 G': { avg: 3.8, sla: 96, safe: 44, warn: 11, crit: 1 },
  },
  menus: {
    '채널 A': {
      '메뉴 1 (홈)': { avg: 7.8, sla: 74, safe: 50, warn: 28, crit: 7 },
      '메뉴 2 (검색)': { avg: 8.4, sla: 70, safe: 46, warn: 30, crit: 6 },
      '메뉴 3 (마이페이지)': { avg: 7.2, sla: 76, safe: 42, warn: 24, crit: 6 },
      '메뉴 4 (결제)': { avg: 9.8, sla: 62, safe: 22, warn: 18, crit: 7 },
      '메뉴 5 (설정)': { avg: 5.6, sla: 88, safe: 14, warn: 7, crit: 1 },
    },
    '채널 B': {
      '메뉴 1 (대시)': { avg: 8.8, sla: 69, safe: 52, warn: 30, crit: 7 },
      '메뉴 2 (리포트)': { avg: 9.2, sla: 67, safe: 44, warn: 26, crit: 7 },
      '메뉴 3 (알림)': { avg: 9.4, sla: 65, safe: 40, warn: 28, crit: 6 },
      '메뉴 4 (설정)': { avg: 9.0, sla: 70, safe: 44, warn: 26, crit: 7 },
    },
    '채널 C': {
      '메뉴 1 (홈)': { avg: 6.1, sla: 83, safe: 42, warn: 22, crit: 4 },
      '메뉴 2 (검색)': { avg: 6.4, sla: 80, safe: 38, warn: 18, crit: 4 },
      '메뉴 3 (마이)': { avg: 6.8, sla: 79, safe: 38, warn: 28, crit: 3 },
    },
    '채널 D': {
      '메뉴 1 (메인)': { avg: 7.6, sla: 76, safe: 32, warn: 20, crit: 3 },
      '메뉴 2 (설정)': { avg: 7.9, sla: 74, safe: 30, warn: 17, crit: 3 },
      '메뉴 3 (알림)': { avg: 8.0, sla: 73, safe: 32, warn: 19, crit: 3 },
    },
    '채널 E': {
      '메뉴 1 (홈)': { avg: 5.8, sla: 89, safe: 22, warn: 10, crit: 2 },
      '메뉴 2 (검색)': { avg: 5.9, sla: 87, safe: 20, warn: 9, crit: 2 },
      '메뉴 3 (프로필)': { avg: 6.1, sla: 86, safe: 20, warn: 9, crit: 1 },
    },
  },
};

const DASH_AGING_ALL = [
  {
    code: 'VOC-0041',
    title: '결제 모듈 타임아웃 오류 반복',
    loc: '채널 A',
    priority: 'urgent',
    days: 48,
    daysCls: 'd-badge-red',
  },
  {
    code: 'VOC-0055',
    title: '모바일 앱 알림 미수신 문제',
    loc: '채널 B',
    priority: 'high',
    days: 41,
    daysCls: 'd-badge-red',
  },
  {
    code: 'VOC-0063',
    title: '로그인 세션 자동 만료 이슈',
    loc: '채널 A',
    priority: 'urgent',
    days: 38,
    daysCls: 'd-badge-red',
  },
  {
    code: 'VOC-0071',
    title: 'CSV 내보내기 한글 깨짐',
    loc: '채널 C',
    priority: 'medium',
    days: 26,
    daysCls: 'd-badge-amber',
  },
  {
    code: 'VOC-0082',
    title: '검색 필터 저장 안됨',
    loc: '채널 B',
    priority: 'high',
    days: 23,
    daysCls: 'd-badge-amber',
  },
  {
    code: 'VOC-0094',
    title: '대용량 파일 업로드 실패',
    loc: '채널 D',
    priority: 'high',
    days: 19,
    daysCls: 'd-badge-amber',
  },
  {
    code: 'VOC-0108',
    title: 'API 응답 속도 저하',
    loc: '채널 A',
    priority: 'medium',
    days: 17,
    daysCls: 'd-badge-amber',
  },
  {
    code: 'VOC-0115',
    title: '권한 설정 화면 오작동',
    loc: '채널 C',
    priority: 'medium',
    days: 15,
    daysCls: 'd-badge-amber',
  },
  {
    code: 'VOC-0123',
    title: '대시보드 로딩 지연',
    loc: '채널 B',
    priority: 'medium',
    days: 14,
    daysCls: 'd-badge-amber',
  },
  {
    code: 'VOC-0131',
    title: '이메일 발송 실패 케이스',
    loc: '채널 E',
    priority: 'high',
    days: 14,
    daysCls: 'd-badge-amber',
  },
];

const DASH_AGING_MENU = {
  '채널 A': [
    {
      code: 'VOC-0041',
      title: '결제 모듈 타임아웃 오류 반복',
      loc: '메뉴 4 (결제)',
      priority: 'urgent',
      days: 48,
      daysCls: 'd-badge-red',
    },
    {
      code: 'VOC-0063',
      title: '로그인 세션 자동 만료 이슈',
      loc: '메뉴 1 (홈)',
      priority: 'urgent',
      days: 38,
      daysCls: 'd-badge-red',
    },
    {
      code: 'VOC-0108',
      title: 'API 응답 속도 저하',
      loc: '메뉴 2 (검색)',
      priority: 'medium',
      days: 17,
      daysCls: 'd-badge-amber',
    },
  ],
  '채널 B': [
    {
      code: 'VOC-0055',
      title: '모바일 앱 알림 미수신 문제',
      loc: '메뉴 3 (알림)',
      priority: 'high',
      days: 41,
      daysCls: 'd-badge-red',
    },
    {
      code: 'VOC-0082',
      title: '검색 필터 저장 안됨',
      loc: '메뉴 2 (리포트)',
      priority: 'high',
      days: 23,
      daysCls: 'd-badge-amber',
    },
    {
      code: 'VOC-0123',
      title: '대시보드 로딩 지연',
      loc: '메뉴 1 (대시)',
      priority: 'medium',
      days: 14,
      daysCls: 'd-badge-amber',
    },
  ],
};

const DASH_DIST_CONTENT = {
  status: `<div class="donut-section"><div class="donut-wrap"><div class="donut-ring" style="background:conic-gradient(oklch(43% .010 260) 0% 14.9%, oklch(67% .17 240) 14.9% 43.1%, oklch(55% .17 150) 43.1% 86.3%, oklch(62% .19 158) 86.3% 94.9%, oklch(70% .16 72) 94.9% 100%);"></div><div class="donut-hole"><div class="donut-total">1,204</div><div class="donut-total-label">총건수</div></div></div><div class="legend"><div class="legend-item"><div class="legend-dot" style="background:oklch(43% .010 260)"></div><span class="legend-name">접수</span><span class="legend-count">180</span><span class="legend-pct">14.9%</span><div class="legend-bar-wrap"><div class="legend-bar" style="width:30%;background:oklch(43% .010 260)"></div></div></div><div class="legend-item"><div class="legend-dot" style="background:oklch(67% .17 240)"></div><span class="legend-name">검토중</span><span class="legend-count">340</span><span class="legend-pct">28.2%</span><div class="legend-bar-wrap"><div class="legend-bar" style="width:57%;background:oklch(67% .17 240)"></div></div></div><div class="legend-item"><div class="legend-dot" style="background:oklch(55% .17 150)"></div><span class="legend-name">처리중</span><span class="legend-count">520</span><span class="legend-pct">43.2%</span><div class="legend-bar-wrap"><div class="legend-bar" style="width:100%;background:oklch(55% .17 150)"></div></div></div><div class="legend-item"><div class="legend-dot" style="background:oklch(62% .19 158)"></div><span class="legend-name">완료</span><span class="legend-count">104</span><span class="legend-pct">8.6%</span><div class="legend-bar-wrap"><div class="legend-bar" style="width:20%;background:oklch(62% .19 158)"></div></div></div><div class="legend-item"><div class="legend-dot" style="background:oklch(70% .16 72)"></div><span class="legend-name">드랍</span><span class="legend-count">60</span><span class="legend-pct">5.0%</span><div class="legend-bar-wrap"><div class="legend-bar" style="width:12%;background:oklch(70% .16 72)"></div></div></div></div></div>`,
  priority: `<div class="donut-section"><div class="donut-wrap"><div class="donut-ring" style="background:conic-gradient(oklch(58% .22 25) 0% 6.6%, oklch(60% .18 45) 6.6% 29.5%, oklch(59% .012 258) 29.5% 79.1%, oklch(43% .010 260) 79.1% 100%);"></div><div class="donut-hole"><div class="donut-total">1,204</div><div class="donut-total-label">총건수</div></div></div><div class="legend"><div class="legend-item"><div class="legend-dot" style="background:oklch(58% .22 25)"></div><span class="legend-name">Urgent</span><span class="legend-count">80</span><span class="legend-pct">6.6%</span><div class="legend-bar-wrap"><div class="legend-bar" style="width:13%;background:oklch(58% .22 25)"></div></div></div><div class="legend-item"><div class="legend-dot" style="background:oklch(60% .18 45)"></div><span class="legend-name">High</span><span class="legend-count">276</span><span class="legend-pct">22.9%</span><div class="legend-bar-wrap"><div class="legend-bar" style="width:46%;background:oklch(60% .18 45)"></div></div></div><div class="legend-item"><div class="legend-dot" style="background:var(--text-tertiary)"></div><span class="legend-name">Medium</span><span class="legend-count">600</span><span class="legend-pct">49.8%</span><div class="legend-bar-wrap"><div class="legend-bar" style="width:100%;background:var(--text-tertiary)"></div></div></div><div class="legend-item"><div class="legend-dot" style="background:var(--text-quaternary)"></div><span class="legend-name">Low</span><span class="legend-count">248</span><span class="legend-pct">20.6%</span><div class="legend-bar-wrap"><div class="legend-bar" style="width:41%;background:var(--text-quaternary)"></div></div></div></div></div>`,
  type: `<div class="donut-section"><div class="donut-wrap"><div class="donut-ring" style="background:conic-gradient(oklch(58% .22 25) 0% 28%, oklch(63% .19 258) 28% 54%, oklch(55% .17 150) 54% 76%, oklch(70% .16 72) 76% 100%);"></div><div class="donut-hole"><div class="donut-total">1,204</div><div class="donut-total-label">총건수</div></div></div><div class="legend"><div class="legend-item"><div class="legend-dot" style="background:oklch(58% .22 25)"></div><span class="legend-name">버그</span><span class="legend-count">337</span><span class="legend-pct">28.0%</span><div class="legend-bar-wrap"><div class="legend-bar" style="width:100%;background:oklch(58% .22 25)"></div></div></div><div class="legend-item"><div class="legend-dot" style="background:oklch(63% .19 258)"></div><span class="legend-name">기능 요청</span><span class="legend-count">313</span><span class="legend-pct">26.0%</span><div class="legend-bar-wrap"><div class="legend-bar" style="width:93%;background:oklch(63% .19 258)"></div></div></div><div class="legend-item"><div class="legend-dot" style="background:oklch(55% .17 150)"></div><span class="legend-name">개선 제안</span><span class="legend-count">265</span><span class="legend-pct">22.0%</span><div class="legend-bar-wrap"><div class="legend-bar" style="width:79%;background:oklch(55% .17 150)"></div></div></div><div class="legend-item"><div class="legend-dot" style="background:oklch(70% .16 72)"></div><span class="legend-name">문의</span><span class="legend-count">289</span><span class="legend-pct">24.0%</span><div class="legend-bar-wrap"><div class="legend-bar" style="width:86%;background:oklch(70% .16 72)"></div></div></div></div></div>`,
  tag: `<div class="donut-section"><div class="donut-wrap"><div class="donut-ring" style="background:conic-gradient(oklch(63% .19 258) 0% 23.8%, oklch(72% .14 235) 23.8% 43.3%, oklch(58% .22 25) 43.3% 60.3%, oklch(60% .18 45) 60.3% 74.2%, oklch(55% .17 150) 74.2% 85.5%, oklch(43% .010 260) 85.5% 100%);"></div><div class="donut-hole"><div class="donut-total">1,204</div><div class="donut-total-label">총건수</div></div></div><div class="legend"><div class="legend-item"><div class="legend-dot" style="background:oklch(63% .19 258)"></div><span class="legend-name">UI/UX</span><span class="legend-count">287</span><span class="legend-pct">23.8%</span><div class="legend-bar-wrap"><div class="legend-bar" style="width:100%;background:oklch(63% .19 258)"></div></div></div><div class="legend-item"><div class="legend-dot" style="background:oklch(72% .14 235)"></div><span class="legend-name">성능</span><span class="legend-count">235</span><span class="legend-pct">19.5%</span><div class="legend-bar-wrap"><div class="legend-bar" style="width:82%;background:oklch(72% .14 235)"></div></div></div><div class="legend-item"><div class="legend-dot" style="background:oklch(58% .22 25)"></div><span class="legend-name">오류/버그</span><span class="legend-count">204</span><span class="legend-pct">16.9%</span><div class="legend-bar-wrap"><div class="legend-bar" style="width:71%;background:oklch(58% .22 25)"></div></div></div><div class="legend-item"><div class="legend-dot" style="background:oklch(60% .18 45)"></div><span class="legend-name">결제</span><span class="legend-count">167</span><span class="legend-pct">13.9%</span><div class="legend-bar-wrap"><div class="legend-bar" style="width:58%;background:oklch(60% .18 45)"></div></div></div><div class="legend-item"><div class="legend-dot" style="background:oklch(55% .17 150)"></div><span class="legend-name">로그인</span><span class="legend-count">135</span><span class="legend-pct">11.2%</span><div class="legend-bar-wrap"><div class="legend-bar" style="width:47%;background:oklch(55% .17 150)"></div></div></div><div class="legend-item"><div class="legend-dot" style="background:var(--text-quaternary)"></div><span class="legend-name">기타</span><span class="legend-count">176</span><span class="legend-pct">14.6%</span><div class="legend-bar-wrap"><div class="legend-bar" style="width:61%;background:var(--text-quaternary)"></div></div></div></div></div>`,
};

let dashGlobalTab = 'all';
let dashActiveMenu = null;
let dashActiveAssignee = null;
let dashHmAxis = 'status';
let dashAssignAxis = 'status';
let dashInited = false;
let dashEditMode = false;

const DASH_WIDGET_NAMES = [
  'KPI (Volume)',
  'KPI (Quality)',
  '분포 + 매트릭스',
  '드릴다운 히트맵',
  '주간 트렌드 + 태그',
  '현황 카드',
  '처리속도 & 에이징',
  '담당자별 현황',
  '장기 미처리',
];
