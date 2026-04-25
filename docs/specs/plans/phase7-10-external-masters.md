# Phase 7-10 외부 마스터 연동 설계

> 작성: 2026-04-25 | 기준 스펙: `requirements.md §16.3`, `external-masters.md`

---

## 1. 스코프

BE 메모리 캐시 기반의 외부 마스터 3종(설비·DB·프로그램) 로드·Refresh·unverified 판정 전체를 구현한다.

**포함:**

- BE: `MasterCacheService` (singleton, atomic swap, snapshot, cold start)
- BE: 부팅 시 캐시 로드 (stub JSON → snapshot fallback → cold start)
- BE: `POST /admin/masters/refresh`, `POST /vocs/:id/masters/refresh` (5분 쿨다운)
- BE: `GET /api/masters/search` (autocomplete)
- BE: `POST /vocs/:id/payload` unverified_fields 실 계산 (Phase 7-8 MVP `[]` 교체)
- FE: `MasterCacheContext` 업그레이드 (isColdStart, triggerRefresh, search)
- FE: PayloadSection 드롭다운/자동완성
- FE: Header 배지 (스냅샷 모드 / 콜드 스타트 모드)

**제외:**

- 실 MSSQL 연결 (설비 마스터 stub, DB 마스터 stub JSON 사용)
- 대시보드 "unverified 분포" 위젯 (§16.4 MVP 미포함)

---

## 2. BE 설계

### 2-1. 캐시 구조

```typescript
interface EquipmentCache {
  equipment: string[];
  maker: string[];
  model: string[];
  process: string[];
  loaded_at: string; // ISO timestamp
}

interface DbCache {
  db_tables: string[];
  jobs: string[];
  sps: string[];
  loaded_at: string;
}

interface ProgramCache {
  programs: string[];
  loaded_at: string;
}

type MasterCacheMode = 'live' | 'snapshot' | 'cold_start';

interface MasterCache {
  equipment: EquipmentCache | null;
  db: DbCache | null;
  program: ProgramCache | null;
  mode: MasterCacheMode;
}
```

### 2-2. `MasterCacheService` (singleton)

파일: `backend/src/services/masterCache.ts`

**책임:**

1. `init()` — 부팅 시 1회 호출. 로드 순서: stub JSON 로드 시도 → 실패 시 snapshot fallback → 둘 다 없으면 cold start.
2. `get()` — 현재 캐시 반환 (thread-safe: JS 단일 스레드 보장).
3. `refresh(userId)` — atomic swap. 5분 쿨다운 체크. 3종 전부 성공해야 swap. 실패 시 기존 유지.
4. `verify(fields)` — `unverified_fields` 계산.
5. `search(type, q)` — 자동완성용 prefix 검색.

**파일 경로:**

- `backend/config/masters/equipment-stub.json`
- `backend/config/masters/programs.json`
- `backend/config/masters/snapshot.json` (refresh 성공 시 자동 생성)

### 2-3. 부팅 로드 순서

```
init():
  1. loadFromStub() — equipment-stub.json + programs.json 읽기
     성공 → mode='live', writeSnapshot() (비동기, 실패 무시)
  2. 실패 시 loadFromSnapshot() — snapshot.json 읽기
     성공 → mode='snapshot'
  3. 둘 다 실패 → mode='cold_start', 3종 null 유지
```

### 2-4. Refresh atomic swap

```
refresh(userId):
  1. 쿨다운 체크: lastRefreshByUser[userId] + 5분 > now → 429 RATE_LIMITED
  2. newEquipment = loadFromStub() (or MSSQL — 함수 교체 지점)
     newDb = loadDbStub()
     둘 다 성공해야 계속. 하나라도 실패 → keep existing, return swapped=false
  3. cache = { equipment: newEquipment, db: newDb, program: cache.program, mode='live' }
  4. writeSnapshot() 비동기
  5. lastRefreshByUser[userId] = now
  6. return { swapped: true, loaded_at, sources: { equipment: {...}, db: {...} } }
```

### 2-5. `verify(payload)` — unverified_fields 계산

```typescript
function normalize(s: string) {
  return s.trim().toLowerCase();
}

function verifyPayload(payload: StructuredPayload): string[] {
  // cold_start or null cache → all external fields unverified
  const unverified: string[] = [];
  const eq = cache.equipment;
  const db = cache.db;
  const prog = cache.program;

  if (!eq) {
    unverified.push('equipment', 'maker', 'model', 'process');
  } else {
    if (payload.equipment && !eq.equipment.map(normalize).includes(normalize(payload.equipment)))
      unverified.push('equipment');
    if (payload.maker && !eq.maker.map(normalize).includes(normalize(payload.maker)))
      unverified.push('maker');
    if (payload.model && !eq.model.map(normalize).includes(normalize(payload.model)))
      unverified.push('model');
    if (payload.process && !eq.process.map(normalize).includes(normalize(payload.process)))
      unverified.push('process');
  }
  // DB master fields (arrays)
  if (!db) {
    ['related_db_tables', 'related_jobs', 'related_sps'].forEach((f) => {
      if (payload[f]?.length) unverified.push(f);
    });
  } else {
    payload.related_db_tables?.forEach((v) => {
      if (!db.db_tables.map(normalize).includes(normalize(v))) unverified.push('related_db_tables');
    });
    payload.related_jobs?.forEach((v) => {
      if (!db.jobs.map(normalize).includes(normalize(v))) unverified.push('related_jobs');
    });
    payload.related_sps?.forEach((v) => {
      if (!db.sps.map(normalize).includes(normalize(v))) unverified.push('related_sps');
    });
  }
  if (!prog) {
    if (payload.related_programs?.length) unverified.push('related_programs');
  } else {
    payload.related_programs?.forEach((v) => {
      if (!prog.programs.map(normalize).includes(normalize(v))) unverified.push('related_programs');
    });
  }

  return [...new Set(unverified)]; // dedupe
}
```

