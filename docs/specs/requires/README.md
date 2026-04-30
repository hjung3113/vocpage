# requires/

Canonical spec. 기능·동작·API·디자인 결정의 single source of truth.

## 파일 구성

| 파일                    | 범위                                                                                       | 언어    |
| ----------------------- | ------------------------------------------------------------------------------------------ | ------- |
| `requirements.md`       | 전체 기능 요구사항 — 데이터 모델, API, 권한, 비즈니스 규칙. §5.1에 비데이터 동작 규약 포함 | Korean  |
| `uidesign.md`           | 시각 디자인 시스템 — 색 토큰, 타이포, 컴포넌트 스펙, 레이아웃, 간격, elevation             | English |
| `dashboard.md`          | 대시보드 화면 상세 spec                                                                    | Korean  |
| `feature-voc.md`        | VOC 본체 기능 (목록·상세·드로어·내부 노트 등)                                              | Korean  |
| `feature-notice-faq.md` | 공지 / FAQ 기능                                                                            | Korean  |
| `external-masters.md`   | 외부 마스터 동기화 (cold start, 5분 쿨다운 등)                                             | Korean  |

## 어디에 쓸까

- 신규 화면·필드·동작 추가 → `requirements.md` 또는 적절한 `feature-*.md`
- 색·간격·컴포넌트 스타일 변경 → `uidesign.md`
- 한 화면(대시보드) 안에서 끝나는 결정 → `dashboard.md`
- 기능이 충분히 커서 독립 파일이 필요하면 → 새 `feature-<name>.md` 생성 후 `requirements.md`에서 포인터 링크

## 분기 규칙

- 동작·데이터 규칙은 절대 `uidesign.md`에 쓰지 않는다
- 시각 규칙은 절대 `requirements.md`에 쓰지 않는다
- `uidesign.md`는 영어로만 작성
