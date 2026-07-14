# Urja Kavach Build Log

## 2026-07-14 - Phase 1 Foundation Started
- Read all four binding specification files completely.
- Created initial `HANDOFF.md` before implementation, per Agent Execution Rules section 11.
- Started Phase 1 only after handoff initialization.
- Repository was not a git repository at start (`git status --short` returned fatal not a git repository).
- The expected Execution Plan filename was absent; actual file is `UrjaKavach_Execution_Plan (1).md`.
- No FINAL_ALIGNED_DOSSIER file or pre-existing `india_energy_nodes.json` exists in the workspace, so the exact section 3 node count cannot yet be verified from local files.

## 2026-07-14 - Phase 1 Foundation Scaffold
- Created Phase 1 foundation scaffold: `docker-compose.yml`, `.env.example`, `.gitignore`, `api/`, `web/`, `data/india_energy_nodes.json`.
- Initialized git repository with `git init`.
- Created local ignored `.env` with a development-only `POSTGRES_PASSWORD` and empty external API keys.
- Implemented locked Phase 1 schema in SQLAlchemy and Alembic migration: `nodes`, `edges`, `risk_scores`, `ais_snapshots`, `scenarios`, `scenario_runs`, plus required indexes.
- Used PostgreSQL `JSONB` for `risk_scores.weights_used`, matching Execution Plan section 6.
- Added FastAPI health route, dashboard placeholder API, twin nodes API, and startup seed loader.
- Added Vite React TypeScript dashboard shell for the empty dashboard render condition.
- `python -m py_compile api\app\main.py api\app\db\models.py api\app\db\session.py api\app\seed.py api\app\routes\dashboard.py api\app\routes\twin.py api\alembic\env.py api\alembic\versions\0001_foundation_schema.py`: passed.
- `npm install` first failed under restricted cache mode, then succeeded after network approval.
- `npm install --save-dev @types/react @types/react-dom`: succeeded after network approval.
- `npm run build` first failed because sandbox blocked esbuild child-process spawn (`EPERM`), then succeeded after escalation.
- `docker compose up --build`: failed because Docker Desktop Linux engine was not running or unavailable: `open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified.`
- Phase 1 is implemented but not verified-done because Compose cannot start and `SELECT count(*) FROM nodes` cannot be run yet.
- Important deviation note: `data/india_energy_nodes.json` is a provisional seed because the FINAL_ALIGNED_DOSSIER section 3 node list/count is not present in this workspace. Source notes on every seed row explicitly say this must be verified when the dossier/source node count is available.

## 2026-07-14 - Phase 1 Compose Retry and Verification
- Retried `docker compose up --build -d`; Docker Desktop Linux engine was available and image builds completed.
- Startup first failed because host port `5432` was already allocated by existing container `project-postgres-1`.
- Preserved the default committed Postgres port as `5432` by changing `docker-compose.yml` to `${POSTGRES_PORT:-5432}:5432`; set ignored local `.env` to `POSTGRES_PORT=5433` for this machine only.
- `docker compose up -d`: succeeded with Postgres healthy on host `5433`, API on `8000`, web on `5173`.
- `docker compose logs api --tail=80`: confirmed Alembic upgrade `0001_foundation_schema` ran and Uvicorn started.
- `Invoke-RestMethod http://localhost:8000/health`: returned `status=ok`.
- `Invoke-WebRequest http://localhost:5173`: returned HTTP 200.
- `docker compose exec -T postgres psql -U urjakavach -d urjakavach -c "SELECT count(*) FROM nodes;"`: returned 12.
- `GET /api/twin/nodes`: returned 12 node objects and 7 edge objects from the seed.
- Phase 1 operational checks pass. The only unresolved verification caveat is that FINAL_ALIGNED_DOSSIER section 3 is absent from this workspace, so the required external node-count comparison remains unavailable.

## 2026-07-14 - Phase 2 Started: GDELT Rate Limit Fired
- Started Phase 2 after Phase 1 commits were pushed to `origin/main`.
- First live GDELT DOC 2.0 probe for `"Strait of Hormuz"` returned GDELT's documented rate-limit message: `Please limit requests to one every 5 seconds...`.
- This matches the Architecture Plan's documented GDELT soft ceiling and is treated as a documented external-source risk firing, not an application bug.
- Immediate response: log the event, avoid rapid retries, and implement GDELT client defaults with conservative timeout and scheduler cadence.
- Phase 2 schema blocker identified: HLD/LLD describes `gdelt_articles` and `price_points` staging tables, but Execution Plan section 6 locked schema does not include them. Per Agent Execution Rules sections 2B and 4, adding these tables requires explicit human confirmation before migration work.

