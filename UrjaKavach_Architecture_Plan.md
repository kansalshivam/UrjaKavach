# Urja Kavach — Backend & Infrastructure Architecture Plan
## Companion to `UrjaKavach_Execution_Plan.md` — solo/small-team patterns, local-first, verified against 2026 sources
**Prepared 14 July 2026 · Revision 1 · ET AI Hackathon 2026, Problem Statement #2**

---

## 0. The one framing decision everything else depends on

Urja Kavach is a **data-pipeline-and-dashboard system**, not a chat app and not a training
pipeline. Its hardest engineering problem is not the UI and not the LLM call — it is **keeping
four independent external data sources (GDELT, EIA, AISstream.io, OFAC) honest, current, and
individually failure-isolated**, because a judge querying "is this live" can and will check.
Every architectural choice below optimizes for that, in order:

1. Each external source has its own ingestion job, its own failure mode, and its own documented
   fallback — a dead AIS socket must never take down the risk-scoring job.
2. Every derived number (`risk_scores`, `scenario_runs`) stores which raw inputs produced it —
   auditability is a first-class schema requirement (Execution Plan §6), not an afterthought.
3. The stack must run **entirely on `docker compose up`, offline-demoable** — see Execution
   Plan §10's golden-fallback rule. No architecture choice below may violate that.

---

## 1. Tech stack — final, with the "why" for each row

| Layer | Choice | Why |
|---|---|---|
| Backend | **Python 3.12, FastAPI** | The domain is data pipelines, scoring math, and graph structures (NetworkX) — Python's ecosystem fits every Tier 1 module directly; a Node backend would mean re-implementing GDELT/graph tooling that already exists in Python |
| Frontend | **React 18 + Vite + TypeScript + Tailwind** | Fast local dev loop, no server-rendering complexity a hackathon doesn't need |
| Mapping | **react-leaflet + Leaflet** (not deck.gl) | Deck.gl is built for large-scale WebGL point clouds (millions of points); Urja Kavach's node count is in the tens (SPR caverns, refineries, ports) plus a live AIS overlay in the hundreds at most — Leaflet is simpler to wire to a real basemap (OpenStreetMap tiles, free, no key) and every team member can debug it without WebGL-specific knowledge. Use `react-leaflet-markercluster` only if the AIS overlay gets visually noisy |
| Charts | **Recharts** | Risk trend line, scenario-impact bars — same reasoning as the reference project: fastest correct implementation, not the most "advanced" one |
| Database | **PostgreSQL 16** (Docker) | Schema in Execution Plan §6 needs real relational integrity (foreign keys from `edges`→`nodes`, `scenario_runs`→`scenarios`) — SQLite would work but Postgres costs nothing extra in Docker and matches "production-style" credibility judges look for |
| ORM | **SQLAlchemy 2.0 (async) + Alembic** | Standard, well-documented, works cleanly with FastAPI's async request model |
| Scheduling | **APScheduler (in-process)** | No separate queue/broker needed for a handful of periodic jobs (GDELT poll, EIA poll, risk-score recompute) at hackathon scale — a Celery+Redis stack would be architectural overkill and a new failure surface for zero benefit here |
| Graph | **NetworkX (in-process, rebuilt from `nodes`/`edges` tables on each risk-propagation run)** | Matches FINAL_ALIGNED_DOSSIER Part 4.5's explicit guidance: a NetworkX risk-propagation model over real node/edge data demonstrates the right architecture pattern without training custom GNN weights under time pressure |
| AIS ingestion | **`websockets` (Python) client against `wss://stream.aisstream.io/v0/stream`** | Official protocol is a plain WebSocket, JSON messages — no SDK needed |
| LLM | **Gemini 2.5 Flash-Lite (primary) → Groq `llama-3.1-8b-instant` (fallback)** | See §7 for verified current limits and exact fallback logic |
| Containerization | **Docker Compose** (postgres, api, web, three services) | Matches Execution Plan §9 Phase 1's `docker compose up` done-condition |

---

## 1a. Frontend design system — install architecture for the named component libraries

A control-room dashboard that *looks* like a generic admin template undercuts the "geospatial
evidence depth" and "credible, judge-ready" bar this project is aiming for. The libraries below
are wired in the same copy-source-not-npm-dependency way the reference project used, mapped to
specific Urja Kavach screens — never added decoratively without a job.

