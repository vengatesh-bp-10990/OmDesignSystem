# OM Design System — Build Plan

## Deferred refactor (after Phase 4 complete)
**Per-component token backfill (Option A)** — currently Label, Chip, TextField, Textarea, Dropdown and ALL Phase 4 molecules bind directly to semantic `_Appearance`/`_Theme` tokens via `resolveFormTokens()`. This violates the locked "layers bind to `Component/{Name}/...` only" rule. Plan: finish all molecules first, then add `Component/{Label, Chip, TextField, Textarea, Dropdown, MenuItem, DropdownMenu, SearchBar, Breadcrumb, Tabs, Pagination, Card, Alert, Toast, Progress, Skeleton, Accordion, Tag, ...Pickers}` collections aliasing the existing semantic vars, rewire each builder, then full rebuild. Aliases preserve visuals → zero design risk. See `/memories/session/token-refactor-deferred.md`.

## Status (as of last session)

### ✅ Completed
- Phase 1.1: pages, collections, text styles
- Phase 2: 383 icons as components
- Phase 3 atoms:
  - Button (~440 variants)
  - Checkbox (108)
  - Radio (72)
  - Toggle (72)
  - Badge (~120)
  - Tooltip (32)
  - Avatar Single + Group (~75)
  - Label (2)
  - Chip (4)
  - TextField (42)
  - Textarea (14)
  - Dropdown (~150)

### ⏳ Pending atoms
- **Tag** (DEFERRED) — when needed, will be done by extending Chip with Color × Style axes rather than a new component. User decision May 7 2026.

### ✅ Phase 3 atoms — COMPLETE (May 7 2026)
- Tooltip Heading axis added (4×2×2×2×2 = 64 variants)
- Divider: 4 variants (Orientation × Style) + Has Label boolean
- Spinner: 15 variants (Size × Color) + Has Label boolean

### ⏳ Phase 4 — Molecules
- ✅ Menu Item
- ✅ Dropdown Menu
- ✅ Search Bar
- ✅ Breadcrumb
- ✅ Tab Item (atom)
- ✅ Pagination
- ✅ Card
- ✅ Alert
- ✅ Toast
- ✅ Progress
- ✅ Skeleton
- ✅ Accordion (Bordered + Inline × Default/Hover/Active = 6 variants)
- ✅ **Tabs (molecule)** — 3 variants × 2 sizes × Full Width false/true = 12 (commit `899008e`, May 7 2026)
  - `Line` = underline indicator + 1px baseline
  - `Square` = soft neutral container (radius 8) + peach Active pill
  - `Rounded` = grey container (radius 999) + white Active pill
  - Composes real `Tab Item` instances; leading icon hidden inside instances for clean label-only bar
- ⏳ **Next:** Date Picker family (Date / Range / Time / DateTime) — needs Calendar atom first
- ⏳ Other potential molecules: Modal/Dialog, Stepper, Sidebar/Nav, Empty State

### ⏳ Phase 5 — Motion / Interactions
Deferred to end of Phase 5.

## Locked design rules — Form atoms (May 6 2026)

- Sizes match Button: XS=24, Small=28, Medium=32, Default=36 (no Large)
- Padding: 8px all sizes
- Vertical gap (Label ↔ Field ↔ Helper): 2px
- Borders:
  - Default = `border/strong`
  - Hover = `text/secondary` (darker)
  - Active/Focus = `brand/primary` (no drop shadow)
- Helper text hidden by default
- Dropdown chips use neutral grey (`state/disabled-bg`), NOT brand colors
- Dropdown disabled state uses Disabled chip variant via `chipFor(size, state)`

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

- Chip Default must use `comp.layoutSizingVertical='FIXED'; comp.resize(comp.width, spec.h)` AT END after appendChild calls (otherwise counter-axis hugs to text height = 20px regardless of Default's 28h)
- Dropdown field paddingTop/Bottom = 2 (was 6) so XS dropdown isn't crowded
