# NextGen Backlog

> MVP 오픈 이후의 차세대 기능을 한 곳에 모은 백로그.
> **MVP/Phase 7 작업과 분리**해서 관리하기 위한 문서 — 진행 중인 Phase 작업은 `next-session-tasks.md` 참조.
>
> 정의 (`requirements.md:16`): RAG/임베딩 검색, 이메일 연동, AI 엔티티 해석, FTS, SLA 에스컬레이션 등. 이전 문서에서 "v2"로 표기되던 것.
> 리뷰 문서의 `v1`/`v2`/`v3`는 **리뷰 회차**이며 NextGen과 무관 (`requirements.md:17`).

---

## 1. 우선순위 (requirements.md §13 / `requirements.md:260-263`)

| 순위 | 항목                 | 메모                                                                                             |
| ---- | -------------------- | ------------------------------------------------------------------------------------------------ |
| 1    | **이메일 알림**      | 사내 이메일 시스템 연동. MVP 인앱 알림(30s 폴링)으로 Urgent 누락 우려 → 1순위                    |
| 2    | **AI 자동 분류**     | LLM 기반 고도화 태깅. `tag_rules`에 `confidence_threshold float`, `model_version text` 컬럼 추가 |
| 3    | **FTS 검색**         | PostgreSQL Full-Text Search 도입                                                                 |
| 4    | **SLA 에스컬레이션** | Due Date 초과 시 자동 알림 / 에스컬레이션                                                        |

---

## 2. 미결 항목 (외부 의존 / NextGen 묶음)

> 출처: 직전 `next-session-tasks.md` "미결 (외부 의존 / NextGen)" 섹션

| ID   | 항목                                                                | 비고                                                                                                      |
| ---- | ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| G-1  | 설비 마스터 MSSQL 스키마                                            | 담당자 자료 수집 후 `external-masters.md` §3 보완 (외부 의존)                                             |
| N-1  | 외부 마스터 캐시 인스펙트 화면 (loaded_at·항목수·실패 사유)         | MVP는 스냅샷/콜드스타트 배지만 노출 (`requirements.md` §16.3). 운영 디버그 필요성 발생 시 활성화          |
| N-2  | 자동 태그 "수동 제거 후 재부여 차단" 이력 reset UI                  | feature-voc §8.8.1에 따라 수동 제거 시 voc_history 기록되어 재부여 차단됨 — 정정 수단은 운영 실측 후 결정 |
| P-NG | i18n 외부화, 풀 RBAC + DB RLS, payload_sha256 BE 구현, OpenAPI 스펙 | NextGen 묶음                                                                                              |

---

## 3. 기능별 NextGen 유보 사항

### 3.1 데이터 모델 / 스키마

| 항목                                      | MVP 결정                                       | NextGen 시 작업                                                                                           | 출처                                               |
| ----------------------------------------- | ---------------------------------------------- | --------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| VOC `source` enum 확장 (`chatbot` 등)     | text+CHECK로 유연성 확보, 현재는 `import` 단일 | enum 확장 + 리스트 필터 드롭다운 도입                                                                     | `requirements.md:80,86`                            |
| `tag_rules` 매칭 모드                     | **키워드 only** (부분 문자열, 대소문자 무시)   | `pattern_type CHECK IN ('keyword','regex')`, `confidence_threshold float`, `model_version text` 컬럼 추가 | `requirements.md:133` / D12 / `feature-voc.md:278` |
| `chatbot_session_id` / `linked_code_refs` | **도입 유보**                                  | NextGen 재결정 시 재논의                                                                                  | Q9 (`requirements.md:604`)                         |
| 유사도 임계치                             | **MVP 제외** (환경변수로 시작)                 | B 승격 재논의                                                                                             | Q10 (`requirements.md:605`)                        |
| VOC 영구삭제                              | UI/컬럼 자리만 확보, 버튼 disabled + tooltip   | NextGen 활성화 (D7 데이터 보존 무기한 정책 변경 시점)                                                     | `feature-voc.md:629`                               |

### 3.2 통합 / 외부 시스템

| 항목                         | MVP 결정           | NextGen 시 작업                            | 출처                                |
| ---------------------------- | ------------------ | ------------------------------------------ | ----------------------------------- |
| 외부 마스터 MSSQL 전환       | 캐시 + 스냅샷 운영 | 관리 필요성 실측 후 MSSQL 기반 전환 재논의 | `external-masters.md:85`            |
| 기존 분석 시스템 통합 (O-02) | scope 외           | feature-voc §8.15 통합 작업                | `prototype-phase7-gap-rescan.md:70` |

### 3.3 UI / UX

