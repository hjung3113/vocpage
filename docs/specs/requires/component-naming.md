# Component Naming Conventions

Canonical rule for naming React components in this codebase.
Reference this document whenever introducing a new component.

## Suffix Table

| Suffix     | Role                                                         | Example                            |
| ---------- | ------------------------------------------------------------ | ---------------------------------- |
| `*Drawer`  | Slide-in overlay anchored to an edge                         | `VocReviewDrawer`                  |
| `*Section` | Content area within a drawer or page                         | `VocMetaSection`, `VocBodySection` |
| `*Panel`   | Non-drawer floating container (popover, collapsible sidebar) | —                                  |
| `*Card`    | Single card within a list or grid                            | `VocCard`                          |
| `*Item`    | Single row within a list                                     | `VocListItem`                      |
| `*Badge`   | Inline semantic label                                        | `VocStatusBadge`                   |
| `*Button`  | Standalone action trigger                                    | `DrawerActionButtons`              |

## Prefix Rule

Always prefix with the feature or domain name.

```
Voc*      — VOC feature components
Master*   — master-data management
Notice*   — notice / FAQ feature
```

Generic reusable atoms (no domain coupling) live in `src/components/ui/` or `src/components/common/` and carry no feature prefix.

## Section Abstraction

`VocSection` is the shared wrapper for titled content areas inside the VOC drawer.
Use it when the section has a visible title label above its body.

```tsx
<VocSection title="첨부" testId="drawer-attachments">
  {/* section body */}
</VocSection>
```

Sections whose layout diverges significantly from the title+body pattern
(e.g., `VocMetaSection` grid, `VocActionSection` tabs) render their own root element
and do **not** use `VocSection`.

## Decision Checklist

When naming a new component, answer in order:

1. Does it slide in from an edge? → `*Drawer`
2. Is it a floating overlay that is not a drawer? → `*Panel`
3. Is it a titled content region inside a drawer or page? → `*Section` (use `VocSection` wrapper if it has a standard title+body layout)
4. Is it a repeating card in a grid or list? → `*Card`
5. Is it a single row in a list? → `*Item`
6. None of the above → use the most descriptive noun available
