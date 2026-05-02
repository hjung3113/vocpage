# VOC Visual Diff — Prototype vs `/voc` (Wave 1.5 Follow-up A, Stage 1 output)

Generated: 2026-05-01T18:09:24.619Z
Prototype URL: http://127.0.0.1:4174/prototype.html#page-voc
React URL: http://127.0.0.1:5173/voc

> **[NOT MEASURABLE]** The following components could not be extracted:
>
> - `voc-advanced-filters`: Selector not found on React side
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
| data-table           | 3    | 6   | 1   |
| notification-bell    | 0    | 3   | 0   |
| pagination           | 0    | 10  | 0   |
| voc-create-modal     | 2    | 13  | 1   |
| voc-pagination       | 4    | 9   | 0   |
| voc-sort-chips       | 0    | 6   | 0   |
| voc-status-filters   | 0    | 5   | 0   |
| voc-table            | 0    | 4   | 0   |
| voc-topbar           | 0    | 5   | 0   |
| voc-advanced-filters | —    | —   | —   |
| voc-notif-dropdown   | —    | —   | —   |
| voc-review-drawer    | —    | —   | —   |

## data-table

| Property              | Prototype                                                                                        | React                                         | Severity | Suggested Action |
| --------------------- | ------------------------------------------------------------------------------------------------ | --------------------------------------------- | -------- | ---------------- |
| align-items           | center                                                                                           | normal                                        | HIGH     | —                |
| display               | grid                                                                                             | table-header-group                            | HIGH     | —                |
| grid-template-columns | 22px 144px 441px 115px 108px 84px 96px                                                           | none                                          | HIGH     | —                |
| border-style          | none none solid                                                                                  | solid                                         | MED      | —                |
| font-family           | "Pretendard Variable", Pretendard, -apple-system, "system-ui", "Apple SD Gothic Neo", sans-serif | "Pretendard Variable", Pretendard, sans-serif | MED      | —                |
| height                | 32px                                                                                             | 37px                                          | MED      | —                |
| padding-left          | 24px                                                                                             | 0px                                           | MED      | —                |
| padding-right         | 24px                                                                                             | 0px                                           | MED      | —                |
| width                 | 1058px                                                                                           | 976px                                         | MED      | —                |
| box-shadow            | oklch(0.88 0.012 254) 0px 1px 0px 0px, oklch(0.8 0.01 260 / 0.08) 0px 2px 8px 0px                | none                                          | LOW      | —                |

## notification-bell

| Property    | Prototype                                                                                        | React                                         | Severity | Suggested Action |
| ----------- | ------------------------------------------------------------------------------------------------ | --------------------------------------------- | -------- | ---------------- |
| font-family | "Pretendard Variable", Pretendard, -apple-system, "system-ui", "Apple SD Gothic Neo", sans-serif | "Pretendard Variable", Pretendard, sans-serif | MED      | —                |
| font-size   | 14px                                                                                             | 16px                                          | MED      | —                |
| line-height | 21px                                                                                             | 24px                                          | MED      | —                |

## pagination

| Property       | Prototype                                                                                        | React                                         | Severity | Suggested Action |
| -------------- | ------------------------------------------------------------------------------------------------ | --------------------------------------------- | -------- | ---------------- |
| border-style   | none                                                                                             | solid                                         | MED      | —                |
| font-family    | "Pretendard Variable", Pretendard, -apple-system, "system-ui", "Apple SD Gothic Neo", sans-serif | "Pretendard Variable", Pretendard, sans-serif | MED      | —                |
| font-size      | 14px                                                                                             | 16px                                          | MED      | —                |
| height         | 62px                                                                                             | 36px                                          | MED      | —                |
| line-height    | 21px                                                                                             | 24px                                          | MED      | —                |
| padding-bottom | 16px                                                                                             | 0px                                           | MED      | —                |
| padding-left   | 24px                                                                                             | 0px                                           | MED      | —                |
| padding-right  | 24px                                                                                             | 0px                                           | MED      | —                |
| padding-top    | 16px                                                                                             | 0px                                           | MED      | —                |
| width          | 1058px                                                                                           | 224.406px                                     | MED      | —                |

## voc-create-modal

