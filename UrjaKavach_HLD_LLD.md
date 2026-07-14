# Urja Kavach — Module-Wise HLD & LLD (Local Docker Deployment)
### Companion #3 — the final, detailed design reference
**Prepared 14 July 2026 · ET AI Hackathon 2026, Problem Statement #2**

---

## 0. Read order and how this document relates to the other two

Read `UrjaKavach_Execution_Plan.md` first (what's being built and why, phase-by-phase, locked
scope). Read `UrjaKavach_Architecture_Plan.md` second (exact tech choices, verified API
integration code, repo layout). This document is third: it walks every module the phase table
in the Execution Plan actually produces, gives each one a small state machine or data-flow
picture, and ties the whole thing together into one end-to-end pipeline diagram (§3). If a
future implementer (human or agent) is unsure what a module is supposed to do, this is the
document to check before improvising.

---

## 1. System-Wide HLD

```
                    ┌─────────────────────────────────────────────┐
                    │              EXTERNAL SOURCES                │
                    │  GDELT DOC 2.0   EIA v2   AISstream.io  OFAC │
                    └──────┬───────────┬───────────┬──────────┬───┘
                           │           │           │          │
                    ┌──────▼───────────▼───────────▼──────────▼───┐
                    │        INGESTION LAYER (APScheduler jobs)     │
                    │   gdelt.py   eia.py   ais.py   ofac.py        │
                    └──────────────────────┬────────────────────────┘
                                            │ raw signal rows
                    ┌───────────────────────▼────────────────────────┐
                    │           POSTGRES  (source of truth)            │
                    │  nodes edges risk_scores ais_snapshots scenarios │
                    │  scenario_runs                                    │
                    └──────┬────────────────────────────┬───────────────┘
                           │                              │
              ┌────────────▼───────────┐      ┌───────────▼────────────┐
              │   SCORING LAYER          │      │   GRAPH LAYER            │
              │  risk_score.py (§5 wtd    │      │  propagation.py          │
              │  formula, on schedule)    │─────▶│  (NetworkX BFS-decay,    │
              └────────────┬─────────────┘      │   on-demand per request) │
                           │                      └───────────┬────────────┘
              ┌────────────▼─────────────┐                    │
              │   SCENARIO ENGINE          │◀───────────────────┘
              │  scenario.py (slider input,│
              │  cascading projections)    │
              └────────────┬────────────────┘
                           │
              ┌────────────▼─────────────┐
              │   LLM NARRATIVE LAYER       │
              │  narrative.py (context      │
              │  shell → Gemini/Groq)       │
              └────────────┬────────────────┘
                           │
                    ┌──────▼───────┐
                    │  FASTAPI REST │
                    │  routes/*.py  │
                    └──────┬────────┘
                           │
                    ┌──────▼──────────────────────────────┐
                    │   REACT FRONTEND (Screens 0-7)         │
                    │  Dashboard / Twin Map / Scenario /     │
                    │  Narrative / (Tier2: Procurement,      │
                    │  Reserve, RAG)                          │
                    └─────────────────────────────────────────┘
```

The one architectural rule this diagram encodes: **nothing downstream ever talks to an external
source directly.** The frontend never calls GDELT; the scenario engine never calls AISstream.io.
Everything downstream of Postgres reads only from Postgres. This is what makes the golden-fallback
demo mode (Execution Plan §10) possible — swap the ingestion layer's outputs for a pre-recorded
snapshot, and every layer above it behaves identically, because it never knew the difference.

---

## 2. Module-by-Module HLD, LLD, and State Machines

### 2.1 Ingestion Module — GDELT [Tier 1]

- **HLD:** APScheduler job, every 10–15 minutes, queries GDELT DOC 2.0 for a fixed set of
  corridor-relevant queries (`"Strait of Hormuz"`, `"Bab el-Mandeb"`, `"Iran oil sanctions"`),
  writes raw article metadata (title, URL, seendate, tone) to a `gdelt_articles` staging table.
- **LLD / state machine:**
  ```
  IDLE → (scheduler tick) → FETCHING → (success) → WRITING → IDLE
                                    → (HTTP error / timeout) → LOG_FAILURE → IDLE (retry next tick)
  ```
- **Failure isolation:** a GDELT fetch failure never blocks the EIA or AIS jobs (separate
  APScheduler jobs, independent try/except blocks) and never blocks risk-score computation — the
  scoring layer reads the *last known* article-volume z-score if the current tick failed, and
  flags `stale: true` on that component in the API response so the frontend can say so honestly.

### 2.2 Ingestion Module — EIA [Tier 1]

- **HLD:** hourly job, pulls Brent spot price series, writes to `price_points` staging table.
- **LLD:** same IDLE→FETCHING→WRITING pattern as 2.1. Price volatility signal
  (`normalized_price_volatility`) is computed as a 3-day rolling % change on read, not stored
  pre-computed, so the formula (Execution Plan §5) stays auditable from raw price points forward.

