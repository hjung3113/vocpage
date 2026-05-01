# VOC Visual Diff — Prototype vs `/voc` (Wave 1.5 Follow-up A, Stage 1 output)

Generated: 2026-05-01T17:23:02.701Z
Prototype URL: http://127.0.0.1:4174/prototype.html#page-voc
React URL: http://127.0.0.1:5173/voc

> **[NOT MEASURABLE]** The following components could not be extracted:
>
> - `voc-create-modal`: Selector not found on React side
> - `voc-notif-dropdown`: Selector not found on React side
> - `voc-review-drawer`: Selector not found on React side

> **[SELECTOR FALLBACK]** The following components used structural CSS selectors (Stage 2 will add `data-pcomp` markers):
>
> - `voc-topbar`
> - `voc-status-filters`
> - `voc-advanced-filters`
> - `voc-sort-chips`
> - `voc-table`
> - `voc-pagination`
> - `notification-bell`
> - `pagination`
> - `data-table`

## Summary

| Component            | HIGH | MED | LOW |
| -------------------- | ---- | --- | --- |
| data-table           | 5    | 7   | 1   |
| notification-bell    | 4    | 6   | 0   |
| pagination           | 1    | 10  | 0   |
| voc-advanced-filters | 4    | 9   | 0   |
| voc-pagination       | 4    | 9   | 0   |
| voc-sort-chips       | 3    | 11  | 0   |
| voc-status-filters   | 3    | 8   | 0   |
| voc-table            | 0    | 6   | 0   |
| voc-topbar           | 2    | 11  | 0   |
| voc-create-modal     | —    | —   | —   |
| voc-notif-dropdown   | —    | —   | —   |
| voc-review-drawer    | —    | —   | —   |

## data-table

| Property              | Prototype                                                                                        | React                                         | Severity | Suggested Action |
| --------------------- | ------------------------------------------------------------------------------------------------ | --------------------------------------------- | -------- | ---------------- |
| align-items           | center                                                                                           | normal                                        | HIGH     | —                |
| background-color      | oklch(0.965 0.009 255)                                                                           | rgba(0, 0, 0, 0)                              | HIGH     | —                |
| border-color          | oklch(0.18 0.026 267) oklch(0.18 0.026 267) oklch(0.88 0.012 254)                                | oklch(0.18 0.026 267)                         | HIGH     | —                |
| display               | grid                                                                                             | table                                         | HIGH     | —                |
| grid-template-columns | 22px 144px 441px 115px 108px 84px 96px                                                           | none                                          | HIGH     | —                |
| border-style          | none none solid                                                                                  | solid                                         | MED      | —                |
| font-family           | "Pretendard Variable", Pretendard, -apple-system, "system-ui", "Apple SD Gothic Neo", sans-serif | "Pretendard Variable", Pretendard, sans-serif | MED      | —                |
| height                | 32px                                                                                             | 797px                                         | MED      | —                |
| line-height           | 21px                                                                                             | 20px                                          | MED      | —                |
| padding-left          | 24px                                                                                             | 0px                                           | MED      | —                |
| padding-right         | 24px                                                                                             | 0px                                           | MED      | —                |
| width                 | 1058px                                                                                           | 976px                                         | MED      | —                |
| box-shadow            | oklch(0.88 0.012 254) 0px 1px 0px 0px, oklch(0.8 0.01 260 / 0.08) 0px 2px 8px 0px                | none                                          | LOW      | —                |

## notification-bell

| Property         | Prototype                                                                                        | React                                         | Severity | Suggested Action |
| ---------------- | ------------------------------------------------------------------------------------------------ | --------------------------------------------- | -------- | ---------------- |
| background-color | oklch(1 0 0)                                                                                     | rgba(0, 0, 0, 0)                              | HIGH     | —                |
| border-color     | oklch(0.88 0.012 254)                                                                            | oklch(0.36 0.022 264)                         | HIGH     | —                |
| color            | oklch(0.54 0.016 260)                                                                            | oklch(0.36 0.022 264)                         | HIGH     | —                |
| outline-color    | oklch(0.54 0.016 260)                                                                            | oklch(0.36 0.022 264)                         | HIGH     | —                |
| border-radius    | 8px                                                                                              | 6px                                           | MED      | —                |
| font-family      | "Pretendard Variable", Pretendard, -apple-system, "system-ui", "Apple SD Gothic Neo", sans-serif | "Pretendard Variable", Pretendard, sans-serif | MED      | —                |
| font-size        | 14px                                                                                             | 16px                                          | MED      | —                |
| height           | 32px                                                                                             | 36px                                          | MED      | —                |
| line-height      | 21px                                                                                             | 24px                                          | MED      | —                |
| width            | 32px                                                                                             | 36px                                          | MED      | —                |

## pagination

