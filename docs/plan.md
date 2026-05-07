# OM Design System — Build Plan

## Status (as of May 7 2026)

### ✅ Phase 1 — Foundations
- Pages, variable collections, text styles
- 383 icons as components

### ✅ Phase 2 — Atoms
Button (~440), IconButton, SplitButton, Checkbox (108), Radio (72), Toggle (72),
Badge (~120), Tooltip (64), Avatar single+group (~93), Label, Chip,
TextField (56), Textarea, Dropdown (~200), Divider, Spinner, Day Cell,
Tab Item, Menu Item, Progress, Skeleton.

### ✅ Phase 3 — Molecules
Dropdown Menu, Search Bar (20), Breadcrumb (20), Tabs, Pagination, Card,
Alert, Toast, Accordion, Calendar, Date Picker, Range Picker, Time Picker,
DateTime Picker, Modal, Stepper, Sidebar (8 states), Empty State.

### ✅ Phase 4 — Token wiring (commit `e469cf1`, May 7 2026)
- `buildComponentTokens` creates 30 `Component/X` collections aliasing semantic tokens.
- `resolveFormTokens(componentName)` substitutes `Component/X` refs at bind time
  (auto-creating missing collections/vars).
- All 30+ builders patched; **`buildAllWired`** runs the full sequence in dependency order.
- Last verified run: **37/37 ok, 0 failed** (commit `a345e7b`).

### ⏳ Phase 4.5 — Page categorization fix (TODO, individual rebuilds)
Move (page assignment in builder):
- `Calendar` → Molecules
- `Progress`, `Skeleton`, `Tab Item`, `Menu Item` → Atoms

### ⏳ Phase 5 — Organisms (in progress)
Build order:
1. **Page Header** ⏳ NEXT
2. Top Nav Bar
3. Form Layout
4. Data Table

### ⏳ Phase 6 — Polish (after organisms)
- Calendar/Modal "spread parameter" warning — set `clipsContent=true` before shadow.
- Documentation page (auto-generated component index + token table).
- Motion / interaction specs.

---

## Locked design rules — Form atoms

- Sizes match Button: XS=24, Small=28, Medium=32, Default=36 (no Large)
- Padding: 8px all sizes
- Vertical gap (Label ↔ Field ↔ Helper): 2px
- Borders: Default = `border/strong`, Hover = `text/secondary`, Active/Focus = `brand/primary` (no drop shadow)
- Helper text hidden by default
- Dropdown chips use neutral grey (`state/disabled-bg`), NOT brand colors
- Disabled state never uses opacity — uses `state/disabled-bg/text/border`

## Form atom specs

```
FORM_SIZES = ['XS', 'Small', 'Medium', 'Default']
FORM_VGAP = 2
FORM_LABEL_STYLE = 'Label/Default'

FORM_SIZE_SPECS:
  XS:      { h:24, padX:8, icon:12, gap:6, radius:4 }
  Small:   { h:28, padX:8, icon:14, gap:6, radius:6 }
  Medium:  { h:32, padX:8, icon:14, gap:8, radius:6 }
  Default: { h:36, padX:8, icon:16, gap:8, radius:8 }

CHIP_SIZE_SPECS:
  Small:   { h:20, padX:6,  icon:12, text:'Body/Small',   radius:4 }
  Default: { h:28, padX:10, icon:14, text:'Body/Default', radius:6 }
```

## Critical fix notes

- Atomic composition: higher components must `createInstance()` of lower components — never re-implement an atom inline.
- Tokens: layers bind to `Component/{Name}/...` only (via `resolveFormTokens(name)`).
- Text styles: `await loadFontAsync` → `setTextStyleIdAsync` → set `.characters`. Never set `.fontName` after.
- Sizing: `layoutSizingHorizontal/Vertical` AFTER `appendChild()`. For fixed counter-axis, restore AUTO sizing or `.resize()` AT END.
- Idempotency: every `buildX()` removes its own previous COMPONENT_SET + showcase first.
- Tag (deferred): when needed, extend Chip with Color × Style axes — not a new component.
