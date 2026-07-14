# Urja Kavach Handoff

## Read This First
Urja Kavach is governed by four local specification files read in full on 2026-07-14:
- `UrjaKavach_Execution_Plan (1).md`
- `UrjaKavach_Architecture_Plan.md`
- `UrjaKavach_HLD_LLD.md`
- `UrjaKavach_Agent_Execution_Rules.md`

The binding operating contract is `UrjaKavach_Agent_Execution_Rules.md`. Work must proceed one phase at a time using only the 12 phases in Execution Plan section 9. Architecture, tier order, schema, data sources, and handoff maintenance are locked by the four files above. The `Energy_Supply_Chain_Resilience_FINAL_ALIGNED_DOSSIER.md` file is now present in the repo as ground-truth data for node seeding and scenario calibration.

## Current Phase
Phase 2: GDELT + EIA ingestion.

Phase 1 status: complete. Verification performed after user supplied the FINAL_ALIGNED_DOSSIER:
- Dossier copied into repo as `Energy_Supply_Chain_Resilience_FINAL_ALIGNED_DOSSIER.md`.
- `data/india_energy_nodes.json` rebuilt from Dossier Part 3.
- `docker compose down -v` then `docker compose up --build -d` succeeded.
- `SELECT count(*) FROM nodes` returned 37: 5 SPR, 17 refinery, 9 port, 6 pipeline/corridor nodes.
- `SELECT count(*) FROM edges` returned 19.
- `GET /health` returned `status=ok`.
- `GET /api/twin/nodes` returned 37 nodes.
- Dossier Part 3 is a categorical node list rather than a single explicit numeric count; the implemented count is the direct enumeration of nodes named there.

Phase 2 done-condition: scheduled jobs pulling GDELT DOC 2.0 and EIA data on fixed intervals, writing raw signal rows.

Phase 2 verification required: print and manually inspect 5 real GDELT article titles and 5 real EIA data points, confirm they are current and not stale/cached test data.

## Phase-by-Phase Status
| Phase | Name | Status | Notes |
|---|---|---|---|
| 1 | Foundation | complete | Docker/API/web/db verified; 37 Dossier Part 3 nodes seeded. |
| 2 | GDELT + EIA ingestion | in progress | Clients/scheduler shell started; GDELT rate limit fired; EIA key missing; staging-table schema escalation open. |
| 3 | AISstream.io live overlay | not started | Must implement and test `FLAG_RISK_KNOWN_ISSUE`; known AISstream issue must be logged if it fires. |
| 4 | Risk scoring engine | not started | Blocked until explicit human confirmation of corrected 4-term risk formula before Phase 4 starts. |
| 5 | Digital Twin Map | not started | Leaflet/react-leaflet only. |
| 6 | Command Dashboard | not started | Must watch one live refresh cycle before done. |
| 7 | Scenario Simulator | not started | Hormuz partial closure only for Tier 1. |
| 8 | LLM Risk Narrative | not started | Must implement Gemini to Groq to static fallback chain and test fallback state. |
| 9 | Tier 2 | not started | Only if Tier 1 is fully real and verified. |
| 10 | Assumptions panel + hygiene pass | not started | Must render weights and out-of-scope list accurately. |
| 11 | Golden fallback + demo rehearsal | not started | Must confirm golden view works with network blocked. |
| 12 | Deliverables packaging | not started | Deck, demo video, docs finalized. |

## Tier Status
Tier 1: Phase 1 complete; Phase 2 active.

Tier 2: not started and not eligible to start until Tier 1 is fully real and verified.

Tier 3: never build, stub, or claim.

## Decisions Already Made
### 5A - Agent Defaults Exercised
- Created local `.env` with `POSTGRES_PASSWORD=urjakavach_dev`, `POSTGRES_PORT=5433`, and empty external API keys. This is ignored by `.gitignore`.
- Added React TypeScript declaration packages (`@types/react`, `@types/react-dom`) after the Vite/TypeScript build failed on missing JSX declarations.
- Added `POSTGRES_PORT` to `.env.example` and used `${POSTGRES_PORT:-5432}:5432` in Compose so clean clones still default to the locked 5432 mapping while local conflicts can be handled without editing committed files.
- Seed loader now reads JSON using `utf-8-sig` to tolerate Windows-authored UTF-8 BOM files.

### 5B - Escalations / Human Confirmations
Open Phase 2 schema escalation: HLD/LLD describes `gdelt_articles` and `price_points` staging tables for Phase 2, but Execution Plan section 6 locked schema does not list them. Adding these tables is schema change work and needs explicit confirmation before migration implementation.

Pending before Phase 4: explicit human confirmation is required for the corrected 4-term risk-scoring formula from HLD/LLD section 2.5 and Execution Plan section 5 correction. No confirmation has occurred yet.

