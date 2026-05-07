# Copilot / Agent Instructions

**Always read [AGENTS.md](../AGENTS.md) at the start of every new session.** It points to the build plan, design rules, plugin patterns, and prior chat transcripts that contain the full context of this project.

Key files:
- [AGENTS.md](../AGENTS.md) — onboarding entry point
- [docs/plan.md](../docs/plan.md) — build status + next tasks
- [docs/figma-plugin-patterns.md](../docs/figma-plugin-patterns.md) — plugin API gotchas
- [docs/design-system-tokens.md](../docs/design-system-tokens.md) — token architecture
- [chat-transcripts/](../chat-transcripts/) — full prior conversation history

Do not invent new conventions; follow the locked rules in `docs/plan.md` and `docs/figma-plugin-patterns.md`. The Figma plugin runs in `documentAccess: "dynamic-page"` mode — all variable/text-style APIs must be awaited.
