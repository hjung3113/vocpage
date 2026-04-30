# docs/specs

VOC 시스템의 모든 설계·계획·리뷰 문서가 모이는 위치. 루트 `CLAUDE.md`의 "Document Structure" 규칙을 따른다.

## 디렉토리 역할

| 디렉토리    | 용도                                     | 수명                                              |
| ----------- | ---------------------------------------- | ------------------------------------------------- |
| `requires/` | 요구사항·디자인 시스템 등 canonical spec | 영구 — 결정의 single source of truth              |
| `plans/`    | 구현 계획 (feature 단위 또는 세션 단위)  | 작업 진행 중에만 유효, 완료 시 삭제               |
| `reviews/`  | 리뷰·브레인스토밍·갭 분석 결과           | 결정이 spec에 반영되면 삭제 (git 히스토리로 충분) |

## 어떤 결정은 어디에 쓰나

| 결정 종류                                      | 작성 위치                                               | 언어    |
| ---------------------------------------------- | ------------------------------------------------------- | ------- |
| 시각 디자인 (색·타이포·레이아웃·컴포넌트 스펙) | `requires/uidesign.md`                                  | English |
| 기능·동작·API·비즈니스 규칙                    | `requires/requirements.md` 또는 `requires/feature-*.md` | Korean  |
| 신규 기능 구현 계획                            | `plans/<feature>.md`                                    | Korean  |
| 리뷰·갭 분석·브레인스토밍                      | `reviews/<topic>.md`                                    | Korean  |

## 규칙

- `uidesign.md`에 동작·기능 스펙을 쓰지 않는다 (역방향 금지)
- `requirements.md`에 시각 디자인 규칙을 쓰지 않는다
- `reviews/`의 결과로 채택된 결정은 즉시 해당 spec 파일에 반영하고, 리뷰 원본은 삭제 가능
- 도구 임시 디렉토리 (`.omc/plans/`, `.superpowers/` 등) 는 영구 위치가 아니다 — canonical 문서는 항상 `docs/specs/` 하위
