// ── Taxonomy
const SYSTEMS = [
  { id: 'sys2', name: '데이터 분석', slug: '분석', icon: 'bar-chart-2', archived: false },
  { id: 'sys3', name: '데이터 파이프라인', slug: '파이프라인', icon: 'workflow', archived: false },
  { id: 'sys4', name: '대시보드', slug: '대시보드', icon: 'layout-dashboard', archived: false },
];
const MENUS = [
  { id: 'm4', systemId: 'sys2', name: '차트/그래프', archived: false },
  { id: 'm5', systemId: 'sys2', name: '리포트', archived: false },
  { id: 'm6', systemId: 'sys2', name: '필터/집계', archived: false },
  { id: 'm7', systemId: 'sys3', name: 'ETL 배치', archived: false },
  { id: 'm8', systemId: 'sys3', name: '데이터 수집', archived: false },
  { id: 'm9', systemId: 'sys4', name: '위젯', archived: false },
  { id: 'm10', systemId: 'sys4', name: 'KPI', archived: false },
  { id: 'm11', systemId: 'sys4', name: '알림 설정', archived: false },
];
const VOC_TYPES = [
  { id: 't1', name: '버그', slug: 'bug', color: '#e5534b', archived: false },
  { id: 't2', name: '기능 요청', slug: 'feature', color: '#5e6ad2', archived: false },
  { id: 't3', name: '개선 제안', slug: 'improvement', color: '#f5a623', archived: false },
  { id: 't4', name: '문의', slug: 'inquiry', color: '#57ab5a', archived: false },
];
let sysNextSeq = 5,
  menuNextSeq = 12,
  typeNextSeq = 5;
// Lookup helpers
const SYS_MAP = Object.fromEntries(SYSTEMS.map((s) => [s.id, s]));
const MENU_MAP = Object.fromEntries(MENUS.map((m) => [m.id, m]));
const TYPE_MAP = Object.fromEntries(VOC_TYPES.map((t) => [t.slug, t]));

