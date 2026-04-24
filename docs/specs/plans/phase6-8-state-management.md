# Phase 6-8: 상태 관리 방식 확정

> 결정 기준: requirements.md §6.2 — React Context (MVP). Redux는 NextGen 검토.
> 브랜치: `feat/6-8-state-management`
> 작성: 2026-04-24

---

## 1. 전역 상태 vs 로컬 상태 경계

| 상태                                   | 범위             | 근거                                                     |
| -------------------------------------- | ---------------- | -------------------------------------------------------- |
| 로그인 사용자 (`user`)                 | **전역**         | 모든 페이지·컴포넌트가 권한 판단에 사용                  |
| VOC 목록 필터 (`filters`)              | **전역**         | 목록·대시보드 탭 전환 시 필터 유지 필요                  |
| 선택된 VOC / Drawer 열림 여부          | **전역**         | Drawer가 URL 변경 없이 라우트 전환을 가로지름            |
| 인앱 알림 (`notifications`)            | **전역**         | 헤더 배지 + 드롭다운: 어느 페이지에서든 표시             |
| VOC 생성 모달 열림 여부                | **로컬**         | 특정 페이지(VOC 목록)에서만 사용                         |
| 페이지네이션 (`page`, `pageSize`)      | **URL 파라미터** | 뒤로가기·공유 지원                                       |
| 정렬 (`sortBy`, `sortDir`)             | **URL 파라미터** | 필터와 동일 이유                                         |
| 폼 입력값 (VOC 작성)                   | **로컬**         | 제출 후 즉시 폐기                                        |
| 외부 마스터 캐시 상태 (`snapshotMode`) | **전역**         | 헤더 배지(Manager/Admin 전용), BE에서 응답 헤더로도 전달 |

---

## 2. Context 목록 및 상태 형태

### 2-1. AuthContext

```typescript
interface AuthUser {
  id: string;
  name: string;
  role: 'admin' | 'manager' | 'user';
  department?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (role: AuthUser['role']) => Promise<void>; // mock mode only
  logout: () => Promise<void>;
  refresh: () => Promise<void>; // re-fetch /api/auth/me
}
```

- 초기화: `useEffect` → `GET /api/auth/me` (세션 복구)
- `login`은 `VITE_AUTH_MODE=mock`일 때만 노출. OIDC 모드에서는 사용 안 함.

### 2-2. VOCFilterContext

```typescript
interface VOCFilters {
  systemId: string | null;
  menuId: string | null;
  status: VocStatus | null; // 'draft'|'접수'|'검토중'|'처리중'|'완료'|'드랍'
  tagIds: string[];
  assigneeId: string | null;
  from: string | null; // ISO date
  to: string | null;
  keyword: string;
  source: 'manual' | 'import' | null;
}

interface VOCFilterContextValue {
  filters: VOCFilters;
  setFilter: <K extends keyof VOCFilters>(key: K, value: VOCFilters[K]) => void;
  setFilters: (partial: Partial<VOCFilters>) => void;
  resetFilters: () => void;
  activeFilterCount: number; // 배지 표시용
}
```

- 초기값: 모든 필드 null / 빈 배열 / 빈 문자열
- `activeFilterCount`: null·빈값 아닌 필드 수 (keyword 1자 이상 포함)

### 2-3. VOCDrawerContext

```typescript
interface VOCDrawerContextValue {
  selectedVocId: string | null;
  isOpen: boolean;
  openDrawer: (vocId: string) => void;
  closeDrawer: () => void;
}
```

- `openDrawer` 호출 시 `isOpen=true` + `selectedVocId` 설정
- `closeDrawer` 호출 시 `isOpen=false` → 애니메이션 후 `selectedVocId=null` (300ms delay)
- `selectedVocId`는 Drawer 마운트 유지용 (닫힘 애니메이션 중에도 데이터 보존)

### 2-4. NotificationContext

```typescript
interface AppNotification {
  id: string;
  vocId: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  isPolling: boolean;
}
```

- 30초 폴링: `GET /api/notifications?unread=true`
- 미인증 시 폴링 중단 (user=null이면 setInterval 제거)

### 2-5. MasterCacheContext

```typescript
interface MasterCacheContextValue {
  isSnapshotMode: boolean; // BE 메모리 로드 실패 → 디스크 스냅샷 fallback
}
```

- BE가 응답 헤더 `X-Master-Snapshot: true`를 내리면 `isSnapshotMode=true`로 전환
- Manager/Admin에게만 헤더 배지 표시 (AuthContext.user.role 교차 확인)
- VOC 관련 API 응답 인터셉터에서 감지

---

## 3. Provider 구성 (AppProviders)

```
<AuthProvider>                  ← 최상단 (나머지 모두 user에 의존)
  <NotificationProvider>        ← user 필요 (폴링 조건)
    <MasterCacheProvider>       ← user 필요 (배지 표시 조건)
      <VOCFilterProvider>       ← 독립 (인증 불필요)
        <VOCDrawerProvider>     ← 독립 (인증 불필요)
          {children}
        </VOCDrawerProvider>
      </VOCFilterProvider>
    </MasterCacheProvider>
  </NotificationProvider>
</AuthProvider>
```

`main.tsx`에서 `<AppProviders>` 단일 컴포넌트로 감싸 `<RouterProvider>` 상위에 마운트.

---

## 4. 파일 구조

```
frontend/src/
├── contexts/
│   ├── AuthContext.tsx
│   ├── VOCFilterContext.tsx
│   ├── VOCDrawerContext.tsx
│   ├── NotificationContext.tsx
│   ├── MasterCacheContext.tsx
│   └── AppProviders.tsx        ← 위 5개 조합
└── hooks/
    ├── useAuth.ts               ← useContext(AuthContext) 래퍼
    ├── useVOCFilter.ts          ← useContext(VOCFilterContext) 래퍼
    ├── useDrawer.ts             ← useContext(VOCDrawerContext) 래퍼
    ├── useNotifications.ts      ← useContext(NotificationContext) 래퍼
    └── useMasterCache.ts        ← useContext(MasterCacheContext) 래퍼
```

각 훅은 Context가 Provider 밖에서 호출되면 명시적 에러를 던짐:

```typescript
if (!ctx) throw new Error('useAuth must be used within AuthProvider');
```

---

## 5. 구현 범위 (6-8 스코프)

| 항목                                | 포함 여부 | 비고                           |
| ----------------------------------- | --------- | ------------------------------ |
| 5개 Context + AppProviders          | ✅        |                                |
| 5개 커스텀 훅                       | ✅        |                                |
| `main.tsx` 업데이트                 | ✅        | AppProviders 마운트            |
| Context 단위 테스트                 | ✅        | Vitest + React Testing Library |
| 실제 API 연동 (VOC 목록, 알림 폴링) | ❌        | Phase 7에서 구현               |
| Notification API 구현               | ❌        | Phase 7에서 구현 (mock만)      |

---

## 6. 미결 사항

| 항목                                             | 결정 필요 시점              |
| ------------------------------------------------ | --------------------------- |
| `VOCFilters` URL 동기화 (`useSearchParams`)      | Phase 7 목록 페이지 구현 시 |
| Notification 폴링 간격 조정 (30s 고정 vs 백오프) | Phase 7 알림 구현 시        |