**Foundation, installed first:**
```bash
npm i tailwindcss @tailwindcss/vite motion clsx tailwind-merge class-variance-authority
npx shadcn@latest init
```

**Per-library install, mapped to the exact screen it serves:**
```bash
# Animate UI — headless Checkbox (Radix-based, real keyboard/focus semantics) —
# used for the Assumptions Panel's editable-weights toggles (Screen 1) and the
# Tier-2 Reserve Planner's scenario-inclusion checkboxes (Screen 6) — the ONE
# place accessibility must not be optional, because these are real interactive
# controls that change what the model computes, not decoration.
npx animate-ui@latest add checkbox

# Motion Primitives — Scroll Progress — used on the Source Library / RAG panel
# (Screen 7, Tier 2) where a judge scrolls through curated PIB/PPAC excerpts,
# and on the pitch-deck-style "crisis timeline" story block on the Landing
# screen (Screen 0) that walks the real Feb-Jul 2026 timeline from the dossier.
npx motion-primitives@latest add scroll-progress

# React Bits — Circular Gallery — repurposed from image galleries into a
# browsable ring of the real 2026 crisis-timeline events (28 Feb strike, 2-4 Mar
# force majeure, Mar-Apr price spike, Apr ceasefire/collapse, Jun MOU, Jul
# re-escalation — FINAL_ALIGNED_DOSSIER Part 1.1) on Screen 0 — each "slide" is
# a real, dated event card, not a stock photo. Copied manually from
# reactbits.dev into src/components/gallery/, data prop swapped for the
# timeline JSON.
# (no CLI — copy-paste from https://reactbits.dev/components/circular-gallery)

# Vengeance UI — Cursor Card — used for the three corridor risk-score cards on
# the Command Dashboard (Screen 1): a cursor-tracked glow/tilt on hover draws
# attention to whichever corridor (Hormuz / non-Hormuz-West-Africa /
# non-Hormuz-Americas) the judge is currently looking at — purely decorative
# enhancement layered on top of a real, live-updating number, never a
# replacement for the number itself.
# (copy-paste from https://www.vengenceui.com/components/cursor-card)

# Animata — Interactive Grid — used as the Landing screen (Screen 0) background
# only — a subtle, cursor-reactive grid that reinforces the "control room /
# geospatial" framing before any real data loads. Never used behind a screen
# where real data is being read, since a moving background behind live numbers
# hurts legibility and undercuts the "serious tool" framing this project needs.
# (copy-paste from https://animata.design/docs/background/interactive-grid)

# Cult UI — Hover Video Player — repurposed as "Hover Preview" for the demo
# video snippet on the Landing screen (Screen 0) and, on the Command Dashboard
# (Screen 1), for hover-preview of the underlying GDELT article when hovering
# a headline in the signal feed (shows article metadata, not video, but reuses
# the same hover-triggered-media-surface pattern).
npx shadcn@latest add "https://cult-ui.com/r/hover-video-player.json"

# Skiper UI — used for general chrome: nav bar, buttons, tab switcher between
# Tier-1 screens (1-4) and Tier-2 screens (5-7) — verify current install
# command against skiper-ui.com/components at build time.

# Iconsax (animated, straight-corner set) — the single icon system used
# throughout: risk-level icons (Dashboard), node-type icons (Twin Map legend —
# SPR/refinery/port/pipeline), corridor icons. One icon set end-to-end avoids
# the "five mismatched icon styles" tell of a rushed hackathon UI.
```

**Anime.js — the one deliberate second animation runtime, scoped to exactly one feature:**
the crisis-timeline scrubber on Screen 0 uses `anime.js`'s `sync-timelines` capability to keep
three things moving together as a judge drags a scrubber across the real Feb-Jul 2026 timeline:
the Circular Gallery's active event card, a small inline risk-color pulse on a mini map, and the
Brent price sparkline's current-position marker. This is the one place a second runtime
(alongside `motion`, used everywhere else) is justified — it is the literal feature ("multiple
elements moving in sync against one scrub position") anime.js's timeline-sync API is built for,
and `motion` does not have an equivalent multi-target scrub-sync primitive. Scoped to this one
component only; not used elsewhere.

**Where each library's code lives (extends §8's repo structure):**
```
web/src/components/
├── ui/              # shadcn/ui base primitives
├── animate/          # Animate UI — Checkbox (Assumptions Panel, Reserve Planner)
├── motion/            # Motion Primitives — Scroll Progress
├── gallery/            # React Bits Circular Gallery — crisis timeline (Screen 0)
├── cards/               # Vengeance UI Cursor Card — corridor risk cards (Screen 1)
├── backgrounds/          # Animata Interactive Grid — Landing only
├── media/                 # Cult UI Hover Video Player — demo preview + article hover
├── timeline/                # anime.js sync-timelines scrubber (Screen 0)
└── icons/                     # Iconsax animated set
```

