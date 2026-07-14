# Urja Kavach Handoff

## Read This First
Urja Kavach is governed by four local specification files read in full on 2026-07-14:
- `UrjaKavach_Execution_Plan (1).md`
- `UrjaKavach_Architecture_Plan.md`
- `UrjaKavach_HLD_LLD.md`
- `UrjaKavach_Agent_Execution_Rules.md`

The binding operating contract is `UrjaKavach_Agent_Execution_Rules.md`. Work must proceed one phase at a time using only the 12 phases in Execution Plan section 9. Architecture, tier order, schema, data sources, and handoff maintenance are locked by the four files above.

## Current Phase
Phase 1: Foundation, operational verification complete with one documented verification caveat.

Phase 1 done-condition: `docker compose up` from a clean clone starts all containers; nodes table is populated; empty dashboard renders.

Verification performed:
- `docker compose up -d` succeeded after resolving a local host-port conflict with `POSTGRES_PORT=5433` in ignored `.env`; committed default remains `5432`.
- Postgres container healthy, API on `8000`, web on `5173`.
- Alembic migration `0001_foundation_schema` ran.
- `GET /health` returned `status=ok`.
- `GET http://localhost:5173` returned HTTP 200.
- `SELECT count(*) FROM nodes` returned 12.
- `GET /api/twin/nodes` returned 12 nodes and 7 edges.

Caveat: the FINAL_ALIGNED_DOSSIER section 3 source file/count is not present in the workspace or remote repo, so the required comparison to the dossier node count cannot be completed yet. Per the user's 2026-07-14 instruction to retry, commit, and move to Phase 2, proceed while keeping this caveat open.

## Phase-by-Phase Status
| Phase | Name | Status | Notes |
|---|---|---|---|
| 1 | Foundation | operationally verified; caveat open | Compose/API/web/db seed work; node count is 12, but dossier-count comparison unavailable. |
| 2 | GDELT + EIA ingestion | next | Requires real GDELT titles and real EIA data points logged in `BUILD_LOG.md`. |
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
Tier 1: Phase 1 operationally verified; Phase 2 is next.

Tier 2: not started and not eligible to start until Tier 1 is fully real and verified.

Tier 3: never build, stub, or claim.

## Decisions Already Made
### 5A - Agent Defaults Exercised
- Created local `.env` with `POSTGRES_PASSWORD=urjakavach_dev`, `POSTGRES_PORT=5433`, and empty external API keys. This is ignored by `.gitignore`.
- Added React TypeScript declaration packages (`@types/react`, `@types/react-dom`) after the Vite/TypeScript build failed on missing JSX declarations.
- Used a provisional static seed file because no FINAL_ALIGNED_DOSSIER or source node file exists in the workspace; this remains logged as a verification caveat, not treated as final verified source parity.
- Added `POSTGRES_PORT` to `.env.example` and used `${POSTGRES_PORT:-5432}:5432` in Compose so clean clones still default to the locked 5432 mapping while local conflicts can be handled without editing committed files.

### 5B - Escalations / Human Confirmations
Pending before Phase 4: explicit human confirmation is required for the corrected 4-term risk-scoring formula from HLD/LLD section 2.5 and Execution Plan section 5 correction. No confirmation has occurred yet.

No other section 2B escalations have occurred yet.

## OPEN QUESTIONS
- Phase 1 caveat: the workspace and remote repo do not include `Energy_Supply_Chain_Resilience_FINAL_ALIGNED_DOSSIER.md` or another source for the required section 3 node count. Need the dossier/source count to close the verification caveat.
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

`.env.example` contains empty API keys only. `.env` is ignored by `.gitignore`.

## Schema State
Schema is locked to Execution Plan section 6, with the HLD/LLD section 2.5 correction that risk scoring uses `component_gdelt_volume` rather than Goldstein severity.

Implemented tables:
- `nodes`
- `edges`
- `risk_scores`
- `ais_snapshots`
- `scenarios`
- `scenario_runs`

Implemented indexes:
- `risk_scores(corridor, computed_at)`
- `ais_snapshots(bounding_box, captured_at)`
- `scenario_runs(scenario_id, run_at)`

