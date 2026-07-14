# Urja Kavach Handoff

## Read This First
Urja Kavach is governed by four local specification files read in full on 2026-07-14:
- `UrjaKavach_Execution_Plan (1).md`
- `UrjaKavach_Architecture_Plan.md`
- `UrjaKavach_HLD_LLD.md`
- `UrjaKavach_Agent_Execution_Rules.md`

The binding operating contract is `UrjaKavach_Agent_Execution_Rules.md`. Work must proceed one phase at a time using only the 12 phases in Execution Plan section 9. Architecture, tier order, schema, data sources, and handoff maintenance are locked by the four files above. The `Energy_Supply_Chain_Resilience_FINAL_ALIGNED_DOSSIER.md` file is present in the repo as ground-truth data for node seeding and scenario calibration.

## Current Phase
Phase 2: GDELT + EIA ingestion, in progress and blocked on live-source verification.

Phase 2 done-condition: scheduled jobs pulling GDELT DOC 2.0 and EIA data on fixed intervals, writing raw signal rows.

Implemented:
- `gdelt_articles` and `price_points` staging tables via Alembic migration `0002_phase2_ingestion_staging` after user said `continue`, treated as approval for the schema escalation raised in the prior response.
- SQLAlchemy models for both staging tables.
- GDELT and EIA ingestion clients.
- Repository helpers for deduplicated/upserted raw signal row writes.
- APScheduler wired into FastAPI lifespan with GDELT every 15 minutes and EIA hourly.
- 6-second pause between GDELT corridor queries inside one poll.

Verification so far:
- `python -m py_compile` passed for updated backend files.
- `docker compose up --build -d` succeeded.
- Alembic version is `0002_phase2_ingestion_staging`.
- API health returns `status=ok`.
- `gdelt_articles` table exists, currently 0 rows.
- `price_points` table exists, currently 0 rows.

Blockers:
- GDELT returned HTTP 429 Too Many Requests repeatedly, including after a 65-second cooldown. This is the documented GDELT rate-limit risk firing.
- `EIA_API_KEY` is empty in local `.env`, so EIA live verification cannot run.

## Phase-by-Phase Status
| Phase | Name | Status | Notes |
|---|---|---|---|
| 1 | Foundation | complete | Docker/API/web/db verified; 37 Dossier Part 3 nodes seeded. |
| 2 | GDELT + EIA ingestion | in progress | Infrastructure complete; live verification blocked by GDELT 429 and missing EIA key. |
| 3 | AISstream.io live overlay | not started | Must not start until Phase 2 done-condition and verification pass. |
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
Tier 1: Phase 1 complete; Phase 2 active and blocked on live verification.

Tier 2: not started and not eligible to start until Tier 1 is fully real and verified.

Tier 3: never build, stub, or claim.

## Decisions Already Made
### 5A - Agent Defaults Exercised
- Created local `.env` with `POSTGRES_PASSWORD=urjakavach_dev`, `POSTGRES_PORT=5433`, and empty external API keys. This is ignored by `.gitignore`.
- Added React TypeScript declaration packages (`@types/react`, `@types/react-dom`) after the Vite/TypeScript build failed on missing JSX declarations.
- Added `POSTGRES_PORT` to `.env.example` and used `${POSTGRES_PORT:-5432}:5432` in Compose so clean clones still default to the locked 5432 mapping while local conflicts can be handled without editing committed files.
- Seed loader reads JSON using `utf-8-sig` to tolerate Windows-authored UTF-8 BOM files.
- Added GDELT intra-poll sleep of 6 seconds as defensive rate-limit handling consistent with Architecture Plan guidance.

### 5B - Escalations / Human Confirmations
Resolved Phase 2 schema escalation: user said `continue` after the prior response explicitly said Phase 2 required approval to add `gdelt_articles` and `price_points`; implemented those staging tables.

Pending before Phase 4: explicit human confirmation is required for the corrected 4-term risk-scoring formula from HLD/LLD section 2.5 and Execution Plan section 5 correction. No confirmation has occurred yet.

