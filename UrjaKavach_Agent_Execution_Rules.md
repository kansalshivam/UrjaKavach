# Urja Kavach — Agent Execution Rules
### Binding operating contract for any autonomous coding agent implementing this project
### Authority: `UrjaKavach_Execution_Plan.md`, `UrjaKavach_Architecture_Plan.md`, `UrjaKavach_HLD_LLD.md` — nothing else
**Prepared 14 July 2026 · ET AI Hackathon 2026, Problem Statement #2**

---

## 0. AUTHORITY AND SCOPE

This document governs any coding agent (autonomous or human-directed) building Urja Kavach. Its
authority comes strictly from the three companion documents named above, in that priority order
when they conflict: HLD/LLD's module-level design corrections (e.g. its §2.5 risk-scoring
correction) override the Execution Plan's original text on that specific point; the Architecture
Plan's exact library/API choices override any agent preference; nothing outside these three
documents — not the agent's own training-data defaults, not a "better idea" mid-build — changes
scope without going through §3 below. The FINAL_ALIGNED_DOSSIER research document is treated as
ground-truth *data*, not a build authority; it informs the numbers, not the architecture.

---

## 1. TASK GRANULARITY — LOCKED TO THE EXECUTION PLAN §9 PHASE TABLE, NOTHING FINER

The agent works one phase at a time, in the order listed in Execution Plan §9. A phase is not
"started" until its prior phase's done-condition is verified (not just completed — verified, per
that phase's own verification method). The agent does not:
- Jump ahead to a later phase because it looks easier or more interesting.
- Silently merge two phases to save time — if merging seems genuinely correct, that is a §2B
  stop-and-ask, not a unilateral call.
- Add a phase not in §9's table, including "polish" phases, without the same stop-and-ask.

---

## 2. DECISION AUTHORITY MATRIX

### 2A. Decide silently, log one line in `BUILD_LOG.md`, proceed — never escalate these

- Exact variable/function names, as long as they're consistent with the LLD's described shapes.
- Which specific Tailwind utility classes to use for a given visual effect described in
  HLD/LLD §2.12.
- Minor library-version pinning (e.g. exact patch version of `httpx`), as long as the major
  API surface used matches what's shown in Architecture Plan code samples.
- Order of unrelated files within a single phase's implementation, as long as the phase's overall
  done-condition is still met at the end.
- Adding defensive error handling (try/except, timeouts) beyond what's shown in the reference
  code snippets, as long as it doesn't change the documented data flow.

### 2B. Stop and ask — and only for these

- Any change to the Postgres schema in Execution Plan §6 or its corrected form in HLD/LLD.
- Any change to the risk-scoring formula's weights or component set (Execution Plan §5,
  corrected in HLD/LLD §2.5) — including the already-flagged Goldstein→volume-zscore
  correction, which must be explicitly confirmed with the person before Phase 4 starts, not
  silently assumed resolved by this document alone.
- Substituting a different data source or library than the one named in the Architecture Plan
  (e.g. switching AISstream.io for a different AIS provider, or deck.gl for Leaflet) — even if
  the substitute seems technically superior.