**Discipline, stated plainly so it isn't silently relitigated mid-build:** every library above
is scoped to a *specific, named* screen or element above — none is added "because it looks cool"
without a job. Two animation runtimes total (`motion` + `anime.js`, the latter scoped to one
component) is a defensible choice for a hackathon build; more would not be. Real data
(risk scores, node positions, GDELT titles) is never delayed or obscured by an animation — every
library here decorates a real number or a real event, it never stands in for one, matching the
project's core credibility discipline (Execution Plan §1, §7).

---

## 2. GDELT DOC 2.0 API — exact request shape, verified 14 July 2026

- **Endpoint:** `https://api.gdeltproject.org/api/v2/doc/doc`
- **Auth:** none — no API key required.
- **Rate limit:** approximately **1 request per 5 seconds per source IP** (undocumented officially
  but consistently reported by third-party integrators); GDELT's own blog documents active,
  evolving rate-limiting on the DOC 2.0 API as of 2026, so this is treated as a **soft ceiling,
  not a guarantee** — poll on a 10–15 minute schedule (Execution Plan §"what's still genuinely
  open"), never sub-minute.
- **Response cap:** 250 records per call (`maxrecords` parameter, hard ceiling).
- **Required header:** send a real `User-Agent` string — requests without one are more likely to
  be silently deprioritized or blocked.
- **Time window:** the `timespan` parameter only searches a rolling window (commonly used up to
  3 months); for this project, a much shorter window (24h–72h) is what actually matters for a
  *live* risk signal.
- **Python client:** `pip install gdeltdoc` (`alex9smith/gdelt-doc-api` on GitHub) wraps the raw
  HTTP call; using it directly is acceptable, but this project calls the raw endpoint directly
  (below) so the exact query and response shape is visible and auditable in `BUILD_LOG.md`.

```python
# app/ingestion/gdelt.py
import httpx
from datetime import datetime, timezone

GDELT_DOC_URL = "https://api.gdeltproject.org/api/v2/doc/doc"
USER_AGENT = "UrjaKavach-Hackathon-Prototype/1.0 (contact: <team-email>)"

async def fetch_gdelt_articles(query: str, timespan: str = "24h", maxrecords: int = 250) -> list[dict]:
    """
    query examples used by this project:
      '"Strait of Hormuz"'
      '"Strait of Hormuz" sanctions'
      '"Strait of Hormuz" OR "Bab el-Mandeb" oil'
    """
    params = {
        "query": query,
        "mode": "artlist",
        "format": "json",
        "timespan": timespan,
        "maxrecords": str(maxrecords),
        "sort": "datedesc",
    }
    headers = {"User-Agent": USER_AGENT}
    async with httpx.AsyncClient(timeout=20.0) as client:
        resp = await client.get(GDELT_DOC_URL, params=params, headers=headers)
        resp.raise_for_status()
        data = resp.json()
    return data.get("articles", [])
```

**Signal extraction from GDELT results (feeds risk-scoring §5 of Execution Plan):**
- `article_volume_zscore`: count of articles in the last 24h vs. a 30-day rolling baseline count
  for the same query — computed in `app/scoring/gdelt_signals.py`, stored per corridor.
- GDELT's DOC 2.0 API does not return a per-article Goldstein score directly (that lives in the
  Events table, a heavier, separate dataset) — **this project uses article-volume z-score and
  keyword-tag presence as its GDELT signal, not a fabricated "Goldstein severity" number.** If
  §5's formula in the Execution Plan references `goldstein_severity`, treat that as an aspirational
  Tier-2 stretch (via the separate GDELT Events 2.0 CSV export) and default to volume z-score for
  Tier 1 — **update Execution Plan §5's formula to match this reality before Phase 4 starts**, per
  Agent Execution Rules §2B (schema/formula changes are a stop-and-ask, not a silent substitution).

