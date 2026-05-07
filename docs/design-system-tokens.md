# Design System — Token Architecture (Figma Variables)

## Key Rules
- NEVER use opacity for disabled state — varies wildly across bg colors. Use solid neutral tokens: `state/disabled-bg`, `state/disabled-text`, `state/disabled-border`.
- Per-component disabled aliases to these neutral state tokens (not brand-muted).

## Reference Chain (only `_Primitives` holds hex)
```
_Primitives (raw hex) → _Appearance / _Theme (semantic alias) → Component/{Name} (per-component alias) → Component layers
```
Component layers MUST alias `Component/{Name}` only — never `_Primitives` or semantic directly.

## Split-Mode Pattern (Figma Pro = 4 modes/collection)
- `_Primitives` (no modes): raw color scales
- `_Appearance` (Light, Dark): `surface/*`, `text/*`, `border/*`, `status/*`, hover/active overlays
- `_Theme` (Orange, Blue, ...): `brand/*`, `state/focus-ring`
- Frame independently sets _Appearance + _Theme → N×M effective combinations
- Avoids 4-mode-combined-collection (which maxes Pro plan, doubles duplication)

## Brand × Appearance Auto-Switch Pattern
Put brand SCALES in _Theme; let _Appearance pick which scale:
```
_Theme (Orange):  brand/scale-strong → orange/600    brand/scale-soft → orange/400
_Theme (Blue):    brand/scale-strong → blue/600      brand/scale-soft → blue/400
_Appearance (Light):  brand/primary → brand/scale-strong
_Appearance (Dark):   brand/primary → brand/scale-soft
Component/Button: Primary/bg/default → brand/primary  (resolves correctly per Appearance×Theme)
```

## Per-Component Variable Collections (ZCatalyst-style)
Each component owns a `Component/{Name}` collection. Naming: `{element}/{property}/{state}`.
Example Component/Button: `Primary/bg/default`, `Primary/bg/hover`, `Primary/text/default`, `Outline/border/default`.

## Atomic Composition Rule (non-negotiable)
- Higher components use INSTANCES of lower components (Modal's button = Button instance, etc.)
- Every icon = instance of single Icon master (name/size/color properties)
- Edit source atom once → all parents update automatically
- Internal-only atoms prefixed `_` to hide from publish

## Typography Variables (mode-based font swap)
- Single `Typography` collection with 2 MODES: Inter (default) | Puvi
- Variables: `font/sans` (Inter or Zoho Puvi by mode), `font/mono` (always Roboto Mono)
- All text styles bind Font Family field to `font/sans` (not typed names)
- Line-height baked INTO the text style; override per-component only when layout demands
- Switch the Typography mode (frame-level) → entire system swaps Inter ↔ Puvi instantly
- No separate font/serif — Puvi is the alt UI font accessed via mode flip
- Rule: every text layer must use a defined text style; manual font overrides break the swap

## Shadows / Effects
Both shadow COLOR and shadow VALUES (offset/blur/spread) are variables.
```
_Primitives:
  shadow/color/black-soft = rgba(0,0,0,0.08)
  shadow/color/black-med  = rgba(0,0,0,0.16)
  shadow/color/black-hard = rgba(0,0,0,0.40)
  shadow/blur/sm=4 md=12 lg=24
  shadow/y/sm=1 md=4 lg=12
  shadow/spread/0=0 -2=-2

_Appearance (Light): elevation/card/color → shadow/color/black-soft
_Appearance (Dark):  elevation/card/color → shadow/color/black-hard
```

## Motion / Interaction Variables
```
_Primitives (Number):
  duration/instant=0  fast=100  base=200  slow=300  slower=400  slowest=600  (ms)
_Primitives (String):
  ease/linear, ease/standard, ease/decelerate (entering), ease/accelerate (exiting), ease/spring
```

## Standard Motion Catalog
Button: hover color fade (fast), press scale 0.97 (instant), focus ring fade (fast)
Input/Select: focus border + glow (base)
Checkbox/Radio: check-in scale+fade (base); Toggle: thumb slide (base, spring)
Dropdown/Menu: open slide+fade (slow, decelerate); close fade (fast, accelerate)
Tooltip: appear with delay (fade+slide, fast)
Modal: backdrop fade + content scale 0.95→1 (slower, decelerate)
Drawer: slide from edge (slower, decelerate)
Toast: slide+fade in (base, decelerate); auto-dismiss
Tabs: indicator slide (base, standard)
Accordion: height expand + fade (slow, standard)
Table row: bg fade on hover (fast); selected highlight (instant)
Skeleton: shimmer loop 1500ms linear infinite
Spinner: rotation loop 1000ms linear infinite

## Just-In-Time Token Creation
Don't pre-create all tokens. Add to _Primitives / _Appearance / _Theme only when a component needs them.

## Layer & Frame Naming Convention

### Master Components (slash hierarchy)
`Category/ComponentName/Variant/SubVariant/State` — e.g., `Button/Primary/Medium/Default`, `Input/Text/Error`, `Menu/Item/With-Icon/Hover`
Internal-only: prefix `_` → `_Button/_Inner-Container` (excluded from publish)

### Pages (emoji + sentence case)
🏠 Cover · 📐 Foundations / Tokens · 🔤 Typography · 🎨 Colors · 📏 Spacing & Layout · ✨ Effects · 🎯 Icons · 🧱 Atoms · 🧬 Molecules · 🏛️ Organisms · 📄 Patterns · 📝 Documentation

### Layer Names (ROLE not visual; same name across variants → text overrides survive swap)
Container, Background, Content, Icon-Leading, Icon-Trailing, Icon-Action, Label, Description/Helper, Placeholder, Value, Prefix/Suffix, Indicator, Divider, Header/Body/Footer, Title/Subtitle, Actions, Trigger, Panel/Surface, Backdrop/Overlay, Track/Thumb, Fill

### Component Properties (Title Case)
- Boolean: `Has Icon Leading`, `Disabled`, `Loading`, `Error`
- Variant: `Variant`, `Size`, `State`
- Instance Swap: `Icon Leading`, `Icon Trailing`, `Avatar`
- Text: `Label`, `Description`, `Placeholder`, `Value`, `Helper Text`

### Variable Names
Lowercase slash: `surface/base`, `text/primary`, `Button/Primary/bg/default`, `Card/shadow/blur`

### Text Style Names (slash hierarchy)
Display/2XL · Heading/H1..H5 · Body/Large|Default|Small · Label/Default|Small · Code/Default|Small · Brand/Display|Heading (Puvi)

### Critical Rules
1. Same layer name across all variants → text overrides survive
2. No "Frame 123" / "Group 45" / "Rectangle" in published components
3. Atoms inside molecules retain original names (don't rename Button instances)
4. Internal scaffolding prefixed `_` → hide from publish + signal "do not edit"
5. Layer order matches reading order

## Figma Plan Mode Limits
| Plan | Modes per collection |
|------|---------------------|
| Starter (Free) | 1 |
| Professional | 4 |
| Organization / Enterprise | unlimited |
