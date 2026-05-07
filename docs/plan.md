# OM Design System — Build Plan

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
- **Tag** (NEXT) — status colors: Neutral / Info / Success / Warning / Danger × 2 sizes × Solid / Outline / Subtle. Different from greyish Chip (which is ONLY for Multi-Select dropdowns).
- Tooltip Heading variant (TOOLTIP_HEADINGS declared but rendering missing in `makeTooltipVariant`)
- Divider
- Spinner

### ⏳ Phase 4 — Molecules
Menu Item → Dropdown Menu → Select → Search Bar → Tabs → ...

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