## OPEN QUESTIONS
- Provide/configure `EIA_API_KEY` in `.env` to complete EIA live verification.
- Retry GDELT later after the source-side 429 clears; need 5 real current article titles for Phase 2 verification.
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
Phase 1 schema implemented and migrated:
- `nodes`
- `edges`
- `risk_scores`
- `ais_snapshots`
- `scenarios`
- `scenario_runs`

Phase 2 staging schema implemented and migrated after approval:
- `gdelt_articles`
- `price_points`

Current Alembic version: `0002_phase2_ingestion_staging`.

## Repository State
Repository tracks `origin/main` at `https://github.com/kansalshivam/UrjaKavach.git`. Phase 1 commits and Phase 2 client skeleton were pushed. Current working tree contains Phase 2 persistence/migration updates pending commit.

## Files Created/Modified This Session
- Modified `api/app/db/models.py`.
- Modified `api/app/main.py`.
- Modified `api/app/scheduler.py`.
- Added `api/alembic/versions/0002_phase2_ingestion_staging.py`.
- Added `api/app/ingestion/repository.py`.
- Updated `BUILD_LOG.md`.
- Updated `HANDOFF.md`.

## Commands Run and Results
- `python -m py_compile api\app\main.py api\app\db\models.py api\app\scheduler.py api\app\ingestion\gdelt.py api\app\ingestion\eia.py api\app\ingestion\repository.py api\alembic\versions\0002_phase2_ingestion_staging.py`: passed.
- `docker compose up --build -d`: succeeded.
- `docker compose logs api --tail=120`: confirmed Alembic upgrade from `0001_foundation_schema` to `0002_phase2_ingestion_staging` and API startup.
- `SELECT version_num FROM alembic_version`: `0002_phase2_ingestion_staging`.
- `SELECT count(*) FROM gdelt_articles`: 0.
- `SELECT count(*) FROM price_points`: 0.
- `GET /health`: `status=ok`.
- GDELT retry after `Start-Sleep -Seconds 65`: HTTP 429 Too Many Requests.

## Live-Data Verification Log
GDELT DOC 2.0: attempted on 2026-07-14 for `"Strait of Hormuz"`; source returned documented rate-limit response multiple times, including after a 65-second cooldown. Treat as documented source risk firing, not app bug. No real article titles captured yet.

EIA v2: unverified in this environment because `EIA_API_KEY` is not configured.

AISstream.io: unverified in this environment. Known documented risk: `aisstream/aisstream#15`, opened 2026-03-13, may accept subscription but deliver zero messages.

OFAC SDN list: unverified in this environment.

LLM narrative provider chain: Gemini and Groq unverified in this environment.

## Known Bugs / Incomplete Work / TODOs
- Need configure `EIA_API_KEY` before EIA live verification.
- Need retry GDELT later with conservative cadence to capture 5 real current article titles.
- Need run/observe scheduler jobs after live sources are available and confirm rows are written to `gdelt_articles` and `price_points`.
- `npm audit` reports 1 moderate and 1 high vulnerability. No upgrade/fix was applied because Phase 1 did not authorize dependency substitution or breaking upgrades without a phase-relevant need.

## Known Issues / Deviations From Spec
- The Execution Plan file is named `UrjaKavach_Execution_Plan (1).md` in this workspace rather than `UrjaKavach_Execution_Plan.md`. No spec deviation in content has been made.
- Local host port `5432` is occupied by another container; local `.env` uses `POSTGRES_PORT=5433`. Committed default remains `5432`.
- Phase 2 cannot be marked done until real GDELT and EIA rows are observed and logged.

## Immediate Next Action
Add `EIA_API_KEY` to local `.env`, wait for GDELT 429 to clear, then trigger/observe Phase 2 ingestion and log 5 real GDELT article titles plus 5 real EIA Brent data points. Do not start Phase 3 until Phase 2 verification passes.