---

## 3. EIA Open Data API v2 — exact request shape, verified 14 July 2026

- **Registration:** free API key at `eia.gov/opendata` — instant, email-based, no card.
- **Auth:** `api_key` passed as a URL query parameter on every request.
- **Base route used:** `/v2/petroleum/move/wkly/data/` (weekly petroleum movements) for U.S.
  reference/comparison series, plus `/v2/crude-oil-imports/` where India-specific series exist.
  **Verify the exact facet values for "India" as a `originName`/`destinationName` facet before
  Phase 2 starts — EIA's own import series is U.S.-import-centric; India-specific volume/price
  series are more reliably sourced from PPAC's public statistics (Part 3 of the FINAL_ALIGNED
  dossier) than forced into an EIA route that wasn't built for it.** Use EIA specifically for
  **global Brent/WTI price series** (`/v2/petroleum/pri/spt/data/`, spot prices) — that part of
  the brief ("price volatility" signal, §5) is genuinely EIA's strength and is a real, clean,
  free, no-scraping data source.
- **Paging:** max 5,000 rows per request; use `offset` to page beyond that (irrelevant at this
  project's query volume, but note it in code comments so the pattern is documented).
- **Abuse protection:** sustained high-frequency polling can trigger a temporary automatic key
  suspension — poll price data at most hourly, which is already far more frequent than Brent/WTI
  spot prices meaningfully change intraday for this use case.

```python
# app/ingestion/eia.py
import httpx
import os

EIA_BASE = "https://api.eia.gov/v2"
EIA_API_KEY = os.environ["EIA_API_KEY"]

async def fetch_brent_spot_price(days_back: int = 7) -> list[dict]:
    url = f"{EIA_BASE}/petroleum/pri/spt/data/"
    params = {
        "api_key": EIA_API_KEY,
        "frequency": "daily",
        "data[0]": "value",
        "facets[series][]": "RBRTE",   # Brent spot price series ID — verify against EIA's series browser
        "sort[0][column]": "period",
        "sort[0][direction]": "desc",
        "length": str(days_back),
    }
    async with httpx.AsyncClient(timeout=20.0) as client:
        resp = await client.get(url, params=params)
        resp.raise_for_status()
    return resp.json()["response"]["data"]
```

**Action item flagged, not silently resolved:** the exact `facets[series][]` code for Brent
(`RBRTE`) must be confirmed against EIA's live series browser at build time before Phase 2 —
series IDs are stable but must be verified once, not assumed from this document alone.

---

## 4. AISstream.io — exact WebSocket protocol, verified 14 July 2026, including a live risk

- **Endpoint:** `wss://stream.aisstream.io/v0/stream`
- **Auth:** free API key, sign-up at aisstream.io — sent inside the first subscription message,
  not as a header.
- **Protocol:** connect, then **send the subscription message within ~3 seconds** or the server
  closes the socket. The subscription message shape:

```python
# app/ingestion/ais.py
import asyncio, json, os
import websockets

AISSTREAM_URL = "wss://stream.aisstream.io/v0/stream"
AISSTREAM_API_KEY = os.environ["AISSTREAM_API_KEY"]

HORMUZ_BBOX = [[[24.5, 55.0], [27.5, 57.5]]]           # [[lat_min, lon_min], [lat_max, lon_max]]
JAMNAGAR_VADINAR_BBOX = [[[21.9, 69.0], [22.7, 70.2]]]

async def stream_ais(bounding_boxes: list, on_message) -> None:
    async with websockets.connect(AISSTREAM_URL) as ws:
        subscribe_msg = {
            "APIKey": AISSTREAM_API_KEY,
            "BoundingBoxes": bounding_boxes,
            "FilterMessageTypes": ["PositionReport"],
        }
        await ws.send(json.dumps(subscribe_msg))
        async for raw in ws:
            msg = json.loads(raw)
            await on_message(msg)
```

- **DOCUMENTED, DATED RISK — must not be silently treated as "our bug":** GitHub issue
  `aisstream/aisstream#15`, opened 13 March 2026, titled "WebSocket connects and subscription is
  accepted, but zero AIS messages are delivered," is an open, real, current reliability report
  against this exact API. This is why Execution Plan §9 Phase 3's done-condition requires proof
  of at least one real message within a bounded test window across **three separate connection
  attempts**, and why the golden-fallback snapshot (Execution Plan §10) exists as a first-class,
  planned artifact — not an emergency patch.
- **Reconnect logic (required, not optional):** wrap the `async with websockets.connect(...)` in
  a retry loop with exponential backoff (start 5s, cap 60s) — AIS WebSocket connections drop
  periodically under normal operation, independent of the #15 issue above.
- **Storage cadence:** do not persist every raw position report (volume is high in a busy
  corridor); aggregate to a **vessel-count snapshot per bounding box every 5 minutes**, written
  to `ais_snapshots` (Execution Plan §6 schema) — this matches what the Digital Twin screen
  actually needs to show (a live density indicator, not a raw feed replay).

---

## 5. OFAC SDN list — static/periodic ingestion

- **Source:** `https://sanctionslist.ofac.treas.gov/api/PublicationPreview/exports/SDN.CSV` (or
  the XML equivalent) — public, no auth.
- **Cadence:** this is not a live feed; pull once daily via APScheduler, diff against the
  previous day's snapshot, and flag new Iran-linked (`Program: IRAN`) entries as the
  `sanctions_event_flag` binary signal in the risk-scoring formula (Execution Plan §5).
- **Storage:** store only the diff count and the program tag, not the full SDN list, in
  `risk_scores.component_sanctions_flag` — the full list is large and not otherwise needed by
  the UI.

---

## 6. LLM integration — Gemini 2.5 Flash-Lite primary, Groq fallback, verified 14 July 2026

Both providers offer genuinely free, no-card-required developer tiers as of this date, but the
**exact numbers move often enough that this project treats them as directional, not load-bearing
for capacity planning** — Urja Kavach's actual LLM call volume (one narrative generation per
scenario run, on demand, not per-second) sits so far under either provider's daily cap that the
precise RPD number barely matters; what matters is having a real fallback path.

