# Scoped Agent Contract — simulation application

The root `AGENTS.md` remains authoritative. These rules specialize review of `src/`.

## Code Review Rules

### Keep game mechanics in the engine
Flag business/game-state logic implemented only in React/UI components or UI copy that disagrees with engine state. The safe path is to change engine behavior and its consumers together through the existing state/callback boundaries.

### Do not claim deterministic behavior when time/randomness is uncontrolled
Flag regression or balance claims that rely on uncontrolled `Math.random()`, wall-clock time, or timers. The safe path is an injected/controlled RNG/clock or an explicitly non-reproducible playtest claim.

### Significant UI/gameplay changes need rendered acceptance
After deterministic tests/build, verify the actual game flow with browser tooling and, when available, Codex Computer Use. Exercise the changed interaction, route/map state, responsive layout, failure/empty states, and obvious runtime/console problems.
