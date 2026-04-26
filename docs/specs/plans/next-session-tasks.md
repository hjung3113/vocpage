# vocpage — 다음 세션 태스크 계획

> 최종 업데이트: 2026-04-26 (27차 — Phase 7 완료, PR #38 머지, Phase 8 대기)
> 목표: **Phase 8 운영 실구현 + 배포**

## 현재 상태

| 항목                              | 상태                 |
| --------------------------------- | -------------------- |
| Phase 0~7 구현                    | ✅ 완료              |
| Playwright E2E B-1~B-7 버그 수정  | ✅ 완료 (2026-04-26) |
| feat/voc-seeds-toastui-fix PR #38 | ✅ 머지 완료         |
| 현재 브랜치                       | `main`               |

---

## 🔴 Phase 8: 운영 실구현 + 배포

> **목표**: production 준비 완료 + 실 환경 배포.

| 단계 | 내용                                                            | 비고               |
| ---- | --------------------------------------------------------------- | ------------------ |
| 8-1  | `connect-pg-simple` 세션 스토어 — `NODE_ENV=production` 시 적용 | F-4 defer에서 이관 |
| 8-2  | OIDC 인증 실구현 (`oidcAuthMiddleware`)                         |                    |
| 8-3  | Production Dockerfile + 빌드 파이프라인                         | 기술부채           |
| 8-4  | 구조화 로깅 (`pino`)                                            | 기술부채           |
| 8-5  | 실 MSSQL 연동 (설비 마스터 — 담당자 자료 수집 후)               | 외부 의존 (G-1)    |
| 8-6  | 배포 + smoke test                                               |                    |
| 8-7  | Playwright E2E 설정 + 핵심 3플로우 테스트 (requirements §13.3)  |                    |
| 8-8  | Jira 마이그레이션 스크립트 작성 + 실행 (오픈 전 필수)           |                    |

### Phase 8 착수 전 확인 사항

- [ ] G-1 설비 마스터 MSSQL 스키마 — 담당자 자료 수집 후 `external-masters.md §3` 업데이트 (외부 의존)

---

## 전체 완료 조건

- [x] prototype → 실구현 컴포넌트 완비
- [x] `requirements.md` + `design.md` — 단일 출처로 완비, 인덱스 포함
- [x] CLAUDE.md frontend / backend / prototype / project 단위로 분리
- [x] 인증 mock 전략 + DB 마이그레이션 방식 결정 및 문서화
- [x] 상태 관리 방식 결정 → requirements.md 반영
- [x] API 계약 방식 결정 + Mock API 전략 확정
- [ ] Production 배포 완료 (Phase 8)
- [ ] Jira 마이그레이션 완료 (Phase 8)