| Provider / model | Verified free-tier shape (mid-2026) | Role |
|---|---|---|
| Google Gemini 2.5 Flash-Lite | Roughly 15 RPM / ~1,000–1,500 RPD / 250K TPM on the free tier — Google's own docs state these numbers are not guaranteed and vary by project/region, so treat any specific figure as a snapshot, not a contract | Primary |
| Groq `llama-3.1-8b-instant` | Roughly 30 RPM / ~14,400 RPD / 6,000 TPM on the free tier (org-level, not per-key) — again a snapshot, verify live via response headers at build time | Fallback on Gemini 429 or timeout |

**"Context shell" pattern (per FINAL_ALIGNED_DOSSIER §5) — exact implementation:**

```python
# app/llm/narrative.py
import os, httpx, json

GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent"
GEMINI_KEY = os.environ["GEMINI_API_KEY"]
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_KEY = os.environ["GROQ_API_KEY"]

def build_context_shell(risk_score_row: dict, scenario_run: dict | None) -> str:
    """Embeds structured, real numbers into a template BEFORE the LLM call —
    the LLM narrates given data, it does not invent data."""
    lines = [
        f"Corridor: {risk_score_row['corridor']}",
        f"Current risk score (0-100): {risk_score_row['score']:.1f}",
        f"GDELT article-volume signal: {risk_score_row['component_gdelt_volume']:.2f}",
        f"Price volatility signal: {risk_score_row['component_price_volatility']:.2f}",
        f"AIS transit deviation signal: {risk_score_row['component_ais_deviation']:.2f}",
        f"Sanctions flag: {risk_score_row['component_sanctions_flag']}",
    ]
    if scenario_run:
        lines += [
            f"Active scenario: {scenario_run['scenario_id']} at "
            f"{scenario_run['capacity_available_pct']:.0f}% corridor capacity available",
            f"Projected import volume change: {scenario_run['projected_import_volume_change_pct']:.1f}%",
            f"Projected SPR days-of-cover: {scenario_run['projected_spr_days_cover']:.1f}",
        ]
    data_block = "\n".join(lines)
    return (
        "You are a control-room briefing assistant for India's Ministry of Petroleum & Natural "
        "Gas (prototype demo, not a real government system). Using ONLY the structured data "
        "below, write a 3-4 sentence plain-language risk briefing. Do not invent any number not "
        "present below. Cite the data as 'current signals' plainly.\n\n"
        f"{data_block}"
    )

async def generate_narrative(prompt: str) -> str:
    try:
        return await _call_gemini(prompt)
    except (httpx.HTTPStatusError, httpx.TimeoutException):
        return await _call_groq(prompt)

async def _call_gemini(prompt: str) -> str:
    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.post(
            f"{GEMINI_URL}?key={GEMINI_KEY}",
            json={"contents": [{"parts": [{"text": prompt}]}]},
        )
        resp.raise_for_status()
        data = resp.json()
    return data["candidates"][0]["content"]["parts"][0]["text"]

async def _call_groq(prompt: str) -> str:
    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.post(
            GROQ_URL,
            headers={"Authorization": f"Bearer {GROQ_KEY}"},
            json={
                "model": "llama-3.1-8b-instant",
                "messages": [{"role": "user", "content": prompt}],
            },
        )
        resp.raise_for_status()
        data = resp.json()
    return data["choices"][0]["message"]["content"]
```

