# B-16 첨부 업로드 에러 토스트 (Wave 2 #8) — 설계 노트

> **Note:** §13.x references in this archive predate the 2026-05-02 (C-2.5 audit) rename — `uidesign.md §13` was renumbered to §14. Current equivalents: §13.1→§14.1 ... §13.12→§14.12. New §13 is "Badge System".

> 작성일: 2026-05-01
> 브랜치: `feat/b-16-attachment-error-toasts`

## 목적

VOC 드로어 첨부 영역에서 4종 에러 토스트 시연: 413 (size), 415 (type), 400 (count|other), generic.

## spec 출처

- `feature-voc.md §8` 첨부 정책 — 단일 ≤10MB, VOC당 ≤30건, 확장자 화이트리스트
- `uidesign.md §13.x` 토스트 컴포넌트

## 결정

1. **신규 파일**: `prototype/js/attachment-errors.js` (~180줄).
2. **시연 트리거**: 드로어 첨부 영역에 `<input type="file">` mock + "에러 시뮬레이션" 드롭다운 (413/415/400-count/400-other) → 선택 시 해당 토스트 표시.
3. **토스트 변형**: 빨강 border + 에러 아이콘 + 본문 + "재시도" 버튼 (mock).
4. **카피**:
   - 413: "파일 크기가 10MB를 초과합니다 ({filename}, {size}MB). 더 작은 파일을 선택하세요."
   - 415: "허용되지 않는 파일 형식입니다 ({extension}). 가능: pdf, png, jpg, xlsx 등."
   - 400-count: "VOC당 첨부 한도(30건)를 초과합니다 ({count}/30)."
   - 400-other: "첨부 업로드에 실패했습니다. 잠시 후 다시 시도하세요."

## 영향 파일

| 파일                                        | 변경                  |
| ------------------------------------------- | --------------------- |
| `prototype/js/attachment-errors.js`         | NEW — ~180줄          |
| `prototype/css/admin/attachment-errors.css` | NEW — ~80줄           |
| `prototype/prototype.html`                  | `<script>` + `<link>` |

## R1 검증

| #   | 시나리오                                   |
| --- | ------------------------------------------ |
| 1   | 413 시뮬: filename + size 토큰화 카피 노출 |
| 2   | 415 시뮬: extension 토큰화                 |
| 3   | 400-count 시뮬: 31/30                      |
| 4   | 400-other 시뮬: generic                    |
| 5   | 동시 다중 토스트 stack (3개 상한)          |

## 컨벤션

토큰 100% / escHtml on filename / ≤300줄 / append-only.
