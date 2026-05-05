# Routing Conventions

**When to read:** 라우트 추가·URL 설계·Drawer 딥링크·인증 redirect 규칙이 필요할 때

> Frontend 라우팅 정본 문서.

---

## §10.1 라우트 목록

```
/                         → /vocs redirect (또는 role별 분기)
/login                    → 로그인 (미인증 시 진입점)
/vocs                     → VOC 목록
/dashboard                → 대시보드 (MANAGER 이상)
/notices                  → 공지사항
/faqs                     → FAQ
/admin                    → 관리자 홈 (ADMIN 이상)
/admin/result-review      → VOC 결과 검토
/admin/tag-rules          → 태그 규칙 관리
/admin/tags               → 태그 마스터 관리
/admin/systems            → 시스템 관리
/admin/users              → 사용자 관리
/admin/external-masters   → External Master 관리
/admin/notices            → 공지 관리
/admin/faqs               → FAQ 관리
/403                      → 권한 없음
*                         → NotFound (404)
```

---

## §10.2 라우트 규칙

```
리소스명            복수형 사용          /vocs, /notices, /faqs
admin 영역          /admin prefix       /admin/users, /admin/tags
인증 없음           /login redirect     returnTo query param 포함
admin 권한 없음     /403 redirect
root /              role별 분기:
                      MANAGER 이상 → /dashboard
                      그 외         → /vocs
```

---

## §10.3 VOC 상세 Drawer URL

Drawer는 별도 페이지 없이 `/vocs`에서 query param으로 관리.

```
목록          /vocs?page=1&pageSize=20&status=OPEN
Drawer 열림   /vocs?page=1&status=OPEN&drawer={vocId}
```

- `?drawer={id}` 진입 시 목록 유지 + Drawer auto-open
- 뒤로가기 → Drawer 닫힘 (query param 제거)
- `/vocs/:vocId` 독립 페이지 없음 (딥링크 = `?drawer={id}`)

---

## §10.4 Query String 규칙

```
페이지네이션   ?page=1&pageSize=20        (기본값: page=1, pageSize=20)
정렬          ?sort=createdAt&order=desc  (단일 정렬만 허용)
필터 단일값   ?status=OPEN
필터 복수값   repeated keys ?tag=A&tag=B  (comma join 금지)
검색          ?keyword=login
Drawer        ?drawer={vocId}
기본값        URL에서 omit, parse 실패 시 Zod fallback + URL replace
```

---

## §10.5 인증/권한 처리

```
401 (세션 만료)   → /login?returnTo={현재 경로} redirect + toast 안내
403 (권한 없음)   → /403 redirect
/admin/* 전체    → ADMIN role 필수, 미충족 시 /403
```

---

## §10.6 원칙

```
trailing slash     사용 안 함 (/vocs, /admin/users)
URL 인코딩         encodeURIComponent 사용 (공백·특수문자)
개발용 라우트      /dev/* prefix (e.g. /dev/login)
```