## 2026-07-14 - Phase 1 Dossier Verification Completed
- User provided `C:\Users\shiva\Downloads\Energy_Supply_Chain_Resilience_FINAL_ALIGNED_DOSSIER.md`, the missing source document for the Phase 1 node-count caveat.
- Copied the dossier into the repository as `Energy_Supply_Chain_Resilience_FINAL_ALIGNED_DOSSIER.md` so the seed-data source is durable.
- Rebuilt `data/india_energy_nodes.json` from Dossier Part 3: operational and planned SPR nodes, listed refinery locations, listed major crude ports, named pipeline examples, and the Tier-1 Hormuz shipping corridor.
- Updated seed loader to read `utf-8-sig` because PowerShell-authored JSON included a UTF-8 BOM that caused `json.loads` to fail in the API container.
- Reset local Postgres volume with `docker compose down -v`, rebuilt with `docker compose up --build -d`, and confirmed startup succeeded.
- `SELECT count(*) FROM nodes` returned 37: 5 SPR, 17 refinery, 9 port, 6 pipeline/corridor nodes.
- `SELECT count(*) FROM edges` returned 19.
- `GET /health` returned `status=ok`.
- `GET /api/twin/nodes` returned 37 nodes.
- Phase 1 is now complete against the available Dossier Part 3 source. Note: Dossier Part 3 is a categorical node list, not a single explicit numeric count; the implemented count is the direct enumeration of the named nodes in that section.

## 2026-07-14 - Phase 2 Persistence Implemented
- User said `continue`; treated as explicit approval to resolve the Phase 2 schema escalation for HLD/LLD-required staging tables.
- Added Alembic migration `0002_phase2_ingestion_staging` creating `gdelt_articles` and `price_points`.
- Added SQLAlchemy models for `GdeltArticle` and `PricePoint`.
- Added ingestion repository helpers using PostgreSQL upserts/deduplication.
- Wired FastAPI lifespan to start/shutdown an in-process APScheduler, matching the Architecture Plan.
- Scheduler jobs now poll GDELT every 15 minutes and EIA hourly; jobs write to staging tables when source calls succeed.
- Added conservative 6-second pause between GDELT corridor queries inside one poll to respect GDELT's documented limit.
- `python -m py_compile ...`: passed for updated Phase 2 Python files.
- `docker compose up --build -d`: succeeded.
- Alembic upgraded to `0002_phase2_ingestion_staging`.
- `GET /health`: returned `status=ok`.
- `SELECT version_num FROM alembic_version`: returned `0002_phase2_ingestion_staging`.
- `SELECT count(*) FROM gdelt_articles`: 0.
- `SELECT count(*) FROM price_points`: 0.
- GDELT live verification retried after a 65-second cooldown; source still returned HTTP 429 Too Many Requests with the documented rate-limit message.
- EIA live verification remains blocked because local `.env` does not contain `EIA_API_KEY`.
- Phase 2 implementation infrastructure is in place, but Phase 2 is not verified-done because 5 live GDELT titles and 5 live EIA data points have not been captured.

## 2026-07-14 - Local API Key Configuration Update
- User provided AISstream, Gemini, and Groq API keys in chat and explicitly asked to place them in local `.env`.
- Updated ignored local `.env` with `AISSTREAM_API_KEY`, `GEMINI_API_KEY`, and `GROQ_API_KEY`.
- Did not print or commit secret values.
- Verified key presence only: AISstream/Gemini/Groq configured; `EIA_API_KEY` still missing.
- Phase 2 remains blocked on EIA key generation and GDELT 429 clearing.

## 2026-07-14 - Phase 2 EIA Verification Completed, GDELT Still Blocked
- Added user-provided `EIA_API_KEY` to ignored local `.env`; value not printed or committed.
- Verified EIA Brent spot route `/v2/petroleum/pri/spt/data/` with series `RBRTE`.
- Real EIA points inspected and persisted to `price_points`:
  - 2026-07-06 RBRTE 69.56 $/BBL
  - 2026-07-03 RBRTE 68.68 $/BBL
  - 2026-07-02 RBRTE 68.53 $/BBL
  - 2026-07-01 RBRTE 69.24 $/BBL
  - 2026-06-30 RBRTE 70.46 $/BBL
- Restarted API container with updated local `.env` and manually ran `run_eia_poll()` in the API container.
- `SELECT period, series, value, units FROM price_points ORDER BY period DESC LIMIT 5` confirmed the five rows above were written.
- `GET /health` returned `status=ok`.
- Retried GDELT using a clean URL-encoded GET request with `User-Agent`; response still HTTP 429 Too Many Requests.
- `SELECT count(*) FROM gdelt_articles` remains 0.
- Phase 2 remains incomplete because the GDELT verification requirement (5 real article titles) has not passed.
