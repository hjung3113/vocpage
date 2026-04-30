// Stage B-12 P-10 — External Masters mock data
// Export: window.externalMastersData

window.externalMastersData = [
  {
    id: 'equipment',
    name: '설비 마스터',
    source: 'MSSQL (설비 DB)',
    itemCount: 0,
    // loaded_at null → cold-start scenario
    loadedAt: null,
    status: 'cold-start', // 'loaded' | 'cold-start' | 'snapshot' | 'error'
    refreshable: true,
    history: [
      // no history for cold-start (first deploy scenario)
    ],
  },
  {
    id: 'db',
    name: 'DB 마스터',
    source: 'MSSQL (운영 DB)',
    itemCount: 847,
    loadedAt: '2026-04-29 09:12:33',
    status: 'snapshot', // refresh 실패 후 스냅샷 fallback
    refreshable: true,
    history: [
      { at: '2026-04-29 09:12:33', result: 'ok', note: '정상 로드 (847건)' },
      { at: '2026-04-28 18:45:11', result: 'error', note: 'MSSQL 연결 시간 초과' },
      { at: '2026-04-28 09:03:55', result: 'ok', note: '정상 로드 (831건)' },
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
    history: [
      { at: '2026-04-30 08:00:01', result: 'ok', note: '부팅 시 로드 (42건)' },
      { at: '2026-04-27 08:00:03', result: 'ok', note: '부팅 시 로드 (40건)' },
      { at: '2026-04-24 08:00:02', result: 'ok', note: '부팅 시 로드 (40건)' },
    ],
  },
];