| 항목                         | MVP 결정                         | NextGen 시 작업                                  | 출처                                                    |
| ---------------------------- | -------------------------------- | ------------------------------------------------ | ------------------------------------------------------- |
| 사용자 사전 초대 버튼        | MVP 비활성/숨김 (자동 생성 정책) | 사전 초대 도입 시 활성화                         | `requirements.md:520`                                   |
| Dashboard 위젯 자유 레이아웃 | 토글 ON/OFF + 순서 변경만        | 드래그앤드롭 재배치, 위젯 크기 조절, 항목별 잠금 | `dashboard.md:667-668`, `dashboard-v2-layout-editor.md` |
| FAQ 카테고리 정렬            | ↑↓ 버튼                          | 드래그 정렬                                      | `b-4b-notice-faq-admin-ui-design.md:100`                |
| 공지/FAQ 별도 관리 라우트    | 같은 라우트 내 인라인 관리       | 별도 라우트 분리 재검토                          | `feature-notice-faq.md:165`                             |

### 3.4 아키텍처 / 인프라

| 항목                 | MVP 결정                                                   | NextGen 시 작업                            | 출처                                              |
| -------------------- | ---------------------------------------------------------- | ------------------------------------------ | ------------------------------------------------- |
| 상태 관리            | React Context                                              | Redux 도입 검토 (확장성)                   | `requirements.md:254`                             |
| AI 워크플로우 적합성 | structured_payload 4개 배열 필드를 결과 쓰기 대상으로 고정 | NextGen AI 엔티티 해석 도입 시 그대로 활용 | `requirements.md` §16 (`requirements.md:540,550`) |

### 3.5 Wave 3 의도적 제외 + Phase 8/BE 이연

> 출처: `prototype-phase7-gap-rescan.md` Out-of-scope 영역. Wave 3 plan에서 명시적으로 제외했거나 BE/Phase 8 의존 항목.

| ID   | 항목                             | 처리                                                             | 출처                     |
| ---- | -------------------------------- | ---------------------------------------------------------------- | ------------------------ |
| N-03 | 인앱 알림 폴링 (주기적 업데이트) | Wave 3 의도적 제외 — BE 폴링 인프라(ETag 304) 구현 시점에 활성화 | `feature-voc.md:363`     |
| O-01 | 파일 저장소                      | BE infrastructure spec — Phase 8                                 | `feature-voc.md` §8.12   |
| O-03 | 설비 마스터 TBD 기간 전략        | BE 구현 전략 — G-1과 함께 결정                                   | `external-masters.md` §7 |

---

## 4. NextGen 진입 시 체크리스트

- [ ] 본 문서 항목별 MVP 운영 데이터 수집 결과 확인
- [ ] 우선순위 §1 1~4번 중 진입 항목 결정
- [ ] 해당 기능의 데이터 모델 변경 → migration 추가
- [ ] `requirements.md` / `feature-*.md` / `dashboard.md` 본문 갱신 (NextGen 표기 제거)
- [ ] 본 문서에서 진입 완료 항목 제거 또는 ✅ 표기

---

## 5. Phase 8 분리 항목 (계획서 §10 ADR Follow-ups)

> 출처: `docs/specs/plans/phase-8.md` ADR + Wave 5 close 조건 4번 leger.

| ID        | 항목                                    | 분리 사유                                                                                              | 활성화 시점                      |
| --------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------ | -------------------------------- |
| N-03-ETag | 알림 폴링 ETag 304 최적화               | MVP는 단순 GET polling으로 충분 (BE는 Wave 5 필수). ETag 헤더·캐시 매니지먼트는 운영 부하 측정 후 도입 | Phase 8 close 후 운영 1~2주 측정 |
| VR-1      | 시각 회귀 자동화 (pixel-diff)           | Phase 8 close는 수동 12 화면 yes/no 체크. 자동화는 별도 phase                                          | Phase 9 검토                     |
| OSS-1     | shadcn 카피본 라이선스 inventory 자동화 | 사내 OSS 정책 license inventory 자동 생성 스크립트. Phase 8 시점은 LICENSE 동봉 honor system           | NextGen                          |
| CON-1     | contract semver / breaking-change 정책  | `shared/contracts/<domain>.ts` 변경 정책 (메이저 변경 시 dual-write, 마이그레이션 스크립트 등)         | NextGen                          |

---

## 6. 변경 이력

| 일자       | 변경                                                                                         |
| ---------- | -------------------------------------------------------------------------------------------- |
| 2026-05-01 | 초기 분리 — `next-session-tasks.md` "미결" 섹션 + 8개 spec/review 파일에서 NextGen 언급 통합 |
| 2026-05-01 | §5 추가 — Phase 8 ADR 분리 항목 4건 (N-03-ETag / VR-1 / OSS-1 / CON-1)                       |