**Verification done-condition (per Execution Plan §9 Phase 8):** deliberately change the
underlying `risk_score_row` values and confirm the returned narrative text changes to match —
this is the concrete test that the context-shell pattern is real, not a canned string.

---

## 7. NetworkX risk-propagation model — the "Knowledge Graph" requirement, honestly implemented

Per FINAL_ALIGNED_DOSSIER Part 4.5: build the graph directly from the real `nodes`/`edges` seed
data (Execution Plan §6), and implement a transparent risk-propagation calculation — not a
trained GNN.

```python
# app/graph/propagation.py
import networkx as nx

def build_graph(nodes: list[dict], edges: list[dict]) -> nx.DiGraph:
    g = nx.DiGraph()
    for n in nodes:
        g.add_node(n["id"], **n)
    for e in edges:
        g.add_edge(e["from_node_id"], e["to_node_id"], **e)
    return g

def propagate_risk(g: nx.DiGraph, corridor_risk: dict[str, float], decay: float = 0.6) -> dict[str, float]:
    """
    Simple, explainable propagation: a node's derived risk is the max of its own
    directly-connected corridor risk and (decay * the risk of any upstream node feeding it).
    This is deliberately NOT a trained model — it is one BFS pass over real edges, and its
    logic must be stateable in one sentence in the demo: 'risk flows downstream from a
    disrupted corridor to the ports and refineries that depend on it, discounted by distance
    in the graph.'
    """
    node_risk = {n: 0.0 for n in g.nodes}
    for node_id, risk in corridor_risk.items():
        if node_id in node_risk:
            node_risk[node_id] = risk
    for source, risk in corridor_risk.items():
        if source not in g:
            continue
        for depth, layer in enumerate(nx.bfs_layers(g, source), start=1):
            propagated = risk * (decay ** depth)
            for n in layer:
                node_risk[n] = max(node_risk[n], propagated)
    return node_risk
```

This is what powers the "watch the graph visibly re-route/re-score in real time" interactive
demo centerpiece described in the FINAL_ALIGNED_DOSSIER — the scenario slider changes
`corridor_risk['hormuz']`, and the frontend re-renders node colors from the recomputed
`node_risk` dict.

---

## 8. Repository structure

```
urja-kavach/
├── docker-compose.yml
├── .env.example
├── data/
│   └── india_energy_nodes.json         # static seed: SPR/refinery/port/pipeline nodes+edges
├── api/
│   ├── Dockerfile
│   ├── pyproject.toml
│   ├── alembic/
│   ├── app/
│   │   ├── main.py                     # FastAPI app, route registration
│   │   ├── db/
│   │   │   ├── models.py               # SQLAlchemy models, matches Execution Plan §6
│   │   │   └── session.py
│   │   ├── ingestion/
│   │   │   ├── gdelt.py
│   │   │   ├── eia.py
│   │   │   ├── ais.py
│   │   │   └── ofac.py
│   │   ├── scoring/
│   │   │   ├── gdelt_signals.py
│   │   │   ├── risk_score.py           # §5 weighted formula
│   │   │   └── scenario.py             # Hormuz partial-closure cascading logic
│   │   ├── graph/
│   │   │   └── propagation.py
│   │   ├── llm/
│   │   │   └── narrative.py
│   │   ├── scheduler.py                # APScheduler job registration
│   │   └── routes/
│   │       ├── dashboard.py
│   │       ├── twin.py
│   │       ├── scenario.py
│   │       └── narrative.py
│   └── tests/
├── web/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── screens/                     # 0-Landing, 1-Dashboard, 2-Twin, 3-Scenario, 4-Narrative...
│       ├── components/
│       └── lib/api.ts
└── HANDOFF.md
```