### 2.3 Ingestion Module — AISstream.io [Tier 1, highest documented risk]

- **HLD:** a long-lived WebSocket client task (not an APScheduler tick — this is a persistent
  connection), running in its own asyncio task, writing 5-minute vessel-count aggregates to
  `ais_snapshots`.
- **LLD / state machine:**
  ```
  DISCONNECTED → CONNECTING → (subscribe msg sent within 3s) → SUBSCRIBED
       SUBSCRIBED → (message received) → AGGREGATING → (5-min window closes) → WRITE_SNAPSHOT → SUBSCRIBED
       SUBSCRIBED → (10 min, zero messages) → FLAG_RISK_KNOWN_ISSUE → (log to HANDOFF.md) → SUBSCRIBED
       any state → (socket closed/error) → BACKOFF (5s, capped exponential to 60s) → CONNECTING
  ```
  The `FLAG_RISK_KNOWN_ISSUE` transition is a **first-class, designed state**, not an
  afterthought — it exists because of the documented `aisstream/aisstream#15` GitHub issue
  (Architecture Plan §4). When it fires, the frontend's Digital Twin screen must show "AIS feed
  quiet — showing last confirmed snapshot from [timestamp]," never a silently frozen or fabricated
  live-looking count.

### 2.4 Ingestion Module — OFAC [Tier 1]

- **HLD:** daily job, downloads SDN CSV, diffs against yesterday's stored copy, writes new
  Iran-program entries as a count to `sanctions_flags`.
- **LLD:** simple CRON-style daily tick, no retry complexity needed (a missed day just means
  the sanctions signal is one day stale, tolerable for this signal's weight of 0.10 in §5's
  formula).

### 2.5 Scoring Module — Risk Score Engine [Tier 1]

- **HLD:** scheduled recompute (every 10 minutes, matching the GDELT poll cadence — no point
  recomputing faster than the slowest-refreshing real input), reads the latest staged signals
  for each corridor, applies the §5 weighted formula, writes one row per corridor to
  `risk_scores`.
- **LLD:**
  ```python
  def compute_risk_score(corridor: str, signals: SignalBundle, weights: dict) -> RiskScoreRow:
      components = {
          "gdelt_volume": normalize(signals.gdelt_article_volume_zscore),
          "price_volatility": normalize(signals.price_3day_pct_change),
          "ais_deviation": normalize(signals.ais_count_vs_baseline),
          "sanctions_flag": signals.sanctions_new_entries_7d > 0,
      }
      score = sum(weights[k] * v for k, v in components.items()) * 100
      return RiskScoreRow(corridor=corridor, score=score, components=components, weights_used=weights)
  ```
- **Note on §5's formula reconciliation:** per Architecture Plan §2, the `gdelt_goldstein_severity`
  term named in the Execution Plan's original formula is replaced with `gdelt_volume` (article
  z-score) here, since GDELT DOC 2.0 doesn't expose Goldstein scores directly. This LLD is the
  authoritative, corrected version — the Execution Plan's §5 text should be updated to match
  before Phase 4 begins (a documented, deliberate correction, not scope drift).

### 2.6 Graph Module — Digital Twin Node/Edge Store + Propagation [Tier 1]

- **HLD:** static `nodes`/`edges` tables, seeded once at boot from `india_energy_nodes.json`;
  `propagation.py` (Architecture Plan §7) is called **on-demand per API request**, not scheduled —
  it's cheap (one BFS pass over a few dozen nodes) and always needs the *current* corridor risk
  scores as input, so caching it would just reintroduce staleness for no performance benefit at
  this scale.
- **LLD:** see Architecture Plan §7's `propagate_risk` function — this section exists to record
  the *design reasoning* (why on-demand, why BFS-decay, why not cached) rather than repeat the
  code.

### 2.7 Scenario Engine [Tier 1]

- **HLD:** given a scenario ID (`hormuz_partial_closure`, the only Tier-1 scenario) and a
  `capacity_available_pct` slider value (0–100), computes:
  1. Projected import volume change — linear interpolation calibrated against the real
     2026 data point (23% import decline observed at effectively ~0–30% Hormuz capacity
     available during the worst closure weeks, per FINAL_ALIGNED_DOSSIER §2) as one anchor,
     and 0% change at 100% capacity available as the other anchor.
  2. Projected SPR days-of-cover — starting from the real ~9.5-day (or the live ~64%-capacity,
     ~6-day-equivalent RTI figure, FINAL_ALIGNED_DOSSIER §0) baseline, drawn down at a rate
     proportional to the projected import shortfall.
  3. A narrative-ready summary dict, passed to the LLM context-shell builder.