## OPEN QUESTIONS
- Phase 2 schema question: approve adding ingestion staging tables `gdelt_articles` and `price_points` so Phase 2 jobs can write raw signal rows as HLD/LLD requires?
- Before Phase 4 starts: confirm whether to implement the authoritative corrected 4-term formula using `component_gdelt_volume`, `component_price_volatility`, `component_ais_deviation`, and `component_sanctions_flag` with default weights 0.35 / 0.25 / 0.30 / 0.10.

## Environment Variables In Use
Required by spec:
- `POSTGRES_PASSWORD`
- `EIA_API_KEY`
- `AISSTREAM_API_KEY`
- `GEMINI_API_KEY`
- `GROQ_API_KEY`

Additional local convenience variable:
- `POSTGRES_PORT`, default `5432`, local `.env` currently `5433` because another container owns host port `5432`.

Current blocker: local `.env` has no `EIA_API_KEY`, so EIA live verification cannot run yet.

## Schema State
Phase 1 locked schema is implemented and migrated:
- `nodes`
- `edges`
- `risk_scores`
- `ais_snapshots`
- `scenarios`
- `scenario_runs`

Indexes implemented:
- `risk_scores(corridor, computed_at)`
- `ais_snapshots(bounding_box, captured_at)`
- `scenario_runs(scenario_id, run_at)`

Phase 2 schema question is open because raw ingestion rows need persistence but staging tables are not in the locked Execution Plan schema.

## Repository State
Repository tracks `origin/main` at `https://github.com/kansalshivam/UrjaKavach.git`. Phase 1 commits were pushed. Current working tree includes Phase 1 dossier/seed completion changes and Phase 2 ingestion-client changes pending commit.

## Files Created/Modified This Session
- Added `Energy_Supply_Chain_Resilience_FINAL_ALIGNED_DOSSIER.md`.
- Updated `data/india_energy_nodes.json` to 37 Dossier Part 3 nodes and 19 edges.
- Updated `api/app/seed.py` for `utf-8-sig` seed reads.
- Updated `api/pyproject.toml` for Phase 2 dependencies: `apscheduler`, `httpx`.
- Added `api/app/ingestion/gdelt.py`.
- Added `api/app/ingestion/eia.py`.
- Added `api/app/scheduler.py`.
- Updated `BUILD_LOG.md`.
- Updated `HANDOFF.md`.

## Commands Run and Results
- `Get-Content -Raw C:\Users\shiva\Downloads\Energy_Supply_Chain_Resilience_FINAL_ALIGNED_DOSSIER.md`: read full dossier successfully.
- `Copy-Item ... Energy_Supply_Chain_Resilience_FINAL_ALIGNED_DOSSIER.md`: copied dossier into repo.
- Rewrote `data/india_energy_nodes.json` from Dossier Part 3.
- `docker compose down -v; docker compose up --build -d`: succeeded after seed loader BOM fix.
- `SELECT count(*) FROM nodes`: 37.
- `SELECT node_type, count(*) FROM nodes GROUP BY node_type`: 5 SPR, 17 refinery, 9 port, 6 pipeline/corridor.
- `SELECT count(*) FROM edges`: 19.
- `GET /health`: `status=ok`.
- `GET /api/twin/nodes`: 37 nodes.
- Phase 2 GDELT live probes: both returned documented GDELT rate-limit message.
- EIA key check: `EIA_API_KEY` is empty or missing.

## Live-Data Verification Log
GDELT DOC 2.0: attempted on 2026-07-14 for `"Strait of Hormuz"`; source returned documented rate-limit response twice. Treat as documented source risk firing, not app bug. No real article titles captured yet.

EIA v2: unverified in this environment because `EIA_API_KEY` is not configured.

AISstream.io: unverified in this environment. Known documented risk: `aisstream/aisstream#15`, opened 2026-03-13, may accept subscription but deliver zero messages.

OFAC SDN list: unverified in this environment.

LLM narrative provider chain: Gemini and Groq unverified in this environment.

## Known Bugs / Incomplete Work / TODOs
- Need human confirmation for Phase 2 staging tables before writing migrations.
- Need configure `EIA_API_KEY` before EIA live verification.
- Need retry GDELT later with conservative cadence to capture 5 real current article titles.
- `npm audit` reports 1 moderate and 1 high vulnerability. No upgrade/fix was applied because Phase 1 did not authorize dependency substitution or breaking upgrades without a phase-relevant need.

## Known Issues / Deviations From Spec
- The Execution Plan file is named `UrjaKavach_Execution_Plan (1).md` in this workspace rather than `UrjaKavach_Execution_Plan.md`. No spec deviation in content has been made.
- Local host port `5432` is occupied by another container; local `.env` uses `POSTGRES_PORT=5433`. Committed default remains `5432`.
- Phase 2 cannot be fully completed without resolving the staging-table schema question.

## Immediate Next Action
Commit the Phase 1 dossier/seed completion. Then continue Phase 2 by committing the ingestion client skeleton and asking for explicit approval to add `gdelt_articles` and `price_points` staging tables, plus requesting/providing an `EIA_API_KEY` for live EIA verification.
