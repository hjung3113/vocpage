// Stage B-12 P-10 — External Masters mock data
// Export: window.externalMastersData

// Mock flag: set to true to simulate one source failing on bulk refresh (H1/Q5 demo)
window.emSimulateError = false;

window.externalMastersData = [
  {
    id: 'equipment',
    name: '설비 마스터',
    source: 'MSSQL (설비 DB)',
    itemCount: 312,
    loadedAt: '2026-04-30 08:00:00',
    status: 'loaded',
    refreshable: true,
    lastRefreshedAt: null, // H5: cooldown tracking
    history: [
      { at: '2026-04-30 08:00:00', result: 'ok', note: '부팅 시 로드 (312건)' },
      { at: '2026-04-29 08:00:01', result: 'ok', note: '부팅 시 로드 (310건)' },
    ],
  },
  {
    id: 'db',
    name: 'DB 마스터',
    source: 'MSSQL (운영 DB)',
    itemCount: 847,
    loadedAt: '2026-04-29 09:12:00', // snapshotAt — when snapshot was taken (H3)
    snapshotAt: '2026-04-29 09:12:00', // H3: explicit snapshot timestamp
    lastAttemptAt: '2026-04-30 07:45:00', // H3: when last refresh was attempted (and failed)
    status: 'snapshot', // refresh 실패 후 스냅샷 fallback
    refreshable: true,
    lastRefreshedAt: null, // H5: cooldown tracking
    history: [
      // H3: timeline ends with error (정상 → 정상 → 실패)
      { at: '2026-04-28 09:03:55', result: 'ok', note: '정상 로드 (831건)' },
      { at: '2026-04-29 09:12:00', result: 'ok', note: '정상 로드 (847건)' },
      { at: '2026-04-30 07:45:00', result: 'error', note: 'MSSQL 연결 시간 초과 → 스냅샷 유지' },
    ],
  },
  {
    id: 'program',
    name: '프로그램 마스터',
    source: 'JSON 파일 (config/masters/programs.json)',
    itemCount: 42,
    loadedAt: '2026-04-30 08:00:01',
    status: 'loaded',
    refreshable: false, // 서버 재시작으로만 갱신
    lastRefreshedAt: null,
    history: [
      { at: '2026-04-30 08:00:01', result: 'ok', note: '부팅 시 로드 (42건)' },
      { at: '2026-04-27 08:00:03', result: 'ok', note: '부팅 시 로드 (40건)' },
      { at: '2026-04-24 08:00:02', result: 'ok', note: '부팅 시 로드 (40건)' },
    ],
  },
];