| Property              | Prototype | React                                                                                                                                                                                                              | Severity | Suggested Action |
| --------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- | ---------------- |
| display               | block     | grid                                                                                                                                                                                                               | HIGH     | —                |
| grid-template-columns | none      | 929px                                                                                                                                                                                                              | HIGH     | —                |
| border-radius         | 14px      | 8px                                                                                                                                                                                                                | MED      | —                |
| column-gap            | normal    | 16px                                                                                                                                                                                                               | MED      | —                |
| font-size             | 14px      | 16px                                                                                                                                                                                                               | MED      | —                |
| gap                   | normal    | 16px                                                                                                                                                                                                               | MED      | —                |
| height                | 833px     | 700px                                                                                                                                                                                                              | MED      | —                |
| line-height           | 21px      | 24px                                                                                                                                                                                                               | MED      | —                |
| max-width             | 648px     | 672px                                                                                                                                                                                                              | MED      | —                |
| padding-bottom        | 0px       | 24px                                                                                                                                                                                                               | MED      | —                |
| padding-left          | 0px       | 24px                                                                                                                                                                                                               | MED      | —                |
| padding-right         | 0px       | 24px                                                                                                                                                                                                               | MED      | —                |
| padding-top           | 0px       | 24px                                                                                                                                                                                                               | MED      | —                |
| row-gap               | normal    | 16px                                                                                                                                                                                                               | MED      | —                |
| width                 | 648px     | 672px                                                                                                                                                                                                              | MED      | —                |
| box-shadow            | none      | rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.1) 0px 4px 6px -4px | LOW      | —                |

## voc-pagination

| Property        | Prototype                                                                                        | React                                                             | Severity | Suggested Action |
| --------------- | ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------- | -------- | ---------------- |
| align-items     | normal                                                                                           | center                                                            | HIGH     | —                |
| border-color    | oklch(0.18 0.026 267)                                                                            | oklch(0.88 0.012 254) oklch(0.18 0.026 267) oklch(0.18 0.026 267) | HIGH     | —                |
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

| Property     | Prototype                                                                                        | React                                         | Severity | Suggested Action |
| ------------ | ------------------------------------------------------------------------------------------------ | --------------------------------------------- | -------- | ---------------- |
| border-style | none none solid                                                                                  | solid                                         | MED      | —                |
| font-family  | "Pretendard Variable", Pretendard, -apple-system, "system-ui", "Apple SD Gothic Neo", sans-serif | "Pretendard Variable", Pretendard, sans-serif | MED      | —                |
| font-size    | 14px                                                                                             | 16px                                          | MED      | —                |
| height       | 35px                                                                                             | 43px                                          | MED      | —                |
| line-height  | 21px                                                                                             | 24px                                          | MED      | —                |
| width        | 1058px                                                                                           | 1024px                                        | MED      | —                |

## voc-status-filters

| Property     | Prototype                                                                                        | React                                         | Severity | Suggested Action |
| ------------ | ------------------------------------------------------------------------------------------------ | --------------------------------------------- | -------- | ---------------- |
| border-style | none none solid                                                                                  | solid                                         | MED      | —                |
| font-family  | "Pretendard Variable", Pretendard, -apple-system, "system-ui", "Apple SD Gothic Neo", sans-serif | "Pretendard Variable", Pretendard, sans-serif | MED      | —                |
| font-size    | 14px                                                                                             | 16px                                          | MED      | —                |
| line-height  | 21px                                                                                             | 24px                                          | MED      | —                |
| width        | 1058px                                                                                           | 1024px                                        | MED      | —                |

## voc-table

| Property     | Prototype                                                                                        | React                                         | Severity | Suggested Action |
| ------------ | ------------------------------------------------------------------------------------------------ | --------------------------------------------- | -------- | ---------------- |
| border-style | none                                                                                             | solid                                         | MED      | —                |
| font-family  | "Pretendard Variable", Pretendard, -apple-system, "system-ui", "Apple SD Gothic Neo", sans-serif | "Pretendard Variable", Pretendard, sans-serif | MED      | —                |
| height       | 620px                                                                                            | 798px                                         | MED      | —                |
| width        | 1058px                                                                                           | 976px                                         | MED      | —                |

## voc-topbar

| Property     | Prototype                                                                                        | React                                         | Severity | Suggested Action |
| ------------ | ------------------------------------------------------------------------------------------------ | --------------------------------------------- | -------- | ---------------- |
| border-style | none none solid                                                                                  | solid                                         | MED      | —                |
| font-family  | "Pretendard Variable", Pretendard, -apple-system, "system-ui", "Apple SD Gothic Neo", sans-serif | "Pretendard Variable", Pretendard, sans-serif | MED      | —                |
| font-size    | 14px                                                                                             | 16px                                          | MED      | —                |
| line-height  | 21px                                                                                             | 24px                                          | MED      | —                |
| width        | 1058px                                                                                           | 1024px                                        | MED      | —                |
