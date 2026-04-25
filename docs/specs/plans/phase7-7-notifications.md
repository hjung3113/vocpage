# Phase 7-7 알림 설계

> 작성: 2026-04-25 | 기준 스펙: `feature-voc.md §8.6, §8.14`

---

## 1. 스펙 요약

| 항목           | 내용                                                                                 |
| -------------- | ------------------------------------------------------------------------------------ |
| 알림 발생 조건 | ① 타인이 내 VOC에 댓글 작성 (자기 댓글 제외) ② 내 VOC 상태 변경 ③ 나에게 담당자 배정 |
| 미읽음 배지    | 벨 아이콘 + 숫자 (최대 99+)                                                          |
| Urgent 배지    | Urgent VOC 관련 알림(배정·상태변경) → 빨간 느낌표 배지, 해당 알림 읽으면 해제        |
| 보관 정책      | 최근 50건, 51번째부터 오래된 순 삭제. 30일 지난 알림은 읽음 처리 후 자동 삭제        |
| 중복 억제      | 동일 (user_id, type, voc_id) → 5분 내 debounce                                       |
| 폴링 주기      | 30초, 탭 비활성 시 일시 중단 (visibilityState)                                       |
| ETag           | `GET /api/notifications/unread-count` → ETag 헤더 반환, 304 캐시 활용                |
| 폴링 에러      | 3회 재시도 (1s → 2s → 4s exponential backoff), 401 → 로그인 리다이렉트               |

---

## 2. 스키마 불일치 해소 (설계문서 우선)

### 2-1. `type` 값 통일

| 출처                              | 값                                                                                                   |
| --------------------------------- | ---------------------------------------------------------------------------------------------------- |
| DB migration (`006_settings.sql`) | `comment`, `status_change`, `assigned`                                                               |
| OpenAPI schema                    | `status_change`, `comment`, `mention`, `assignment`, `urgent`                                        |
| **결정 (requirements §8.6 우선)** | `comment`, `status_change`, `assigned` 유지. OpenAPI를 DB에 맞게 수정. `mention`·`urgent`는 NextGen. |

### 2-2. `message` 컬럼 부재

- OpenAPI `Notification` schema에 `message: string` 있음, DB에는 없음.
- **결정**: DB에 `message` 컬럼을 추가하지 않고 **쿼리에서 동적 생성**한다.
  - `comment` → `"{voc.title}" VOC에 새 댓글이 달렸습니다.`
  - `status_change` → `"{voc.title}" VOC 상태가 {new_status}(으)로 변경되었습니다.`
  - `assigned` → `"{voc.title}" VOC의 담당자로 배정되었습니다.`
- 이유: message는 표시용 파생 데이터. DB에 중복 저장 불필요.

### 2-3. OpenAPI 수정 사항

- `Notification.type` enum: `['comment', 'status_change', 'assigned']` (mention/urgent 제거)
- 변경 후 `npm run codegen` 재실행 → `shared/types/api.ts` 재생성

---

## 3. 새 마이그레이션 불필요

`006_settings.sql`의 `notifications` 테이블은 그대로 사용. 스키마 변경 없음.

```sql
-- 현재 테이블 (변경 없음)
CREATE TABLE notifications (
  id         uuid        NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id    uuid        NOT NULL REFERENCES users(id),
  type       text        NOT NULL CHECK (type IN ('comment','status_change','assigned')),
  voc_id     uuid        NOT NULL REFERENCES vocs(id),
  read_at    timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

---

## 4. API 설계

### 4-1. `GET /api/notifications`

- 인증 필요 (401)
- 현재 사용자의 알림 최근 50건 반환 (created_at DESC)
- 30일 이후 read된 알림은 응답에서 제외
- 응답 호출 시 **일괄 읽음 처리** (§8.14): `read_at = now()` where `read_at IS NULL`
  - 주의: 목록 조회 자체가 읽음 처리를 유발 (스펙 §8.14 명시)
- 응답 예시:
  ```json
  [
    {
      "id": "uuid",
      "user_id": "uuid",
      "type": "comment",
      "voc_id": "uuid",
      "message": "\"분석 시스템 오류\" VOC에 새 댓글이 달렸습니다.",
      "is_read": false,
      "created_at": "2026-04-25T10:00:00Z"
    }
  ]
  ```

### 4-2. `GET /api/notifications/unread-count`

- 인증 필요 (401)
- `read_at IS NULL` 카운트 반환
- **ETag** 헤더: `"W/\"<count>\""` 형태 약한 ETag. count가 변하지 않으면 304 반환.
- 응답: `{ "count": 3 }`

### 4-3. `PATCH /api/notifications/:id/read`

- 인증 필요 (401)
- 본인 알림만 읽음 처리 (타인 알림 → 404)
- `read_at = now()` 설정
- 응답: `{ "ok": true }`

---

## 5. 알림 발생 (Emission) 지점

### 5-1. Helper 함수: `emitNotification`

`backend/src/services/notifications.ts` 신규 생성:

```typescript
interface EmitOptions {
  pool: Pool;
  userId: string; // 수신자
  type: 'comment' | 'status_change' | 'assigned';
  vocId: string;
}

