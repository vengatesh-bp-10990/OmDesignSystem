# OM DS Bootstrap — Figma Plugin

One-shot Figma plugin that scaffolds **Phase 0 + Phase 1.1** of the OM Design System: pages, variable collections, seed tokens, text styles, and a Light/Dark test frame.

## What It Creates

### 12 Pages
🏠 Cover · 📐 Foundations / Tokens · 🔤 Typography · 🎨 Colors · 📏 Spacing & Layout · ✨ Effects · 🎯 Icons · 🧱 Atoms · 🧬 Molecules · 🏛️ Organisms · 📄 Patterns · 📝 Documentation

### 7 Variable Collections
| Collection | Modes | Tokens seeded |
|-----------|-------|---------------|
| `_Primitives` | Default | `neutral/0..1000` (13 shades) + `transparent` |
| `_Appearance` | Light, Dark | `surface/base`, `surface/card`, `text/primary`, `text/secondary`, `border/default` (aliases to neutrals) |
| `_Theme` | Orange, Blue | *(empty shell — JIT, added with Spinner)* |
| `Typography` | Default | `font/sans`=Inter, `font/serif`=Zoho Puvi, `font/mono`=Roboto Mono |
| `Spacing` | Default | `space/0..160` (22 values) |
| `Radius` | Default | `radius/none..full` (9 values) |
| `Shadows` | Light, Dark | *(empty shell — JIT, added with Card)* |

### 6 Text Styles
`Heading/H1`, `Heading/H2`, `Body/Default`, `Body/Small`, `Label/Default`, `Code/Default`

### Cover Frame
Title card on 🏠 Cover page (1440×900).

### Theme Test Frame
Side-by-side Light + Dark frames on 📐 Foundations page — uses bound variables to verify mode switching works.

---

## How to Use

1. **Open Figma** and create a new design file named `OM Design System`
2. Top menu → **Plugins → Development → Import plugin from manifest…**
3. Select `manifest.json` from this folder
4. Run: **Plugins → Development → OM DS Bootstrap → Bootstrap Phase 1.1 (Foundations)**
5. Wait ~5 seconds — done ✅

The plugin is **idempotent**: re-running skips entities that already exist.

### Reset Command
If you want to start fresh, run **Plugins → Development → OM DS Bootstrap → Reset (Delete OM Collections)**. This removes the 7 collections only; pages, text styles, and frames are kept.

---

## Notes

- **Fonts**: If Zoho Puvi or specific font weights aren't installed locally, the plugin falls back to Inter Regular for text styles. Install Zoho Puvi later → swap the `font/serif` variable value once → cascades everywhere.
- **Brand tokens**: Intentionally omitted from this bootstrap (JIT principle). Added in the next plugin run when we build the Spinner atom.
- **Shadow tokens**: Same — added when we build the Card.

## Future Commands (planned)
- `Add Brand Tokens` — Orange + Blue scales + `brand/*` semantics
- `Add Status Tokens` — Red/Green/Amber/Sky scales + `status/*`
- `Add Shadow Tokens` — elevation primitives + `_Appearance.elevation/*`
- `Add Motion Tokens` — durations + easings
- `Import ZCat-Icons` — bulk icon component import

---

## Troubleshooting

**"Cannot find module" / plugin won't load**: ensure `manifest.json` and `code.js` are in the same folder.

**Fonts missing error**: install Inter and Roboto Mono on your machine, then re-run.

**Variables already exist**: safe — the plugin skips existing variables. To start over, run the **Reset** command.