// ── Data
const VOCDATA = [
  {
    id: 'voc1',
    code: '분석-2025-0001',
    title: '차트 필터 다중 적용 시 무한 로딩 발생 — 두 개 이상 선택 후 조회 불가',
    status: '처리중',
    priority: 'urgent',
    assignee: '김관리',
    assigneeInit: '김',
    assigneeCls: '',
    systemId: 'sys2',
    menuId: 'm4',
    type: 'bug',
    tags: ['차트', '데이터', '오류'],
    author: '박사용자',
    authorInit: '박',
    authorCls: 'g',
    date: '2025.06.12',
    body: `<p>차트/그래프 화면에서 필터를 <strong>두 개 이상 동시에 선택</strong>하면 조회 버튼 클릭 후 스피너만 계속 돌고 결과가 나타나지 않습니다.</p>
<p>단일 필터 적용 시에는 정상 동작합니다. 크롬·엣지 모두 동일하게 발생하며 콘솔에 <code>Query timeout after 30s</code> 오류가 기록됩니다.</p>
<p>재현 방법: 차트 화면 → 기간 필터 + 부서 필터 동시 선택 → 조회 → 무한 로딩.</p>`,
    subs: ['sub1', 'sub2'],
    review_status: 'approved',
    subTasks: [
      { id: 'st1', title: '원인 파악 및 쿼리 최적화 검토', done: true },
      { id: 'st2', title: '테스트 환경 재현 및 픽스 배포', done: false },
    ],
    comments: [
      {
        id: 'c1',
        author: '김관리',
        author_id: 'user-admin',
        body: '내용 검토 후 처리 예정입니다. 추가 정보가 필요하면 댓글로 남겨주세요.',
        date: '어제 14:30',
        _deleted: false,
      },
      {
        id: 'c2',
        author: '박개발',
        author_id: 'user-dev',
        body: '쿼리 타임아웃 원인 확인했습니다. 다중 필터 JOIN 최적화 진행 중입니다.',
        date: '오늘 09:15',
        _deleted: false,
      },
    ],
  },

  {
    id: 'voc2',
    code: '분석-2025-0047',
    title: '대시보드 월별 매출 차트에서 특정 월 데이터가 0으로 표시됨',
    status: '검토중',
    priority: 'high',
    assignee: '이분석',
    assigneeInit: '이',
    assigneeCls: 'p',
    systemId: 'sys2',
    menuId: 'm4',
    type: 'bug',
    tags: ['차트', '데이터'],
    author: '정팀장',
    authorInit: '정',
    authorCls: 'p',
    date: '2025.06.11',
    body: `<p>월별 매출 차트에서 <strong>2025년 3월, 5월</strong> 데이터가 0으로 표시됩니다. DB에는 정상 저장되어 있고 실제 매출도 발생했습니다.</p>
<p>다른 월은 정상이며 날짜 범위를 분기별로 변경해도 동일하게 발생합니다. 차트 렌더링 레이어의 데이터 바인딩 문제로 추정됩니다.</p>`,
    subs: [],
    review_status: 'unverified',
    comments: [
      {
        id: 'c3',
        author: '이분석',
        author_id: 'user-dev',
        body: '3월 데이터 바인딩 버그 확인했습니다. 렌더 레이어 수정 예정입니다.',
        date: '2일 전 11:20',
        _deleted: false,
      },
    ],
  },

  {
    id: 'voc3',
    code: '파이프라인-2025-0008',
    title: 'ETL 배치 작업이 매일 새벽 2시 이후 실패 — 타임아웃 관련',
    status: '접수',
    priority: 'medium',
    assignee: '홍길동',
    assigneeInit: '홍',
    assigneeCls: '',
    systemId: 'sys3',
    menuId: 'm7',
    type: 'bug',
    tags: ['ETL', '오류'],
    author: '최분석',
    authorInit: '최',
    authorCls: '',
    date: '2025.06.10',
    body: `<p>ETL 배치 작업이 매일 새벽 <strong>2시~3시</strong> 사이에 반복적으로 실패합니다. 에러 로그에는 <code>Connection timeout after 30s</code> 메시지가 기록됩니다.</p>
<p>낮 시간대에는 동일한 작업이 정상 실행됩니다. 야간 DB 부하 집중으로 인한 타임아웃 임계값 초과로 추정됩니다.</p>`,
    subs: [],
  },

  {
    id: 'voc4',
    code: '대시보드-2025-0015',
    title: 'KPI 요약 위젯에서 전월 대비 증감률이 반대로 표시됨',
    status: '완료',
    priority: 'low',
    assignee: '김관리',
    assigneeInit: '김',
    assigneeCls: '',
    systemId: 'sys4',
    menuId: 'm10',
    type: 'bug',
    tags: ['KPI'],
    author: '홍길동',
    authorInit: '홍',
    authorCls: '',
    date: '2025.06.08',
    body: `<p>KPI 요약 위젯에서 전월 대비 증감률이 <strong>반대 부호</strong>로 표시됩니다. 예: 실제 10% 증가인데 -10%로 표시됩니다.</p>
<p>모든 KPI 항목에서 동일하게 발생하며, 전일 대비 증감률은 정상입니다. 전월 비교 계산식에서 분자/분모가 뒤바뀐 것으로 추정됩니다.</p>`,
    subs: [],
    review_status: 'rejected',
    comments: [],
  },

  {
    id: 'voc5',
    code: '파이프라인-2025-0002',
    title: '실시간 데이터 수집 파이프라인에서 중복 레코드 삽입 발생',
    status: '드랍',
    priority: 'high',
    assignee: '이분석',
    assigneeInit: '이',
    assigneeCls: 'p',
    systemId: 'sys3',
    menuId: 'm8',
    type: 'bug',
    tags: ['ETL', '데이터', '오류'],
    author: '박사용자',
    authorInit: '박',
    authorCls: 'g',
    date: '2025.06.07',
    body: `<p>실시간 수집 파이프라인에서 이벤트 1건이 <strong>2~3회 중복 삽입</strong>되는 현상이 확인됐습니다. 중복 건수는 일별 약 200~300건이며 고유 키 제약 위반 에러도 함께 발생합니다.</p>
<p>네트워크 재시도 로직이 ACK 타임아웃을 중복 실패로 오인하여 재전송하는 것이 원인으로 추정됩니다.</p>`,
    subs: [],
    review_status: 'pending_deletion',
    comments: [],
  },

  {
    id: 'voc6',
    code: '분석-2025-0031',
    title: '사용자별 접속 통계에서 중복 카운트 발생',
    status: '접수',
    priority: 'medium',
    assignee: '',
    assigneeInit: '',
    assigneeCls: '',
    systemId: 'sys2',
    menuId: 'm5',
    type: 'feature',
    tags: ['데이터', '통계'],
    author: '이분석',
    authorInit: '이',
    authorCls: 'p',
    date: '2025.06.05',
    body: `<p>사용자별 일일 접속 통계에서 동일 사용자가 <strong>2~3회 중복 카운트</strong>됩니다. 새 탭 열기나 페이지 새로고침 시 별도 세션으로 집계되는 것으로 추정됩니다.</p>
<p>월간 리포트의 UV(Unique Visitors) 수치가 실제보다 높게 집계되어 신뢰도 문제가 발생하고 있습니다.</p>`,
    subs: [],
  },

  {
    id: 'voc7',
    code: '대시보드-2025-0003',
    title: '실시간 매출 현황 위젯 데이터가 1시간씩 지연됨',
    status: '검토중',
    priority: 'high',
    assignee: '박개발',
    assigneeInit: '박',
    assigneeCls: 'g',
    systemId: 'sys4',
    menuId: 'm9',
    type: 'improvement',
    tags: ['대시보드', '데이터'],
    author: '정팀장',
    authorInit: '정',
    authorCls: 'p',
    date: '2025.06.04',
    body: `<p>실시간 매출 현황 위젯의 데이터가 <strong>약 1시간</strong> 지연되어 표시됩니다. 화면 새로고침을 해도 동일하며 다른 위젯(주간 매출 등)은 정상입니다.</p>
<p>캐싱 레이어의 TTL 설정이 1시간으로 고정된 것이 원인으로 추정됩니다.</p>`,
    subs: [],
  },

  {
    id: 'voc8',
    code: '파이프라인-2025-0012',
    title: 'Spark 집계 잡이 메모리 부족으로 매주 월요일 실패',
    status: '처리중',
    priority: 'urgent',
    assignee: '박개발',
    assigneeInit: '박',
    assigneeCls: 'g',
    systemId: 'sys3',
    menuId: 'm7',
    type: 'bug',
    tags: ['ETL', '오류'],
    author: '최분석',
    authorInit: '최',
    authorCls: '',
    date: '2025.06.03',
    body: `<p>Spark 집계 잡이 매주 <strong>월요일 00:30~01:00</strong> 사이 OOM(Out of Memory) 에러로 실패합니다. 주말 동안 쌓인 데이터 볼륨이 커서 executor 메모리를 초과하는 것으로 추정됩니다.</p>
<p>에러: <code>java.lang.OutOfMemoryError: GC overhead limit exceeded</code></p>`,
    subs: [],
  },

  {
    id: 'voc9',
    code: '대시보드-2025-0023',
    title: '접속 현황 위젯 클릭 시 드릴다운 상세 화면이 열리지 않음',
    status: '완료',
    priority: 'medium',
    assignee: '김관리',
    assigneeInit: '김',
    assigneeCls: '',
    systemId: 'sys4',
    menuId: 'm9',
    type: 'bug',
    tags: ['대시보드', '위젯'],
    author: '홍길동',
    authorInit: '홍',
    authorCls: '',
    date: '2025.06.02',
    body: `<p>사용자 접속 현황 위젯의 막대 그래프 항목을 클릭하면 드릴다운 상세 화면이 열려야 하지만 아무 반응이 없습니다.</p>
<p>다른 위젯(매출 현황, KPI 요약)은 정상 동작합니다. 클릭 이벤트 핸들러가 마운트 타이밍 오류로 바인딩되지 않은 것으로 추정됩니다.</p>`,
    subs: [],
  },

  {
    id: 'voc10',
    code: '분석-2025-0052',
    title: '분기별 목표 달성률 리포트 다운로드 시 빈 파일 생성',
    status: '접수',
    priority: 'low',
    assignee: '',
    assigneeInit: '',
    assigneeCls: '',
    systemId: 'sys2',
    menuId: 'm5',
    type: 'inquiry',
    tags: ['통계'],
    author: '박사용자',
    authorInit: '박',
    authorCls: 'g',
    date: '2025.05.30',
    body: `<p>분기별 목표 달성률 리포트를 Excel로 다운로드 시 <strong>빈 파일(0KB)</strong>이 생성됩니다. 파일명은 정상이나 내용이 없습니다.</p>
<p>PDF 다운로드는 정상이며, 다른 리포트 Excel 다운로드도 정상입니다. 분기별 집계 쿼리에서 데이터를 반환하지 못하는 것으로 추정됩니다.</p>`,
    subs: [],
  },

  {
    id: 'voc11',
    code: '대시보드-2025-0021',
    title: 'KPI 목표값 편집 저장 후 새로고침하면 이전 값으로 복원',
    status: '드랍',
    priority: 'high',
    assignee: '이분석',
    assigneeInit: '이',
    assigneeCls: 'p',
    systemId: 'sys4',
    menuId: 'm10',
    type: 'improvement',
    tags: ['KPI', '위젯'],
    author: '정팀장',
    authorInit: '정',
    authorCls: 'p',
    date: '2025.05.28',
    body: `<p>KPI 목표값 편집 후 저장 버튼 클릭 시 '저장되었습니다' 토스트가 표시되지만, 페이지 새로고침 시 <strong>이전 값으로 복원</strong>됩니다.</p>
<p>DB에 실제로 저장되지 않거나 캐시가 DB보다 우선 적용되는 것으로 추정됩니다. 저장 API 응답은 200 OK를 반환합니다.</p>`,
    subs: [],
  },

  {
    id: 'voc12',
    code: '파이프라인-2025-0005',
    title: '일별 집계 배치가 DST 전환일에 한 시간 데이터 누락',
    status: '완료',
    priority: 'medium',
    assignee: '김관리',
    assigneeInit: '김',
    assigneeCls: '',
    systemId: 'sys3',
    menuId: 'm7',
    type: 'bug',
    tags: ['ETL', '배치'],
    author: '이분석',
    authorInit: '이',
    authorCls: 'p',
    date: '2025.05.25',
    body: `<p>일별 집계 배치가 <strong>DST(일광절약시간) 전환일</strong>에 한 시간 치 데이터가 누락됩니다. 연 2회(3월, 11월 첫째 주 일요일) 반복 발생합니다.</p>
<p>타임존 처리 로직에서 DST 전환 구간을 고려하지 않아 해당 시간대(01:00~02:00)의 데이터가 건너뛰어집니다.</p>`,
    subs: [],
  },
];

