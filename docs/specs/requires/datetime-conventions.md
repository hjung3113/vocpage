# Date / Time Conventions

**When to read:** 날짜·시간 표시, UTC↔Seoul 변환, date-fns-tz 사용 규칙이 필요할 때

> Frontend 날짜·시간 처리 정본 문서.

---

## §15.1 기본 정책

```
DB / API 저장     UTC ISO 8601 string  (예: "2026-05-05T04:00:00.000Z")
프론트 표시       Asia/Seoul (IANA timezone — "+09:00" 리터럴 금지)
날짜 형식         YYYY-MM-DD
일시 형식         YYYY-MM-DD HH:mm
상대시간          생성·수정 후 24시간 이내 → 상대시간, 이후 → 절대 일시
```

---

## §15.2 의존성

```
date-fns       날짜 포맷·연산
date-fns-tz    timezone 변환 (Asia/Seoul) — 필수
```

`date-fns`만으로는 timezone 변환 불가. `date-fns-tz` 함께 사용.  
Historical date (1988년 이전 한국 DST) 포함 시 IANA database 의존 — `+09:00` offset 하드코딩 금지.

---

## §15.3 함수 위치 및 시그니처

모든 날짜 포맷팅은 `shared/lib/date.ts`에서만 처리.  
컴포넌트 내부 직접 포맷 로직 금지.

```ts
// shared/lib/date.ts
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
import { parseISO } from 'date-fns';

const TZ = 'Asia/Seoul';

// API ISO string → 표시용 날짜
export function formatDate(iso: string): string; // "2026-05-05"
export function formatDateTime(iso: string): string; // "2026-05-05 13:00"
export function formatRelativeTime(iso: string): string; // "3분 전" | "2026-05-04 09:30"

// 사용자 입력 날짜(Seoul local) → UTC ISO string (API 전송용)
export function parseDateInput(value: string): string; // "2026-05-05" → UTC ISO
```

---

## §15.4 날짜 전용 필드 (TZ 변환 없는 경우)

생일, 마감일 등 시간 없는 날짜 필드는 TZ 변환 대신 단순 파싱.

```ts
// shared/types/date.types.ts
type LocalDate = string; // YYYY-MM-DD, no TZ semantics
type Instant = string; // UTC ISO 8601

// API 필드: type으로 구분
interface VocMeta {
  createdAt: Instant; // TZ 변환 필요
  dueDate: LocalDate; // TZ 변환 불필요
}
```

---

## §15.5 원칙

```
formatRelativeTime   24h 이내 → 상대시간, 이후 → formatDateTime
IANA timezone        'Asia/Seoul' 문자열 고정 — "+09:00" 금지
date-fns-tz          import.meta 없이 서버 사이드 안전
컴포넌트 내           new Date(), toLocaleString() 직접 사용 금지
```