- **LLD / state machine:**
  ```
  IDLE → (user moves slider) → COMPUTING → (writes scenario_runs row) → IDLE (result returned)
  ```
  Every slider move is a **new, stored `scenario_runs` row** (Execution Plan §6 schema), not an
  ephemeral client-side calculation — this is deliberate, so the demo can replay "what did the
  model say at 0%, 30%, 70%, 100% capacity" as a reproducible sequence, not a one-shot UI effect.
- **Calibration honesty requirement:** the linear-interpolation anchors above are **explicitly
  a simplification**, stated as such in the UI's assumptions panel — two real data points do not
  make a validated curve, and the demo narration must say this plainly (this is the same
  discipline as Execution Plan §5's risk-weight honesty framing).

### 2.8 LLM Narrative Module [Tier 1]

- **HLD:** on-demand (triggered by dashboard refresh or scenario run), builds a context shell
  from the current `risk_scores` + optional `scenario_runs` row (Architecture Plan §6), calls
  Gemini 2.5 Flash-Lite, falls back to Groq `llama-3.1-8b-instant` on error/429/timeout.
- **LLD / state machine:**
  ```
  IDLE → (trigger) → BUILD_CONTEXT → CALL_GEMINI → (success) → RETURN
                                            → (429/timeout/error) → CALL_GROQ → (success) → RETURN
                                                                          → (error) → RETURN_STATIC_FALLBACK_TEXT
  ```
  `RETURN_STATIC_FALLBACK_TEXT` is a **named, designed terminal state**, not a crash path — if
  both LLM providers are unreachable during the live demo, the UI shows the structured numbers
  with a plain-text template narrative ("Risk score for Hormuz corridor: 62/100, driven primarily
  by elevated GDELT signal volume") rather than an error screen. This keeps Screens 1–4 usable
  even in a total LLM-outage scenario.

### 2.9 Digital Twin Map Module (Screen 2) [Tier 1]

- **HLD:** React + react-leaflet, renders `nodes` (SPR/refinery/port/pipeline) as markers,
  colored by `node_risk` from the propagation module (§2.6), plus a live vessel-count badge per
  bounding box from `ais_snapshots`.
- **LLD:** on mount, `GET /api/twin/nodes` (static-ish, cached client-side) + polling
  `GET /api/twin/live` (risk colors + AIS counts) every 60s — deliberately **not** a WebSocket to
  the frontend; a 60-second poll is honest about the true refresh cadence and far simpler to
  demo reliably than a live socket-to-browser connection.

### 2.10 Command Dashboard Module (Screen 1) [Tier 1]

- **HLD:** risk score display (current + trend chart via Recharts), GDELT signal feed (last 10
  article titles/links per corridor), assumptions-panel entry point.
- **LLD:** `GET /api/dashboard/summary` returns `{risk_scores: [...], recent_articles: [...],
  weights_used: {...}}` in one call — deliberately denormalized into one response for this
  screen, since it's read together and a hackathon judge should see it render in one request, not
  a waterfall of five.

### 2.11 Scenario Simulator Module (Screen 3) [Tier 1]

- **HLD:** slider UI bound to `POST /api/scenario/run {scenario_id, capacity_available_pct}`,
  which returns the projection dict from §2.7 and triggers a fresh LLM narrative call.
- **LLD:** debounce the slider input client-side (250ms) before firing the API call — prevents
  flooding the LLM narrative endpoint (and the free-tier rate limits in Architecture Plan §6)
  with a call per pixel of drag.

### 2.12 Frontend Design System Module (cross-cutting)

- Beyond Tailwind + react-leaflet/Recharts, this project deliberately layers in a small,
  purpose-scoped set of copy-source component libraries (full install architecture in
  Architecture Plan §1a) — each mapped to one specific screen or element, never decorative
  without a job:
  - **React Bits Circular Gallery** → Screen 0 (Landing), browsable ring of the real
    Feb–Jul 2026 crisis-timeline events.
  - **Vengeance UI Cursor Card** → Screen 1 (Dashboard), the three corridor risk-score cards.
  - **Animate UI Checkbox** (Radix-based) → Screen 1's Assumptions Panel weight toggles and
    Screen 6's Tier-2 scenario-inclusion checkboxes — the one place real accessibility
    semantics are required because the control changes a computed output, not decoration.
  - **Motion Primitives Scroll Progress** → Screen 0's timeline story block and Screen 7's
    (Tier 2) RAG source panel.
  - **Animata Interactive Grid** → Screen 0 background only — never behind a screen showing
    live numbers, since a moving background under real data hurts legibility.
  - **Cult UI Hover Video Player** → repurposed as hover-preview on Screen 0's demo-video
    thumbnail and Screen 1's GDELT headline hover-preview.
  - **anime.js `sync-timelines`** → the one deliberate second animation runtime, scoped to
    Screen 0's crisis-timeline scrubber (keeps the gallery card, a mini risk-color pulse, and
    the Brent price sparkline marker moving together against one scrub position).
  - **Iconsax animated set** → the single icon system across all screens (risk-level icons,
    node-type legend icons, corridor icons).
- Color palette: risk-score gradient (green→amber→red) applied consistently across Screens 1, 2,
  and 3 so a judge can visually correlate the dashboard number, the map color, and the scenario
  projection without re-reading labels.
- **Discipline rule, cross-referenced from Architecture Plan §1a:** any component from this list
  that would sit *behind* or *replace* a real, live number is out of scope — these libraries
  decorate and draw attention to real data, they never stand in for it.

---

## 3. Cross-Module Data Flow — the complete pipeline in one table

| Stage | Input | Module | Output | Cadence |
|---|---|---|---|---|
| 1 | GDELT/EIA/AIS/OFAC raw data | Ingestion (2.1–2.4) | Staging tables | 10min / 60min / continuous+5min agg / daily |
| 2 | Staging tables | Risk Score Engine (2.5) | `risk_scores` rows | 10min |
| 3 | `risk_scores` + `nodes`/`edges` | Graph Propagation (2.6) | Per-node derived risk | on-demand (per API call) |
| 4 | `risk_scores` + slider input | Scenario Engine (2.7) | `scenario_runs` row | on-demand (per slider move, debounced) |
| 5 | `risk_scores` + `scenario_runs` | LLM Narrative (2.8) | Narrative text | on-demand |
| 6 | All of the above via REST | Frontend Screens (2.9–2.12) | Rendered UI | 60s poll (Twin/Dashboard), on-demand (Scenario/Narrative) |

---

## 4. Deployment HLD

Three containers (Postgres, FastAPI `api`, Vite `web`), one `docker compose up`, matching
Architecture Plan §9. No separate worker/queue container — APScheduler runs in-process inside
the `api` container, which is an explicit, deliberate simplification appropriate to this
project's job volume (a handful of periodic jobs, not a high-throughput queue workload).

```
┌─────────────────────────────────────────────────────────┐
│  docker compose                                            │
│  ┌───────────┐   ┌──────────────────────┐   ┌───────────┐ │
│  │ postgres   │◀──│ api (FastAPI +        │──▶│ web (Vite  │ │
│  │ :5432      │   │  APScheduler in-proc) │   │  dev :5173)│ │
│  └───────────┘   │  :8000                │   └───────────┘ │
│                   └──────────┬────────────┘                │
└──────────────────────────────┼────────────────────────────┘
                                │ outbound only
                     GDELT / EIA / AISstream.io / OFAC / Gemini / Groq
```

---

## 5. What's Locked — No More Re-Litigating

- The pipeline direction in §1 (nothing downstream calls an external source directly) is fixed —
  it is what makes the golden-fallback demo mode possible.
- The §2.5 risk-scoring LLD (article-volume z-score, not Goldstein severity) is the corrected,
  authoritative formula — supersedes the Execution Plan §5 text on this one specific point.
- AISstream.io's `FLAG_RISK_KNOWN_ISSUE` state (§2.3) is a designed UI-visible state, not a bug
  to silently patch around.
- The LLM narrative module's `RETURN_STATIC_FALLBACK_TEXT` terminal state (§2.8) means the demo
  never shows a raw error screen for Screens 1–4, even under total LLM-provider outage.
- Digital Twin and Dashboard poll at 60s; nothing on the frontend claims sub-minute "live" data
  anywhere in UI copy — matches Execution Plan §4's Tier-3 exclusion list.

---

## Sources Consulted (14 July 2026)

- `Energy_Supply_Chain_Resilience_FINAL_ALIGNED_DOSSIER.md` (this project, prior turn) — India
  node data, real 2026 crisis timeline and response figures used as calibration anchors
- GDELT Project blog (blog.gdeltproject.org) — DOC 2.0 API rate-limiting and update history
- `alex9smith/gdelt-doc-api` (GitHub) — DOC 2.0 API client reference
- EIA Open Data API v2 technical documentation (eia.gov)
- AIS Stream API Reference (aisstream.io) — WebSocket subscription protocol
- GitHub issue `aisstream/aisstream#15` (opened 13 Mar 2026) — documented delivery reliability risk
- Google AI for Developers — Gemini API rate limits documentation (ai.google.dev), checked 14 Jul 2026
- Groq rate limits documentation (console.groq.com/docs/rate-limits), checked 14 Jul 2026
- Ivanov, Dolgui & Sokolov (2019), "Digital Supply Chain Twins: Managing the Ripple Effect" —
  foundational digital-twin reference, carried over from FINAL_ALIGNED_DOSSIER Part 4.5