const SUBDATA = {
  sub1: {
    id: 'sub1',
    parentId: 'voc1',
    code: '분석-2025-0001-1',
    title: '다중 필터 쿼리 실행 계획 분석 및 인덱스 검토',
    status: '완료',
    priority: 'medium',
    assignee: '김관리',
    assigneeInit: '김',
    assigneeCls: '',
    systemId: 'sys2',
    menuId: 'm4',
    type: 'bug',
    author: '김관리',
    authorInit: '김',
    authorCls: '',
    tags: [],
    date: '2025.06.13',
    body: `<p>다중 필터 조건 적용 시 풀 테이블 스캔이 발생하고 있었으며, 복합 인덱스가 누락된 상태였습니다. 기간·부서 컬럼에 복합 인덱스를 추가하고 쿼리 타임아웃을 60초로 상향 조정했습니다.</p>`,
  },
  sub2: {
    id: 'sub2',
    parentId: 'voc1',
    code: '분석-2025-0001-2',
    title: '차트 렌더링 레이어 비동기 요청 처리 개선',
    status: '처리중',
    priority: 'high',
    assignee: '박개발',
    assigneeInit: '박',
    assigneeCls: 'g',
    systemId: 'sys2',
    menuId: 'm4',
    type: 'bug',
    author: '김관리',
    authorInit: '김',
    authorCls: '',
    tags: [],
    date: '2025.06.13',
    body: `<p>차트 렌더링 레이어에서 다중 필터 조건을 순차 요청하던 방식을 병렬 Promise.all 방식으로 변경합니다. 현재 코드 리뷰 중이며 QA 후 배포 예정입니다.</p>`,
  },
};