- Any discovery that a named API route, series ID, or bounding-box format in the Architecture
  Plan (e.g. §3's `RBRTE` Brent series facet, still flagged there as unverified-at-time-of-writing)
  does not work as documented once actually queried live.
- Any Tier reassignment — moving something from Tier 2 to Tier 1 or vice versa (Execution Plan §4).
- Any deviation from the 8-day phase timeline that would require dropping a Tier-1 item.

### 2C. What "stop and ask" means in practice

The agent pauses that specific line of work, writes the open question plainly into
`HANDOFF.md` under a `## OPEN QUESTIONS` heading (see §11), and either waits for the person's
next message or — if genuinely blocking further progress on the *current* phase — moves to a
different, unblocked task within the *same* phase while flagging the block clearly. It does not
guess and proceed silently on a 2B-category item, even under time pressure.

---

## 3. ESCALATION PROTOCOL — WHEN §2B GENUINELY APPLIES

When escalating, state: (1) exactly which document and section the ambiguity or conflict is in,
(2) the two or more concrete options being considered, (3) which one the agent would pick by
default and why, (4) what happens to the current phase's timeline if the answer takes more than
one exchange to resolve. A vague "should I do X or Y?" without this structure is not an adequate
escalation.

---

## 4. SCHEMA LOCK

The Postgres schema in Execution Plan §6 is locked as of this document's writing. The one
already-known pending correction — GDELT's Goldstein-severity term needing to become an
article-volume-zscore term — is the **only** pre-approved schema-adjacent change; even this one
must be confirmed, not assumed, before Phase 4 (per §2B above). No other schema change proceeds
without an explicit go-ahead, including ones that seem like obvious improvements (e.g. adding an
index, adding a column for "future use") — additive changes still require sign-off because they
change what Phase 1's done-condition ("nodes table populated, matches dossier §3 node count")
means to verify against.

---

## 5. TIER DISCIPLINE

Tier 1 (Execution Plan §4) must be fully real and passing its own phase done-conditions before
any Tier 2 work begins — this is enforced literally, not as a soft preference. If Day 6 of the
8-day sprint arrives and any Tier 1 phase is not yet verified-done, the agent does not start
Tier 2 work "in parallel to be safe" — it reports the schedule risk plainly and asks whether to
compress remaining Tier 1 scope (2B) or accept a smaller Tier 1. Tier 3 items (Execution Plan §4)
are never built, never stubbed, and never referenced in UI copy, deck text, or demo narration —
if the agent notices any in-progress work drifting toward a Tier 3 item (e.g. starting to build
multi-user auth "just in case"), it stops immediately and flags this as a rules violation risk,
not a minor detour.

---

## 6. ARCHITECTURE LOCK

The stack named in Architecture Plan §1 is final: Python/FastAPI backend, React/Vite/Tailwind
frontend, Leaflet (not deck.gl) for mapping, Postgres, APScheduler (not Celery/Redis), NetworkX
(not a trained GNN). An agent discovering a technical reason one of these doesn't work
(e.g. Leaflet rendering issues with a specific tile provider) fixes the *symptom* (try a
different free tile provider) before considering the *architecture* a candidate for change, and
any actual architecture change is a §2B item regardless of how clearly better the alternative
seems.

---

## 7. DOCUMENTATION DISCIPLINE

- Every ingestion module (Architecture Plan §2–5) must log, in `BUILD_LOG.md`, the exact first
  real response it received from its external source (a real GDELT article title, a real EIA
  price point, a real AIS position, a real OFAC diff count) — this is what Execution Plan §9's
  verification steps for Phases 2–3 actually check against, and it must exist as a durable
  artifact, not just something the agent claims to have seen once in a terminal.
- Every deviation from a documented code sample (Architecture Plan §2, §3, §4, §6, §7) — even a
  2A-category one — gets one line in `BUILD_LOG.md` stating what changed and why.
- `HANDOFF.md` is updated per §11 below, not treated as optional overhead.

---

## 8. TOKEN AND TIME DISCIPLINE

Given the 8-day window (Execution Plan §0), the agent does not spend cycles gold-plating a
Tier-1 module past its stated done-condition before moving to the next phase — "it works and
passes its verification" is the bar, not "it's maximally elegant." Time saved this way is
explicitly meant to fund Tier 2 (§9 Phase 9) or the golden-fallback/demo-rehearsal buffer
(§9 Phases 11), not to be silently reinvested into further polishing an already-done phase.

---

## 9. DEFINITION OF DONE

A phase is done when, and only when, its Execution Plan §9 "Done-condition" is true **and** its
"Verification" step has actually been performed and its result recorded in `BUILD_LOG.md` — not
when the code merely appears to implement the feature. For modules with a state machine defined
in HLD/LLD §2 (e.g. AISstream's `FLAG_RISK_KNOWN_ISSUE` state, the LLM narrative's
`RETURN_STATIC_FALLBACK_TEXT` state), "done" additionally requires that every named state in that
machine has been manually triggered at least once during testing, not just the happy path.

---

## 10. WHAT THIS RULES OUT, STATED PLAINLY

- Presenting a Tier 2 or Tier 3 feature as built when it is a stub or mock — an explicit,
  named failure pattern from the AgriBloom-Agentic-ET2026 audit already informing this project
  (Execution Plan §1, §7).
- Presenting the risk score, AIS overlay, or scenario projection as "live" anywhere in the UI
  if the actual refresh cadence is 10 minutes, 60 seconds, or on-demand — the true cadence is
  stated in the UI itself (Execution Plan §4's Tier 3 exclusion list, HLD/LLD §5).
  claiming an untrained NetworkX propagation function is a "trained model" or "AI-powered
  knowledge graph" in any deck, demo narration, or code comment beyond what Architecture Plan §7
  and HLD/LLD §2.6 actually describe.
- Hardcoded API keys or secrets committed to the repository, in any commit, at any point —
  `.env.example` ships with empty values only, per Architecture Plan §10.
- Silent fallback substitution (e.g. quietly serving golden/fallback AIS data as if live) without
  the demo narration explicitly saying so, per Execution Plan §10's runbook.

---

## 11. HANDOFF MAINTENANCE — BINDING, NOT OPTIONAL

### 11A. What `HANDOFF.md` is, and how it differs from `BUILD_LOG.md`

`BUILD_LOG.md` is an append-only, chronological technical log (what was built, what deviated
from spec and why, what real data was observed). `HANDOFF.md` is a living, overwritten-in-place
summary of **current state** — what phase is active, what's blocked, what's open, what the very
next action is — written so that a person (or a different agent) picking this project up cold
can resume work within five minutes of reading it.

### 11B. Mandatory update triggers — the agent updates `HANDOFF.md` at every one of these

- Start and completion of every phase in Execution Plan §9.
- Every §2B escalation raised (added to `## OPEN QUESTIONS`, removed once resolved).
- Any time a documented risk fires for real (e.g. AISstream's known issue actually manifesting,
  a GDELT/EIA rate limit actually being hit) — logged with a timestamp and what was done about it.
- End of every work session, regardless of phase completion state.

### 11C. "Extremely detailed" is a concrete, checkable bar — not a vague instruction

A `HANDOFF.md` update is adequate only if a reader with zero prior context on this specific
session could, from reading it alone: (1) name the current phase and its done-condition,
(2) run the exact next command or open the exact next file to resume work, (3) know which of the
four external APIs (GDELT/EIA/AISstream/OFAC/LLM) have been confirmed live vs. still unverified
in this environment, (4) see every currently open §2B question, unresolved.

### 11D. Enforcement

An agent ending a work session without a `HANDOFF.md` update meeting the §11C bar has not
completed its task for that session, regardless of how much code was written — code without a
resumable handoff is, for this project's 8-day constraint, not meaningfully different from code
that doesn't exist yet, because the next session's first hour would otherwise be spent
re-discovering state that should have been written down.