| Property        | Prototype                                                                                        | React                                         | Severity | Suggested Action |
| --------------- | ------------------------------------------------------------------------------------------------ | --------------------------------------------- | -------- | ---------------- |
| justify-content | center                                                                                           | normal                                        | HIGH     | —                |
| border-style    | none                                                                                             | solid                                         | MED      | —                |
| font-family     | "Pretendard Variable", Pretendard, -apple-system, "system-ui", "Apple SD Gothic Neo", sans-serif | "Pretendard Variable", Pretendard, sans-serif | MED      | —                |
| font-size       | 14px                                                                                             | 16px                                          | MED      | —                |
| height          | 62px                                                                                             | 36px                                          | MED      | —                |
| line-height     | 21px                                                                                             | 24px                                          | MED      | —                |
| padding-bottom  | 16px                                                                                             | 0px                                           | MED      | —                |
| padding-left    | 24px                                                                                             | 0px                                           | MED      | —                |
| padding-right   | 24px                                                                                             | 0px                                           | MED      | —                |
| padding-top     | 16px                                                                                             | 0px                                           | MED      | —                |
| width           | 1058px                                                                                           | 224.406px                                     | MED      | —                |

## voc-advanced-filters

| Property         | Prototype                                                                                        | React                                         | Severity | Suggested Action |
| ---------------- | ------------------------------------------------------------------------------------------------ | --------------------------------------------- | -------- | ---------------- |
| background-color | oklch(0.965 0.009 255)                                                                           | rgba(0, 0, 0, 0)                              | HIGH     | —                |
| border-color     | oklch(0.18 0.026 267) oklch(0.18 0.026 267) oklch(0.88 0.012 254)                                | oklch(0.18 0.026 267)                         | HIGH     | —                |
| display          | block                                                                                            | flex                                          | HIGH     | —                |
| flex-direction   | row                                                                                              | column                                        | HIGH     | —                |
| border-style     | none none solid                                                                                  | solid                                         | MED      | —                |
| column-gap       | normal                                                                                           | 12px                                          | MED      | —                |
| font-family      | "Pretendard Variable", Pretendard, -apple-system, "system-ui", "Apple SD Gothic Neo", sans-serif | "Pretendard Variable", Pretendard, sans-serif | MED      | —                |
| font-size        | 14px                                                                                             | 16px                                          | MED      | —                |
| gap              | normal                                                                                           | 12px                                          | MED      | —                |
| height           | 0px                                                                                              | 36px                                          | MED      | —                |
| line-height      | 21px                                                                                             | 24px                                          | MED      | —                |
| row-gap          | normal                                                                                           | 12px                                          | MED      | —                |
| width            | 1058px                                                                                           | 976px                                         | MED      | —                |

## voc-pagination

| Property        | Prototype                                                                                        | React                                                             | Severity | Suggested Action |
| --------------- | ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------- | -------- | ---------------- |
| align-items     | normal                                                                                           | center                                                            | HIGH     | —                |
| border-color    | oklch(0.18 0.026 267)                                                                            | oklch(0.83 0.016 256) oklch(0.18 0.026 267) oklch(0.18 0.026 267) | HIGH     | —                |
| display         | block                                                                                            | flex                                                              | HIGH     | —                |
| justify-content | normal                                                                                           | space-between                                                     | HIGH     | —                |
| border-style    | none                                                                                             | solid                                                             | MED      | —                |
| font-family     | "Pretendard Variable", Pretendard, -apple-system, "system-ui", "Apple SD Gothic Neo", sans-serif | "Pretendard Variable", Pretendard, sans-serif                     | MED      | —                |
| font-size       | 14px                                                                                             | 16px                                                              | MED      | —                |
| line-height     | 21px                                                                                             | 24px                                                              | MED      | —                |
| padding-bottom  | 0px                                                                                              | 12px                                                              | MED      | —                |
| padding-left    | 0px                                                                                              | 24px                                                              | MED      | —                |
| padding-right   | 0px                                                                                              | 24px                                                              | MED      | —                |
| padding-top     | 0px                                                                                              | 12px                                                              | MED      | —                |
| width           | 1058px                                                                                           | 1024px                                                            | MED      | —                |

## voc-sort-chips

| Property         | Prototype                                                                                        | React                                         | Severity | Suggested Action |
| ---------------- | ------------------------------------------------------------------------------------------------ | --------------------------------------------- | -------- | ---------------- |
| background-color | oklch(0.965 0.009 255)                                                                           | rgba(0, 0, 0, 0)                              | HIGH     | —                |
| border-color     | oklch(0.18 0.026 267) oklch(0.18 0.026 267) oklch(0.88 0.012 254)                                | oklch(0.18 0.026 267)                         | HIGH     | —                |
| flex-wrap        | nowrap                                                                                           | wrap                                          | HIGH     | —                |
| border-style     | none none solid                                                                                  | solid                                         | MED      | —                |
| column-gap       | 8px                                                                                              | 6px                                           | MED      | —                |
| font-family      | "Pretendard Variable", Pretendard, -apple-system, "system-ui", "Apple SD Gothic Neo", sans-serif | "Pretendard Variable", Pretendard, sans-serif | MED      | —                |
| font-size        | 14px                                                                                             | 16px                                          | MED      | —                |
| gap              | 8px                                                                                              | 6px                                           | MED      | —                |
| height           | 35px                                                                                             | 46px                                          | MED      | —                |
| line-height      | 21px                                                                                             | 24px                                          | MED      | —                |
| padding-bottom   | 6px                                                                                              | 8px                                           | MED      | —                |
| padding-top      | 6px                                                                                              | 8px                                           | MED      | —                |
| row-gap          | 8px                                                                                              | 6px                                           | MED      | —                |
| width            | 1058px                                                                                           | 1024px                                        | MED      | —                |