// ── 공지사항 데이터
const NOTICES = [
  {
    id: 1,
    title: '시스템 정기 점검 안내 (04/25 02:00~06:00)',
    content:
      '<p>안녕하세요. 시스템 안정성 강화를 위한 <strong>정기 점검</strong>을 아래와 같이 진행합니다.</p><ul><li>일시: 2026-04-25 02:00 ~ 06:00</li><li>영향: 전체 서비스 일시 중단</li></ul><p>불편을 드려 죄송합니다.</p>',
    level: 'urgent',
    popup: true,
    from: '2026-04-20',
    to: '2026-04-25',
    visible: true,
  },
  {
    id: 2,
    title: '첨부파일 용량 제한 안내',
    content:
      '<p>첨부파일 최대 용량은 파일당 <strong>10MB</strong>, VOC당 최대 5개입니다.</p><p>허용 형식: PNG, JPG, GIF, WebP</p>',
    level: 'important',
    popup: true,
    from: '2026-04-21',
    to: '2026-05-10',
    visible: true,
  },
  {
    id: 3,
    title: 'VOC 시스템 사용 가이드 배포',
    content:
      '<p>신규 입사자를 위한 VOC 시스템 사용 가이드를 배포합니다. 우측 상단 <strong>도움말</strong> 메뉴에서 확인하세요.</p>',
    level: 'normal',
    popup: false,
    from: '2026-04-01',
    to: '2026-06-30',
    visible: true,
  },
];

