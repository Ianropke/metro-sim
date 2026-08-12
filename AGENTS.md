# Agent Contract

## Project Mission

`metro-sim` is a React, TypeScript, Vite, and Pixi.js metro-tycoon simulation.
The product simulates trains, stations, passenger demand, operations, failures,
maintenance, staffing, economy, and progression. Correctness means that engine
state, simulation timing, economy, train lifecycle, and user-visible state stay
consistent.

## Authoritative Sources

- The engine in `src/engine/` is the source of truth for simulation and game
  rules. Read the relevant module before changing behavior.
- `src/App.tsx` owns the simulation instance and connects engine actions to the
  UI. `src/components/` owns presentation and user interaction.
- `SimulationLoop.getState()` is the current engine-to-UI state contract. Update
  its producer and all consumers together when its shape changes.
- `package.json`, `vite.config.ts`, `eslint.config.js`, and the TypeScript
  configs are authoritative for tooling and commands.
- `task.md` is a historical implementation checklist, not a complete product
  specification.
- `walkthrough.md` is explanatory/history documentation and contains values that
  may be stale. Do not use it to override current engine behavior.
- `README.md` is still the generated Vite template and is not authoritative
  product documentation.

There are currently no repository ADRs, database schemas, migrations, CI
workflows, security documents, or dedicated test suites. Do not imply that any
of these exist. If a new durable contract is introduced, document it in the
repository and update this file only with the operational rule and a reference.

When sources conflict, prefer executable engine behavior and regression tests
over UI copy or historical documentation. If the intended behavior differs from
the code, make the discrepancy explicit and update the appropriate source of
truth as part of the task.

## Architectural Invariants

- Keep simulation rules in `src/engine/`; do not implement game mechanics only
  in React components.
- Keep rendering and interaction in `src/components/`; route actions through
  the callbacks wired by `App.tsx` and `ControlRoom.tsx`.
- `SimulationLoop` advances physics using a fixed 20 ms step (`PHYSICS_DT`).
  Changes to time scaling, accumulation, or update ordering require engine
  regression coverage and a balance/playtest check.
- `GameManager` owns economy, progression, anomalies, maintenance, staff, and
  game status. `Train` owns train movement and train lifecycle behavior.
- `SCADA_Manager` owns simulated tags, alarms, and the bounded telemetry log.
  Telemetry is simulated game output, not historical operational data.
- Preserve the existing public callback/state contracts unless the task
  explicitly includes a contract migration. Do not change an engine state shape
  or train state name for convenience.
- Avoid opportunistic dependency upgrades, framework changes, broad formatting,
  or unrelated component refactors.

## Domain and Correctness Rules

- Train lifecycle states are defined in `src/engine/StateMachine.ts`. State
  transitions must remain valid for automatic driving, dwell, manual control,
  emergency, depot, and return-to-depot behavior.
- Route availability is governed by `ROUTE_EXTENSION_1`; the base route ends at
  2400 m and the extended route reaches 5000 m. Keep engine route limits and map
  rendering in sync.
- Game-over and victory rules are implemented in `GameManager.checkForAnomalies()`.
  Do not infer them from labels or tooltips.
- Upgrade identifiers, costs, requirements, and progression effects are split
  between engine logic and UI configuration today. Any change to an upgrade must
  update both sides and include a regression check; do not assume UI text is
  authoritative.
- Passenger exchange, dwell timing, wear, failures, staff dispatch, and budget
  changes are simulation behavior. Change them in the engine and verify them
  with an engine-level test or repeatable playtest harness.
- User-facing copy must not claim capabilities, prices, timings, or victory
  conditions that the engine does not implement.

## Data Integrity, Provenance, and Determinism

- This repository has no persistence, source identity, provenance, or lineage
  layer. Do not present in-memory telemetry, events, or simulated values as
  durable real-world records.
- The engine currently uses `Math.random()`, `Date.now()`, and `setTimeout()`
  for events, anomaly selection, IDs, cleanup, and visual/runtime effects. The
  simulation is therefore not deterministic or replayable by default.
- Do not describe balance runs or playtests as reproducible unless the random
  source and clock have been controlled. If deterministic testing is required,
  isolate or inject RNG/clock behavior as a focused task.
- Keep simulated, observed, inferred, cached, and generated values explicitly
  distinguishable if new data sources are added. Never fabricate values to make
  the simulation, telemetry, or UI appear healthy.
- Runtime timestamps are not domain history. Use simulation time for gameplay
  rules and reserve wall-clock time for UI/runtime concerns unless the behavior
  explicitly requires otherwise.

## Database and Migrations

No database or migration system exists in the current repository. If persistence
is introduced:

- add explicit, reviewable migrations and corresponding model/tests;
- preserve existing game saves or state compatibility where applicable;
- do not silently reinterpret historical data;
- require explicit justification for destructive or irreversible changes.

## External Services and APIs

The game has no runtime data API or upstream authority. `index.html` references
Google Fonts, but external fonts are presentation-only and must not become a
source of game or domain data.

If an external service is added, document its contract, authentication, timeout,
retry, rate-limit, caching, and failure behavior before implementation. Do not
silently substitute an unrelated source when an authoritative service fails.

## Security and Secrets

- Never commit secrets, tokens, credentials, or private user data.
- Use approved environment/configuration mechanisms for any future credentials.
- Do not expose raw internal exceptions or sensitive runtime details to users.
- Preserve authentication and authorization boundaries if the project gains a
  backend or external integrations.
- Report suspected historical secret exposure as a security issue; deleting the
  current copy is not sufficient remediation.

## Scope and Task Discipline

Before substantial work, define:

- Goal
- Scope
- Out of scope
- Constraints
- Acceptance criteria
- Validation commands

Split independent concerns into separate tasks when that improves reviewability,
testing, rollback, or risk isolation. Significant architecture, data-model,
infrastructure, security, or domain changes require an investigation/design
task before implementation.

Do not redesign the product, rewrite working modules, change public contracts,
or introduce a new framework unless the task requires it. Prefer the smallest
coherent change that solves the stated problem.

## Validation and Definition of Done

Run the checks relevant to the change and report the actual result:

```bash
npm ci
npm run lint
npm run build
git diff --check
```

There is currently no `test` script or test runner. Do not report tests as
passing when they were not run. Behavior changes should add regression coverage;
adding a test framework is a separate scoped task unless the requested change is
small enough to justify it.

For meaningful UI changes, run the app and verify the rendered interaction,
responsive layout, empty/error states, accessibility basics, and browser console
errors where tooling allows. The existing screenshot scripts are not canonical
validation: they contain hard-coded ports/paths and one references an
unimplemented `/admin-vice` route. Fix or replace them in a separate task before
relying on them in automation.

For simulation or balance changes, run an engine-level regression or the relevant
playtest harness in addition to lint/build. Do not claim reproducibility without
controlling randomness and time.

Before completion, inspect the final diff for unintended changes and state any
check that could not be run and the residual risk.

## Documentation Maintenance

Update documentation when a change alters architecture, public contracts,
domain behavior, configuration, deployment, or validation expectations. Keep
`AGENTS.md` focused on durable operating rules; do not add temporary task notes,
implementation history, or full specifications here.

There are no currently justified nested `AGENTS.md` files. Add one only if a
future subsystem develops materially different local constraints, such as a
backend, database/migrations, or a dedicated ingestion pipeline.
