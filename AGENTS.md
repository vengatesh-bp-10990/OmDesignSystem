# Agent Onboarding — OM Design System

> **Read this FIRST in any new chat session.** This repo is the source of truth — all prior conversation context lives here.

## What this project is
A Figma plugin (`om-bootstrap-plugin/`) that programmatically scaffolds the **OM Design System** (ZCatalyst-inspired) inside Figma — pages, variable collections, text styles, icons, and atom/molecule components with full variant matrices.

## REQUIRED reading before doing anything
1. [docs/plan.md](docs/plan.md) — current build status, what's done, what's next, locked design rules
2. [docs/figma-plugin-patterns.md](docs/figma-plugin-patterns.md) — non-obvious Figma Plugin API gotchas (text styles, sizing, atomic composition, variable resolution)
3. [docs/design-system-tokens.md](docs/design-system-tokens.md) — token architecture (3-tier `_Primitives` → `_Appearance`/`_Theme` → `Component/X`), naming conventions, motion catalog
4. [om-bootstrap-plugin/README.md](om-bootstrap-plugin/README.md) — what the plugin produces and how to load it
5. [chat-transcripts/](chat-transcripts/) — full prior conversation history (`.jsonl` files). Grep these if you need exact reasoning behind a past decision.

## Codebase layout
- `om-bootstrap-plugin/code.js` — single-file plugin (~6500 lines). Each `buildX()` function is self-contained and idempotent (clears its own previous COMPONENT_SET first).
- `om-bootstrap-plugin/manifest.json` — registers all `buildX` commands (bootstrap, buildIcons, buildButton, buildCheckbox, buildRadio, buildToggle, buildBadge, buildTooltip, buildAvatar, buildLabel, buildChip, buildTextField, buildTextarea, buildDropdown, resetTextStyles, reset).
- `manifest.json` uses `documentAccess: "dynamic-page"` → ALL variable / text-style APIs must be `await`ed (`getLocalVariableCollectionsAsync`, `setTextStyleIdAsync`, etc.).

## Critical conventions (do NOT violate)
- **Atomic composition**: higher components use `createInstance()` of lower components (Label inside TextField, Chip inside Dropdown). Never re-implement an atom inline.
- **Tokens**: layers bind to `Component/{Name}/...` only. Never bind directly to `_Primitives` or semantic tokens. Brand tokens live in `_Theme`, not `_Appearance`.
- **Text styles**: `await loadFontAsync(style.fontName)` → `setTextStyleIdAsync()` → set `.characters`. NEVER set `.fontName` after `setTextStyleIdAsync()` (breaks the typography link).
- **Sizing**: set `layoutSizingHorizontal/Vertical` AFTER `appendChild()`. For fixed counter-axis frames, do `counterAxisSizingMode='FIXED'` + `layoutSizingVertical='FIXED'` + `.resize()` AT THE END.
- **Idempotency**: every `buildX()` removes its own previous COMPONENT_SET + showcase FRAME first, then sweeps orphan COMPONENTs by regex.
- **Disabled state**: never use opacity. Use solid neutral tokens (`state/disabled-bg`, `state/disabled-text`, `state/disabled-border`).

## Workflow expectations
- Before adding a new build function, read at least the most relevant existing one (e.g., before Tag → read `buildChip` and `buildBadge` in `code.js`).
- After changes, append a short note to `docs/plan.md` under "Status".
- Commit + push at meaningful checkpoints. Default branch is `main`. Remote: `https://github.com/vengatesh-bp-10990/OmDesignSystem`.
- Backup chat transcripts to `chat-transcripts/` periodically (location: `~/Library/Application Support/Code/User/workspaceStorage/<hash>/GitHub.copilot-chat/transcripts/*.jsonl`).

## Next planned work
See [docs/plan.md](docs/plan.md) "Pending atoms" section. Immediate next: **Tag** (status colors Neutral/Info/Success/Warning/Danger × 2 sizes × Solid/Outline/Subtle).
