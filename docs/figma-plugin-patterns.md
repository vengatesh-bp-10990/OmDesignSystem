# Figma Plugin Build Patterns (OM Design System)

## Text styles & fonts
- Always `await figma.loadFontAsync(style.fontName)` before `setTextStyleIdAsync()` AND before setting `.characters`
- NEVER set `text.fontName = {...}` AFTER `setTextStyleIdAsync()` — it breaks the typography link in the design panel
- If you want a specific weight, fix it on the text style itself (don't override on the node)

## Sizing & autolayout gotchas
- Set `layoutSizingHorizontal/Vertical` AFTER `appendChild()` — before that the parent context is unknown
- For frames that should keep a fixed counter-axis after children added, set `counterAxisSizingMode = 'FIXED'` then `layoutSizingVertical = 'FIXED'` and `.resize()` AT THE END (children may force a re-hug otherwise)

## Variable resolution (dynamic-page mode)
- Brand tokens (`brand/*`) live in `_Theme`, not `_Appearance`
- Use a fallback resolver: `anyBy = (n) => appBy(n) || thBy(n)`
- Always `await figma.variables.getLocalVariableCollectionsAsync()` (sync APIs disabled with `documentAccess: dynamic-page`)

## Component-as-instance pattern (atomic composition)
- For atoms reused inside larger components (Label inside TextField, Chip inside Dropdown):
  1. Build the atom first with its own component-set + state variants
  2. Lookup helper: `findXComponent(state)` → searches Atoms page for the COMPONENT_SET, returns the matching variant
  3. Throw `Run "Build X" first` if missing — clear error
  4. Instance via `comp.createInstance()`, name it, then `layoutSizingHorizontal = 'HUG'`
  5. Wire boolean props on the wrapper to toggle the entire instance via `componentPropertyReferences = { visible: propId }`

## Idempotency
- Every build function must remove its own previous COMPONENT_SET + showcase FRAME first
- Also sweep loose orphan COMPONENTs by regex (cancelled builds leave them behind)

## Border colors (visual distinctness)
- Default = `border/strong` (visible neutral)
- Hover = `text/secondary` (clearly darker than Default)
- Don't use `border/default` for input rests — too light, looks unintentional

## Deferred work
- **Chip status colors / sizes** (May 7 2026): Current greyish Chip is enough for now. Tag merge deferred — when needed, extend Chip with Color (Neutral/Info/Success/Warning/Danger) × Style (Solid/Outline/Subtle) axes. Multi-Select Dropdown's `chipFor()` would pin Color=Neutral, Style=Subtle for backwards compat. Do NOT build a separate Tag component.

## Phase 3 atoms — COMPLETE (May 7 2026)
- Tooltip got Heading axis (4×2×2×2×2 = 64 variants). When Heading or Action present, bubble switches to VERTICAL layout with content row (icon+message) inside.
- Divider: 4 variants (Orientation Horizontal/Vertical × Style Solid/Dashed) + Has Label boolean (horizontal only). Uses `figma.createLine()` with optional `dashPattern = [4, 4]`.
- Spinner: 15 variants (Size × Color Brand/Neutral/On-Brand) + Has Label boolean. Ring = full ellipse track + ellipse with `arcData = { startingAngle: 0, endingAngle: 1.5π }` rotated -90° for the active 270° arc.
- Manifest commands: `buildDivider`, `buildSpinner`