## voc-status-filters

| Property         | Prototype                                                                                        | React                                                             | Severity | Suggested Action |
| ---------------- | ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------- | -------- | ---------------- |
| background-color | oklch(0.98 0.007 252)                                                                            | rgba(0, 0, 0, 0)                                                  | HIGH     | —                |
| border-color     | oklch(0.18 0.026 267) oklch(0.18 0.026 267) oklch(0.88 0.012 254)                                | oklch(0.18 0.026 267) oklch(0.18 0.026 267) oklch(0.83 0.016 256) | HIGH     | —                |
| flex-wrap        | nowrap                                                                                           | wrap                                                              | HIGH     | —                |
| border-style     | none none solid                                                                                  | solid                                                             | MED      | —                |
| font-family      | "Pretendard Variable", Pretendard, -apple-system, "system-ui", "Apple SD Gothic Neo", sans-serif | "Pretendard Variable", Pretendard, sans-serif                     | MED      | —                |
| font-size        | 14px                                                                                             | 16px                                                              | MED      | —                |
| height           | 44px                                                                                             | 55px                                                              | MED      | —                |
| line-height      | 21px                                                                                             | 24px                                                              | MED      | —                |
| padding-bottom   | 0px                                                                                              | 12px                                                              | MED      | —                |
| padding-top      | 0px                                                                                              | 12px                                                              | MED      | —                |
| width            | 1058px                                                                                           | 1024px                                                            | MED      | —                |

## voc-table

| Property     | Prototype                                                                                        | React                                         | Severity | Suggested Action |
| ------------ | ------------------------------------------------------------------------------------------------ | --------------------------------------------- | -------- | ---------------- |
| border-style | none                                                                                             | solid                                         | MED      | —                |
| font-family  | "Pretendard Variable", Pretendard, -apple-system, "system-ui", "Apple SD Gothic Neo", sans-serif | "Pretendard Variable", Pretendard, sans-serif | MED      | —                |
| font-size    | 14px                                                                                             | 16px                                          | MED      | —                |
| height       | 620px                                                                                            | 797px                                         | MED      | —                |
| line-height  | 21px                                                                                             | 24px                                          | MED      | —                |
| width        | 1058px                                                                                           | 976px                                         | MED      | —                |

## voc-topbar

| Property         | Prototype                                                                                        | React                                                             | Severity | Suggested Action |
| ---------------- | ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------- | -------- | ---------------- |
| background-color | oklch(0.98 0.007 252)                                                                            | oklch(0.965 0.009 255)                                            | HIGH     | —                |
| border-color     | oklch(0.18 0.026 267) oklch(0.18 0.026 267) oklch(0.88 0.012 254)                                | oklch(0.18 0.026 267) oklch(0.18 0.026 267) oklch(0.83 0.016 256) | HIGH     | —                |
| border-style     | none none solid                                                                                  | solid                                                             | MED      | —                |
| column-gap       | 8px                                                                                              | 16px                                                              | MED      | —                |
| font-family      | "Pretendard Variable", Pretendard, -apple-system, "system-ui", "Apple SD Gothic Neo", sans-serif | "Pretendard Variable", Pretendard, sans-serif                     | MED      | —                |
| font-size        | 14px                                                                                             | 16px                                                              | MED      | —                |
| gap              | 8px                                                                                              | 16px                                                              | MED      | —                |
| height           | 56px                                                                                             | 73px                                                              | MED      | —                |
| line-height      | 21px                                                                                             | 24px                                                              | MED      | —                |
| padding-bottom   | 0px                                                                                              | 16px                                                              | MED      | —                |
| padding-top      | 0px                                                                                              | 16px                                                              | MED      | —                |
| row-gap          | 8px                                                                                              | 16px                                                              | MED      | —                |
| width            | 1058px                                                                                           | 1024px                                                            | MED      | —                |

## Token Mapping Hints

For each unique React color encountered, the nearest token from `frontend/src/tokens.ts`:

| Observed (React) | Closest token   | ΔE (LAB) |
| ---------------- | --------------- | -------- |
| rgba(0, 0, 0, 0) | `var(--bg-app)` | 2.3      |