// ── FAQ 데이터
const FAQS = [
  {
    id: 1,
    category: '사용법',
    q: 'VOC는 어떻게 등록하나요?',
    a: '<p>상단 <strong>+ VOC 등록</strong> 버튼을 클릭하면 등록 모달이 열립니다. 시스템 → 메뉴 → 유형을 선택한 후 제목과 내용을 입력하고 저장하세요.</p>',
    visible: true,
  },
  {
    id: 2,
    category: '사용법',
    q: '담당자를 지정하려면 어떻게 하나요?',
    a: '<p>VOC 상세 드로어에서 <strong>담당자</strong> 필드를 클릭하면 사용자 목록이 나타납니다. Manager 이상 권한이 있어야 지정 가능합니다.</p>',
    visible: true,
  },
  {
    id: 3,
    category: '오류',
    q: '파일 첨부가 안 됩니다.',
    a: '<p>지원 형식: PNG, JPG, GIF, WebP (최대 10MB / 개, 5개 / VOC). 다른 형식의 파일은 업로드가 제한됩니다. 문제가 지속되면 관리자에게 문의하세요.</p>',
    visible: true,
  },
  {
    id: 4,
    category: '정책',
    q: 'VOC 상태는 누가 변경할 수 있나요?',
    a: '<p>상태 변경(진행 중 / 완료 등)은 <strong>Manager 이상</strong> 권한을 가진 사용자만 가능합니다. 일반 사용자는 본인이 등록한 VOC를 조회만 할 수 있습니다.</p>',
    visible: true,
  },
  {
    id: 5,
    category: '정책',
    q: 'VOC를 삭제할 수 있나요?',
    a: '<p>삭제는 <strong>Admin</strong>만 가능합니다. 삭제된 VOC는 복구되지 않으며, Soft Delete 방식으로 처리됩니다.</p>',
    visible: true,
  },
  {
    id: 6,
    category: '기타',
    q: '내 계정 역할(권한)은 어디서 확인하나요?',
    a: '<p>사이드바 좌측 하단 프로필 영역에서 현재 역할을 확인할 수 있습니다. 역할 변경이 필요하면 Admin에게 문의하세요.</p>',
    visible: true,
  },
];

// ── State
const CURRENT_USER = '홍길동';
let currentView = 'all'; // 'all' | 'mine' | 'assigned'
let currentStatus = '전체';
let searchQuery = '';
let sortKey = 'date';
let sortDir = 'desc';
let filterAssignees = new Set();
let filterPriorities = new Set();
let filterTypes = new Set();
let filterTags = new Set();
let advFilterOpen = false;
let activeSysId = null;
let activeMenuId = null;
let openSysId = null;
let currentPage = 1;

let PAGE_SIZE = calcPageSize();

window.addEventListener('resize', () => {
  PAGE_SIZE = calcPageSize();
  currentPage = 1;
  renderVOCList();
});
