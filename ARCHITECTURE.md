# Urja Kavach — Data Ingestion & LLM Provider Architecture Strategy

This document records the selected architectural tiers for external data dependencies and LLM models.

---

## 1. External Data Sources Strategy

### 1.1 GDELT (Geopolitical Event Ingest)
*   **Selected Tier:** Tier A (Stay free / keyless DOC 2.0 API).
*   **Reasoning:** Tier A was chosen for GDELT because there is no current budget allocated for a GDELT Cloud contract. The local fallback degradation path is fully tested and honestly labeled in the database and audit trail, which is judged sufficient for the current deployment scope.
*   **Operational Assumptions:**
    *   The database schema includes `is_synthetic` boolean flags and `domain` tracking fields to clearly mark fallback content (labeled with `domain = 'golden-fallback.internal'` and `is_synthetic = True`).
    *   > [!WARNING]
        > The operational assumption that a 15-minute scheduled poll interval will successfully bypass GDELT's keyless rate-limiting cooldown window is an **untested hypothesis**. Live ingestion success has never been directly observed in the sandbox test environment due to local SSL handshake connection timeouts. It is critical to verify that outbound network egress to `api.gdeltproject.org` is completely open on the production deployment host before relying on live feed updates.

### 1.2 AIS (Vessel Tracking Ingest)
*   **Selected Tier:** Tier A (Stay free / keyless websockets stream).
*   **Reasoning:** Tier A was chosen for AIS because no budget is currently available for SLA-backed paid vessel APIs (such as Datalastic at €99/month or VesselAPI). Real-time vessel counts are best-effort, and the custom `AisKnownIssueFlagged` parser successfully handles any token rejection errors (e.g. issues #15 and #174) by flagging the data stale and degrading gracefully.
*   **Known Tradeoffs & Hardcoded Exclusion List:**
    *   To prevent false anomaly alerts in regions where the keyless/free tier of the AISstream websocket structurally lacks coverage (Persian Gulf/Hormuz, West Africa, and De Kastri/Russia), the engine hardcodes these specific corridor names as excluded from deviation scoring.
    *   This is a pragmatic design choice, but it introduces a static maintenance dependency. If the free-tier provider ever expands geographical coverage to these regions, the code must be manually modified in `app/scoring/risk_score.py` to remove them from the `is_uncovered_corridor` check, otherwise the engine will continue to exclude them from calculations.

### 1.3 EIA (Petroleum Spot Price Ingest)
*   **Selected Tier:** Tier A (EIA Open Data API v2).
*   **Reasoning:** Daily spot prices are low-velocity data. The v2 endpoint's query parameters are configured with the active Europe Brent series facet (`series = 'RBRTE'`), which has been verified live and cached.

### 1.4 LLM Narrative & RAG Fallbacks
*   **Selected Tier:** Double provider chain (Google Gemini client falling back to Groq LLaMA).
*   **Reasoning:** Since model availability is dynamic, the application supports two concurrent providers.
*   **Operational Assumptions:**
    *   Configured models:
        *   Google Gemini: `gemini-3.1-flash-lite`
        *   Groq: `openai/gpt-oss-120b` (Narrative) and `openai/gpt-oss-20b` (RAG)
    *   A daily health script (`app/llm/model_health.py`) queries the live endpoints (`/v1beta/models` and `/v1/models`), verifying configured strings are active. Warnings are fired to `ALERT_WEBHOOK_URL` if models are retired.

## 2. Stale Signal Exclusion Strategy (Option B)

*   **Selected Policy:** Option B (Hard Cutoff / Fixed Weights).
*   **Reasoning:** Shipping and price deviation signals represent real-time tactical risk. If the sensor feed goes stale, continuing to report a stale maximum risk value could mislead operators into taking costly supply chain mitigation actions when the underlying risk may have already resolved. Excluding the stale sensor completely and dropping its risk contribution to zero ensures high decision-making integrity.
*   **Operational Assumptions:**
    *   Stale signals are excluded from the risk score calculation (their contribution is set to `0.0`).
    *   **Zero-Baseline Exclusion:** A corridor with no historical vessel count baseline (such as a brand-new corridor) cannot calculate a safe deviation. Instead of silently defaulting to `0.00` deviation (which falsely reads as "genuinely calm" or "no risk"), the engine returns `None` and routes it through the stale/excluded signal path, marking it `EXCLUDED` on the dashboard.
    *   Weights remain fixed (no renormalization). The maximum possible score is capped (reduced by the weight of any currently excluded signal), which is clearly disclosed to operators via a dashboard notice.

## 3. Geopolitical Ingestion Enhancements

### 3.1 GDELT Multilingual Relevance Filtering (Option A)
*   **Selected Policy:** Option A (Native-Script Keyword Lists).
*   **Reasoning:** GDELT's keyless `artlist` query mode does not return Global Knowledge Graph (GKG) theme codes or classification tags in its JSON payload, rendering theme-code based filtering unusable for live polling. Fetching raw GKG zip files is too heavy. Native-script keyword lists for English, Arabic, Farsi, Chinese, and Korean were chosen as a lightweight filter.
*   **Known Tradeoffs:** Any language not in the current list (e.g. Russian, Hindi, Japanese, Vietnamese) will still lose signal if native-script titles are returned, until added by hand.

### 3.2 Russia Corridor Geographic Sourcing
*   **Source Distinction:** The dossier names "Sokol oil" as the tracked signal for the Russia corridor but does not specify a terminal. The De Kastri terminal coordinates (51.0°N to 52.0°N, 140.0°E to 141.5°E) are derived from external, verified real-world knowledge of where Sokol crude is actually loaded and exported from, keeping dossier-sourced and externally-verified facts distinct.

### 3.3 OFAC Corridor-Specific Sanctions
*   **Implementation:** Resolved the sibling hardcoding bug where all corridors evaluated Iranian sanctions counts. Defined corridor-specific program lists:
    *   `hormuz`: Iran programs (`IRAN`, etc.)
    *   `non_hormuz_west_africa`: Yemen and Iran programs (`YEMEN`, `IRAN`, etc.)
    *   `non_hormuz_americas`: Venezuela programs (`VENEZUELA`, etc.)
    *   `non_hormuz_russia`: Russia / Ukraine programs (`RUSSIA`, etc.)
    Daily diff checks are computed independently for each corridor against `sdn_{corridor}_ids.txt` cache snapshots.
*   **Source Distinction:** The aligned dossier does not contain the word "Venezuela" (focusing its Americas corridor details solely on "US and Guyanese crude"). The Venezuela sanctions programs are introduced as a reasonable, real-world proxy to represent crude-oil sanctions volatility in the Western Hemisphere, keeping dossier-sourced facts and externally-verified proxies transparently distinct.

---

## 4. UI Layout & Scaling Strategy

### 4.1 Responsive Width Centering (Max-Width Constraints)
*   **Design Decision:** The top-level screens use deliberate max-width bounds (e.g., `max-w-[1600px]` on the Command Dashboard, `max-w-7xl` on the Landing Page) centered via `mx-auto`.
*   **Reasoning:** Centering content within a maximum width boundary ensures that typography, text lines, and dashboard grids do not stretch to illegible, distorted widths on high-resolution or ultrawide viewports. This maintains premium, balanced proportions across all zoom levels (90%, 100%, 110%).

### 4.2 Independent Sibling Column Scaling (Command Dashboard & Alerts Archive)
*   **Design Decision:** Sibling columns in two-column layouts align at the top (`items-start`) and scale independently.
*   **Reasoning:** If sibling containers are stretched to equal height when one container has less content (e.g., 0 alerts vs. a 600px preview card), it forces the shorter column to render a large empty black container. Allowing each column to size independently based on its contents eliminates visual voids and maintains a clean, structured appearance at all screen widths.