async function emitNotification(opts: EmitOptions): Promise<void>;
```

내부 동작:

1. **Debounce 체크**: 최근 5분 내 동일 `(user_id, type, voc_id)` 존재하면 skip
2. **INSERT** 실행
3. **Max 50 정리**: 해당 user의 알림이 50건 초과면 오래된 순으로 삭제

### 5-2. 발생 지점

| 파일                            | 조건                      | type            | 수신자            |
| ------------------------------- | ------------------------- | --------------- | ----------------- |
| `routes/comments.ts` POST       | commenter ≠ voc.author_id | `comment`       | `voc.author_id`   |
| `routes/vocs.ts` PATCH status   | 상태 변경 성공            | `status_change` | `voc.author_id`   |
| `routes/vocs.ts` PATCH assignee | `assignee_id` 변경 성공   | `assigned`      | new `assignee_id` |

- 알림 발생은 fire-and-forget (await는 하되, 실패 시 로그만 남기고 주 응답에 영향 없음)

---

## 6. 프론트엔드 설계

### 6-1. API 클라이언트

`frontend/src/api/notifications.ts` 신규:

```typescript
getNotifications(): Promise<Notification[]>     // GET /api/notifications
getUnreadCount(etag?: string): Promise<{ count: number; etag: string } | 304>
markRead(id: string): Promise<void>
```

### 6-2. `NotificationContext` 업그레이드

현재: stub (빈 배열, 폴링 없음)  
변경:

- `useQuery` 대신 `useEffect` + `setInterval` 기반 30초 폴링
- `document.addEventListener('visibilitychange', ...)` 탭 비활성 시 폴링 중단
- ETag 저장 및 304 처리
- 3회 재시도 exponential backoff

```typescript
interface NotificationContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  hasUrgentUnread: boolean; // Urgent VOC 알림 존재 여부
  isPolling: boolean; // stub false → 실제 boolean
  markAsRead: (id: string) => Promise<void>;
  refetchPanel: () => Promise<void>; // 패널 열릴 때 호출
}
```

### 6-3. UI 컴포넌트

`frontend/src/components/common/NotificationBell.tsx` 신규:

- 벨 아이콘 + 미읽음 배지 (99+)
- Urgent 빨간 느낌표 배지 (hasUrgentUnread)
- 클릭 시 NotificationPanel 토글

`frontend/src/components/common/NotificationPanel.tsx` 신규:

- 알림 목록 (최근 50건)
- 아이템: VOC 제목, type 아이콘, 상대시간
- 패널 열릴 때 `refetchPanel()` 호출 (일괄 읽음 처리 트리거)

---

## 7. Urgent 배지 조건

- `voc.priority === 'urgent'` 인 VOC의 알림 중 `is_read === false` 존재 시 → `hasUrgentUnread = true`
- BE에서 `vocs.priority` join 필요 (`GET /api/notifications` 응답에 `voc_priority` 포함)
  - OpenAPI `Notification` schema에 `voc_priority` 필드 추가

---

## 8. 스펙 vs 프로토타입 불일치 사항

- 프로토타입에 알림 패널 UI 있으나 Urgent 빨간 느낌표 배지 구현 여부 불명확
- **결정**: requirements §8.6 기준으로 Urgent 배지 구현 (design.md에 반영 필요)

---

## 9. 구현 순서

```
1. OpenAPI 수정 (type enum, voc_priority 추가) + codegen
2. BE: notifications.ts service (emitNotification)
3. BE: notifications.ts route (3 endpoints)
4. BE: emission 지점 연결 (comments, vocs)
5. BE: tests (TDD 선작성)
6. FE: api/notifications.ts client
7. FE: NotificationContext 업그레이드
8. FE: NotificationBell + NotificationPanel 컴포넌트
9. FE: Header에 NotificationBell 마운트
```