---

## 9. `docker-compose.yml` — the whole local stack

```yaml
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_USER: urjakavach
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: urjakavach
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  api:
    build: ./api
    env_file: .env
    depends_on:
      - postgres
    ports:
      - "8000:8000"
    volumes:
      - ./data:/app/data:ro

  web:
    build: ./web
    env_file: .env
    depends_on:
      - api
    ports:
      - "5173:5173"

volumes:
  pgdata:
```

---

## 10. Environment variables

```bash
# .env.example — commit this, never the real .env
POSTGRES_PASSWORD=

EIA_API_KEY=
AISSTREAM_API_KEY=
GEMINI_API_KEY=
GROQ_API_KEY=

# All four are free-tier signups, no card required for any, verified 14 July 2026:
#   EIA        -> eia.gov/opendata
#   AISstream  -> aisstream.io
#   Gemini     -> aistudio.google.com (create API key)
#   Groq       -> console.groq.com
```

---

## 11. Testing architecture

Given the 8-day window, tests are **targeted at the parts most likely to silently lie** — the
scoring formula and the graph propagation, not UI snapshot tests.

```python
# api/tests/test_risk_score.py
def test_weights_sum_to_one():
    from app.scoring.risk_score import DEFAULT_WEIGHTS
    assert abs(sum(DEFAULT_WEIGHTS.values()) - 1.0) < 1e-6

def test_propagation_decays_with_distance():
    from app.graph.propagation import build_graph, propagate_risk
    nodes = [{"id": "hormuz"}, {"id": "port_a"}, {"id": "refinery_b"}]
    edges = [
        {"from_node_id": "hormuz", "to_node_id": "port_a"},
        {"from_node_id": "port_a", "to_node_id": "refinery_b"},
    ]
    g = build_graph(nodes, edges)
    result = propagate_risk(g, {"hormuz": 100.0}, decay=0.6)
    assert result["port_a"] > result["refinery_b"] > 0
```

---

## 12. First 20 minutes — exact commands

```bash
# 1. Repo + env
git init urja-kavach && cd urja-kavach
cp .env.example .env
# fill in POSTGRES_PASSWORD (any string), EIA_API_KEY, AISSTREAM_API_KEY, GEMINI_API_KEY,
# GROQ_API_KEY — all four free-tier signups, no card, verified 14 July 2026

# 2. Seed data
mkdir -p data
# paste the india_energy_nodes.json node/edge list (from FINAL_ALIGNED_DOSSIER Part 3) here

# 3. Backend scaffold
cd api && python -m venv .venv && source .venv/bin/activate
pip install fastapi uvicorn sqlalchemy asyncpg alembic apscheduler httpx websockets networkx
cd ..

# 4. Frontend scaffold
npm create vite@latest web -- --template react-ts
cd web && npm install react-leaflet leaflet recharts && cd ..

# 5. First boot
docker compose up --build
# confirm: postgres healthy, api on :8000/docs (FastAPI auto-swagger), web on :5173
```

---

## 13. Summary — what this document locks in, so it's never re-litigated mid-build

- Backend is Python/FastAPI, not Node — because the domain is data pipelines and graph math.
- Mapping is Leaflet, not deck.gl — because the node/vessel count doesn't need WebGL.
- GDELT's actual usable signal is article-volume z-score, not a fabricated Goldstein score —
  Execution Plan §5's formula must be reconciled with this before Phase 4 (flagged, not silently
  patched).
- EIA is used for Brent/WTI price data specifically, not forced into an India-import route that
  wasn't built for it.
- AISstream.io's documented reliability issue is treated as a known, planned-around risk with a
  golden-fallback snapshot, not a surprise to react to on demo day.
- The "knowledge graph" requirement is satisfied with one real NetworkX BFS-decay propagation
  function over real data — stated as exactly that in the deck, not oversold as a GNN.