Migration `0001_foundation_schema` applied successfully in Docker during Phase 1 verification.

## Repository State
Repository is initialized with git and tracks `origin/main` at `https://github.com/kansalshivam/UrjaKavach.git`. Remote initially contained only `LICENSE` and `README.md`. Local Phase 1 files are being committed sequentially.

## Files Created/Modified This Session
- Created `HANDOFF.md`.
- Created `.env.example`.
- Created `.gitignore`.
- Created `BUILD_LOG.md`.
- Created `docker-compose.yml`.
- Created `data/india_energy_nodes.json`.
- Created backend scaffold under `api/`, including Dockerfile, pyproject, Alembic config/migration, SQLAlchemy models, seed loader, FastAPI app, and routes.
- Created frontend scaffold under `web/`, including Dockerfile, package files, Vite config, React entrypoint, app screen, and CSS.
- Created local ignored `.env`.

## Commands Run and Results
- `Get-Content -Raw` on all four spec files: completed; actual Execution Plan filename is `UrjaKavach_Execution_Plan (1).md`.
- `git init`: initialized repository.
- `git fetch origin main`: fetched GitHub repo containing initial `LICENSE` and `README.md`.
- `python -m py_compile ...`: passed for all backend Python files.
- `npm install`: succeeded after initial restricted-network failure in prior permission mode.
- `npm install --save-dev @types/react @types/react-dom`: succeeded.
- `npm run build`: passed.
- `docker compose up --build -d`: built images but first failed on host port `5432` already allocated by `project-postgres-1`.
- `docker compose up -d` with local `POSTGRES_PORT=5433`: succeeded.
- `docker compose ps`: Postgres healthy, API/web up.
- `docker compose logs api --tail=80`: Alembic migration and Uvicorn startup confirmed.
- `Invoke-RestMethod http://localhost:8000/health`: returned `status=ok`.
- `Invoke-WebRequest http://localhost:5173`: returned HTTP 200.
- `docker compose exec -T postgres psql -U urjakavach -d urjakavach -c "SELECT count(*) FROM nodes;"`: returned 12.
- `Invoke-RestMethod http://localhost:8000/api/twin/nodes`: returned 12 nodes and 7 edges.

## Live-Data Verification Log
GDELT DOC 2.0: unverified in this environment.

EIA v2: unverified in this environment.

AISstream.io: unverified in this environment. Known documented risk: `aisstream/aisstream#15`, opened 2026-03-13, may accept subscription but deliver zero messages.

OFAC SDN list: unverified in this environment.

LLM narrative provider chain: Gemini and Groq unverified in this environment.

## Known Bugs / Incomplete Work / TODOs
- Need close Phase 1 node-count caveat when FINAL_ALIGNED_DOSSIER section 3/source count is available.
- `npm audit` reports 1 moderate and 1 high vulnerability. No upgrade/fix was applied because Phase 1 does not authorize dependency substitution or breaking upgrades without a phase-relevant need.
- Phase 2 needs ingestion staging tables/modules. The locked Execution Plan section 6 schema does not include `gdelt_articles` or `price_points`, while HLD/LLD Phase 2 describes those staging tables. This may need careful handling as a schema-adjacent issue if tables are required.

## Known Issues / Deviations From Spec
- The Execution Plan file is named `UrjaKavach_Execution_Plan (1).md` in this workspace rather than `UrjaKavach_Execution_Plan.md`. No spec deviation in content has been made.
- `data/india_energy_nodes.json` is provisional because the dossier/source node list was not present. It must be replaced or verified against FINAL_ALIGNED_DOSSIER section 3 when available.
- Local host port `5432` is occupied by another container; local `.env` uses `POSTGRES_PORT=5433`. Committed default remains `5432`.

## Immediate Next Action
Commit Phase 1 work sequentially to `origin/main`, then start Phase 2: implement GDELT + EIA ingestion without changing locked schema silently. First inspect whether Phase 2 staging tables can be added under the existing schema lock or must be recorded as a section 2B schema escalation.