### 2-6. `GET /api/masters/search`

**권한:** Manager/Admin (payload 편집 권한 동일)  
**Query:** `type=equipment|maker|model|process|db_tables|jobs|sps|programs`, `q=<prefix>`  
**응답:** `{ items: string[], mode: MasterCacheMode }`  
**동작:** 캐시에서 prefix 매칭 (case-insensitive), 최대 20건 반환.

### 2-7. `POST /admin/masters/refresh` / `POST /vocs/:id/masters/refresh`

**권한:** Manager 이상  
**동일 로직:** `MasterCacheService.refresh(userId)` 호출  
**성공 응답:** `{ swapped: true, loaded_at, sources: { equipment: { loaded_at }, db: { loaded_at } } }`  
**실패 응답:** `{ swapped: false, error: string, kept_loaded_at: string }` + HTTP 503

### 2-8. `GET /api/masters/status`

**권한:** Manager 이상  
**응답:** `{ mode: MasterCacheMode, loaded_at?: string }` — FE 배지 결정용

---

## 3. FE 설계

### 3-1. `MasterCacheContext` 업그레이드

```typescript
interface MasterCacheContextValue {
  mode: 'live' | 'snapshot' | 'cold_start' | 'unknown'; // 초기값 unknown
  isSnapshotMode: boolean; // mode === 'snapshot'
  isColdStartMode: boolean; // mode === 'cold_start'
  triggerRefresh: (vocId?: string) => Promise<void>;
  search: (type: string, q: string) => Promise<string[]>;
}
```

- 앱 마운트 시 `GET /api/masters/status` → mode 세팅
- Manager/Admin 역할일 때만 status fetch (일반 User 불필요)

### 3-2. Header 배지

`HeaderBar.tsx` (또는 기존 헤더 컴포넌트) 수정:

- `isColdStartMode` → `<span class="master-badge cold-start">콜드 스타트 모드</span>`
- `isSnapshotMode` → `<span class="master-badge snapshot">스냅샷 모드</span>`
- 배지 스타일: `var(--status-amber-bg)` / `var(--status-amber-border)` — design.md 토큰 사용

### 3-3. PayloadSection 자동완성

각 필드에 `<datalist>` 또는 간단한 인라인 드롭다운:

- 입력 변경 시 `search(type, q)` 호출 (200ms debounce)
- 최대 20개 제안 목록 노출
- 자유 입력 허용 (제안 외 값 가능 — unverified로 저장됨)
- 🔄 버튼: `triggerRefresh(vocId)` 호출 → 성공 시 드롭다운 갱신

---

## 4. 파일 구조

```
backend/
  config/masters/
    equipment-stub.json      # 더미 설비 마스터 stub
    programs.json            # 프로그램 마스터 (고정)
    snapshot.json            # refresh 성공 시 자동 생성 (gitignore)
  src/
    services/
      masterCache.ts         # MasterCacheService singleton
    routes/
      masters.ts             # /admin/masters/refresh, /vocs/:id/masters/refresh, /masters/search, /masters/status
    __tests__/
      masterCache.test.ts    # TDD 테스트
frontend/
  src/
    api/
      masters.ts             # search(), triggerRefresh(), getStatus()
    contexts/
      MasterCacheContext.tsx # 업그레이드
    components/
      voc/
        PayloadSection.tsx   # 자동완성 추가 (기존 파일 수정)
```

---

## 5. 구현 순서 (TDD)

```
1. config 파일: equipment-stub.json, programs.json 작성
2. MasterCacheService 단위 테스트 작성 (RED)
3. MasterCacheService 구현 (GREEN)
4. routes/masters.ts 테스트 + 구현
5. vocs.ts POST payload unverified_fields TODO 해소
6. app.ts에 masters 라우터 등록 + boot init() 호출
7. FE api/masters.ts + MasterCacheContext 업그레이드
8. FE Header 배지
9. FE PayloadSection 자동완성
10. commit
```

---

## 6. stub 파일 내용

### equipment-stub.json

```json
{
  "equipment": ["Press-A", "Lathe-B", "Mill-C"],
  "maker": ["OEM Korea", "기계공업", "Alpha Tech"],
  "model": ["PR-100", "LT-200", "ML-300"],
  "process": ["용접", "절삭", "조립"]
}
```

### programs.json

```json
["ERP_BATCH_DAILY", "MES_SYNC_HOURLY", "REPORT_WEEKLY"]
```

---

## 7. 권한 매트릭스

| 액션                     | User | Manager | Admin |
| ------------------------ | :--: | :-----: | :---: |
| masters/search           |  ❌  |   ✅    |  ✅   |
| masters/status           |  ❌  |   ✅    |  ✅   |
| admin/masters/refresh    |  ❌  |   ✅    |  ✅   |
| vocs/:id/masters/refresh |  ❌  |   ✅    |  ✅   |
