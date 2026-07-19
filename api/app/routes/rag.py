from fastapi import APIRouter
from pydantic import BaseModel
import os
import httpx
import logging
from typing import List, Dict, Optional

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/rag", tags=["rag"])

class DocumentMetadata(BaseModel):
    id: str
    title: str
    source: str
    date: str
    summary: str

class DocumentDetail(BaseModel):
    id: str
    title: str
    source: str
    date: str
    content: str

class QueryRequest(BaseModel):
    query: str

class QueryResponse(BaseModel):
    answer: str
    retrieved_documents: List[str]

DOCUMENTS = [
    {
        "id": "SYNTH-MODEL-ISPRL-CAPACITY",
        "title": "Reference Specification: Strategic Petroleum Reserves & Caverns",
        "source": "Urja Kavach Reference Data Model",
        "date": "March 12, 2026",
        "summary": "Calibration parameters for ISPRL cavern fill levels, storage capacities, and OMC commercial reserve baselines.",
        "content": "Model Reference: The Indian Strategic Petroleum Reserves Limited (ISPRL) capacity is set to 5.33 Million Metric Tonnes (MMT) across three underground rock cavern facilities: Visakhapatnam (1.33 MMT), Mangaluru (1.50 MMT), and Padur (2.50 MMT). The active fill level is modeled at 63.26% of capacity (~3.372 MMT, or 23,357,267.4 barrels using the cavern-specific conversion rate of 6.926829 bbl/MMT). These caverns correspond to 9.5 days of national consumption cover, and Oil Marketing Companies (OMCs) commercial reserves are set to 64.5 days of storage, yielding a total of 74 days of national cover based on the 5.0M bpd national consumption base."
    },
    {
        "id": "SYNTH-MODEL-REFINERY-DATA",
        "title": "Reference Specification: Refinery Tonnage & Sourcing Composition",
        "source": "Urja Kavach Reference Data Model",
        "date": "February 28, 2026",
        "summary": "Calibration parameters for India's refinery nameplate capacities, sector ownership split, and Jamnagar complex throughput.",
        "content": "Model Reference: India's total refining sector nameplate capacity is set to 251.2 MMTPA. Public sector refiners account for approximately 65% of processed crude. The Reliance Industries Jamnagar complex is modeled with a capacity of 1.24 million bpd (approx 62 MMTPA). Sourcing metrics are modeled with a 15-percentage-point composition shift, representing non-Hormuz sourcing share rising from 55% to 70% to evaluate maritime supply disruption contingencies."
    },
    {
        "id": "SYNTH-MODEL-CONTINGENCY-ROUTING",
        "title": "Reference Specification: Supply Diversification & Absolute Mitigation Offsets",
        "source": "Urja Kavach Reference Data Model",
        "date": "March 5, 2026",
        "summary": "Calibration parameters for contingency import routing via West Africa, US Gulf Coast, and Guyana supply corridors.",
        "content": "Model Reference: Alternative routing contingencies redirect imports through West Africa, the US Gulf Coast, and Guyanese supply corridors. The 15% non-Hormuz sourcing shift is modeled as a fixed absolute volume offset of 660,000 bpd (calculated against the 4.4M bpd import capacity) to evaluate transit shortfalls regardless of the shortfall percentage. Supply lanes are mapped via coordinates from the Information Fusion Centre (IFC-IOR)."
    },
    {
        "id": "SYNTH-MODEL-PHASE2-PLAN",
        "title": "Reference Specification: Planned Caverns Phase II Expansion",
        "source": "Urja Kavach Reference Data Model",
        "date": "July 8, 2021",
        "summary": "Calibration parameters for Phase II SPR expansion: Chandikhole (4.0 MMT, Odisha) and Padur Phase II (2.5 MMT, Karnataka).",
        "content": "Model Reference: Future capacity scenarios model the establishment of additional Strategic Petroleum Reserves (SPR) caverns under Phase II. The expansion includes two planned caverns: a 4.0 MMT facility at Chandikhole in Odisha, and a 2.5 MMT facility at Padur in Karnataka. This adds 6.5 MMT of storage capacity, bringing total strategic reserve capacity to 11.83 MMT to support energy security evaluations aligned with the IEA's 90-day recommended cover target."
    },
    {
        "id": "SYNTH-MODEL-HORMUZ-RISK",
        "title": "Reference Specification: Strait of Hormuz Chokepoint Risk Assessment",
        "source": "Urja Kavach Reference Data Model",
        "date": "March 20, 2026",
        "summary": "Hormuz transit risk parameters, VLCC traffic baselines, and disruption-scenario impact projections on India's crude import volume.",
        "content": "Model Reference: The Strait of Hormuz is the world's most critical oil chokepoint. Approximately 60% of India's crude imports transit this corridor, representing ~2.64 million bpd of the 4.4 million bpd total import base. The navigable channel is 2-3 miles wide in each direction, with an average daily transit of 17-20 Very Large Crude Carriers (VLCCs). A sustained 50% capacity disruption is modeled to reduce India's crude availability by ~1.32 million bpd, triggering emergency SPR drawdown at approximately 139,000 metric tonnes per day. The IRGC (Islamic Revolutionary Guard Corps) seizure risk is modeled as a binary trigger correlated with GDELT news volume z-scores above 2.0. Primary naval chokepoint coordinates: 26.57N, 56.45E. The corridor risk weight in Urja Kavach is 0.35 for GDELT news volume, 0.30 for AIS vessel deviation, 0.25 for Brent price volatility, and 0.10 for OFAC sanctions flag."
    },
    {
        "id": "SYNTH-MODEL-IMPORT-MATRIX",
        "title": "Reference Specification: India Crude Oil Import Dependency Matrix",
        "source": "Urja Kavach Reference Data Model",
        "date": "April 1, 2026",
        "summary": "India's crude import composition by corridor, refinery grade compatibility matrix, and diversification targets.",
        "content": "Model Reference: India's crude import matrix is modeled with a total import volume of 4.4 million bpd. Source composition by corridor: Hormuz corridor (Iraq, Saudi Arabia, UAE, Kuwait): 60% or 2.64 million bpd; West Africa (Nigeria, Angola): 12% or 528,000 bpd; Americas (US Gulf Coast, Guyana, Mexico): 9% or 396,000 bpd; Russia (Sokol, Urals, ESPO): 15% or 660,000 bpd; Others: 4% or 176,000 bpd. Jamnagar complex (Reliance) processes predominantly medium-sour grades (API 28-34, Sulfur 1.8-2.5%) aligned with Basra Medium and Arab Heavy benchmarks. IOC Panipat and Mathura refineries require sweet grades for full utilization. The national diversification target is to shift the Hormuz share from 60% to 45% within 18 months of a sustained risk event."
    },
    {
        "id": "SYNTH-MODEL-CAPE-REROUTING",
        "title": "Reference Specification: Cape of Good Hope Contingency Routing Analysis",
        "source": "Urja Kavach Reference Data Model",
        "date": "March 28, 2026",
        "summary": "Cape of Good Hope contingency routing parameters including transit time, distance, and additional voyage cost estimates.",
        "content": "Model Reference: If the Strait of Hormuz is blocked, tankers from Middle Eastern terminals (Ras Tanura, Fujairah) must reroute via the Cape of Good Hope, adding approximately 6,000-6,500 nautical miles and 10-14 transit days per voyage. This rerouting reduces delivered volume capacity by 20-25% due to extended vessel turnaround time. The Cape route is modeled as available at 100% capacity with no chokepoint restriction. The additional transit cost is modeled at USD 1.2-1.8 million per voyage (bunker and hire combined). Bab el-Mandeb closure forces combined Cape plus West Africa rerouting, compounding transit costs to USD 2.1-2.7 million per voyage. The IFC-IOR (Information Fusion Centre Indian Ocean Region) coordinates vessel tracking for the Cape corridor."
    },
    {
        "id": "SYNTH-MODEL-RUSSIA-OFAC",
        "title": "Reference Specification: Russia Sokol & Urals Crude Sanctions Impact Analysis",
        "source": "Urja Kavach Reference Data Model",
        "date": "March 15, 2026",
        "summary": "OFAC sanctions impact parameters for Russia corridor, shadow fleet composition, and reallocation volume offsets.",
        "content": "Model Reference: Russia's crude exports to India are modeled under active OFAC secondary sanctions risk. The primary Russian grades are Sokol (East Siberian, API 37, sulfur 0.19%) and Urals (API 31, sulfur 1.55%). Indian imports of Russian crude are modeled at 660,000 bpd which is 15% of total imports. The shadow fleet of approximately 300-400 non-G7 flagged tankers facilitates the majority of this trade. OFAC SDN list additions targeting vessel operators, insurance providers, or trading entities constitute a binary sanctions flag trigger in the Urja Kavach risk scoring model. A scenario with full OFAC enforcement blocking Indian bank payments is modeled as reducing Russian corridor capacity to zero, requiring immediate 660,000 bpd reallocation: West Africa plus 330,000 bpd and Americas plus 330,000 bpd, increasing SPR drawdown pressure by approximately 3.5 days per month."
    },
    {
        "id": "SYNTH-MODEL-AIS-METHODOLOGY",
        "title": "Reference Specification: AIS Vessel Tracking Methodology & Deviation Scoring",
        "source": "Urja Kavach Reference Data Model",
        "date": "March 22, 2026",
        "summary": "AIS deviation scoring methodology, vessel count baselines, and bounding box definitions for Hormuz and Jamnagar monitoring zones.",
        "content": "Model Reference: The AIS (Automatic Identification System) deviation component tracks vessel counts within defined geographic bounding boxes. The Strait of Hormuz bounding box is defined as 24.0N-27.5N, 55.5E-58.0E. The 30-day baseline average vessel count is computed from historical AIS snapshots stored in the database. A current-to-baseline ratio below 1.0 indicates reduced transit activity and contributes positively to the risk score using the formula: AIS_deviation = max(0, 1 minus current_count divided by baseline_count). Baseline vessel counts for the Hormuz bounding box are modeled at 85-100 vessels in normal operating conditions, dropping to 40-60 during moderate tension events and below 30 in severe disruption scenarios. The AIS risk weight in the composite index is 0.30, making it the second largest contributor after GDELT news volume at 0.35. The Jamnagar and Vadinar bounding box covers 22.0N-23.2N, 69.5E-70.8E, monitoring inbound crude tanker density at India's primary import port cluster."
    },
    {
        "id": "SYNTH-MODEL-SPR-PROTOCOL",
        "title": "Reference Specification: SPR Emergency Drawdown Protocol & Autonomy Calculations",
        "source": "Urja Kavach Reference Data Model",
        "date": "April 5, 2026",
        "summary": "ISPRL emergency drawdown protocol tiers, maximum release rates, national autonomy calculations, and corridor replenishment lead times.",
        "content": "Model Reference: The ISPRL emergency drawdown protocol is modeled in three trigger tiers: Tier 1 (risk score 60-79) triggers advisory alert and pre-positions procurement alternatives; Tier 2 (score 80-89) activates OMC commercial reserve drawdown with 64.5 days available; Tier 3 (score 90-100) authorizes ISPRL strategic cavern release. Maximum strategic cavern release rate is modeled at 200,000 bpd across all three ISPRL facilities combined. At a national consumption of 5.0 million bpd and current ISPRL fill level of 63.26% equaling 3.372 MMT or approximately 23.36 million barrels, the strategic reserve provides approximately 4.67 days of cover at maximum drawdown rate. Combined with OMC commercial reserves providing 64.5 days, total national autonomy is modeled at 69.17 days under a zero-import scenario. Replenishment lead time after drawdown is modeled at 21-30 days for the West Africa corridor and 14-21 days for the Americas corridor."
    }
]

@router.get("/documents", response_model=List[DocumentMetadata])
def get_documents_list():
    return [
        DocumentMetadata(
            id=d["id"],
            title=d["title"],
            source=d["source"],
            date=d["date"],
            summary=d["summary"],
        ) for d in DOCUMENTS
    ]

@router.get("/documents/{doc_id}", response_model=DocumentDetail)
def get_document_detail(doc_id: str):
    for d in DOCUMENTS:
        if d["id"] == doc_id:
            return DocumentDetail(
                id=d["id"],
                title=d["title"],
                source=d["source"],
                date=d["date"],
                content=d["content"],
            )
    return DocumentDetail(
        id="not-found",
        title="Not Found",
        source="",
        date="",
        content="Document not found.",
    )

STOP_WORDS = {"what", "is", "the", "of", "in", "a", "an", "and", "to", "for", "on", "with", "at", "by", "from", "how", "why", "where", "which", "who", "whom", "about", "are", "do", "can", "it", "its", "be", "as", "or", "has", "have"}

# Energy-domain synonym map — expands single query terms to related concepts
ENERGY_SYNONYMS: dict[str, list[str]] = {
    "oil": ["crude", "petroleum", "brent", "wti"],
    "crude": ["oil", "petroleum", "brent"],
    "vessel": ["tanker", "ship", "carrier", "vlcc"],
    "tanker": ["vessel", "ship", "carrier", "vlcc"],
    "hormuz": ["strait", "chokepoint", "persian"],
    "strait": ["hormuz", "chokepoint", "bab"],
    "sanction": ["sanctions", "ofac", "embargo"],
    "sanctions": ["sanction", "ofac", "embargo"],
    "ofac": ["sanctions", "sanction", "sdn"],
    "russia": ["russian", "sokol", "urals", "espo"],
    "india": ["indian", "iocl", "hpcl", "bpcl", "isprl"],
    "reserve": ["spr", "isprl", "strategic", "cavern", "caverns"],
    "spr": ["reserve", "isprl", "strategic", "cavern"],
    "import": ["imports", "importing", "sourcing"],
    "route": ["routing", "corridor", "pathway", "lane", "rerouting"],
    "routing": ["route", "corridor", "pathway", "rerouting"],
    "risk": ["threat", "disruption", "vulnerability"],
    "price": ["brent", "wti", "crude", "volatility", "spot"],
    "ais": ["vessel", "ship", "tracking", "maritime"],
    "africa": ["nigeria", "angola", "west"],
    "drawdown": ["release", "depletion", "protocol", "emergency"],
    "refinery": ["refining", "jamnagar", "throughput"],
    "capacity": ["mmtpa", "throughput", "volume"],
}


def _expand_query(query_words: set) -> set:
    """Expand query terms to include energy-domain synonyms."""
    expanded = set(query_words)
    for word in list(query_words):
        for key, synonyms in ENERGY_SYNONYMS.items():
            if word == key or word in synonyms:
                expanded.add(key)
                expanded.update(synonyms)
    return expanded


def simple_retrieval(query: str) -> List[Dict]:
    """Score and retrieve the most relevant documents for a query.

    Uses weighted multi-field matching (title > summary > content),
    energy-domain synonym expansion, and bigram phrase bonuses.
    Returns up to 3 best-matching documents.
    """
    cleaned_query = (
        query.lower()
        .replace("?", "")
        .replace(".", "")
        .replace(",", "")
        .replace("!", "")
        .replace("'", "")
    )
    raw_words = cleaned_query.split()
    query_words = set(raw_words) - STOP_WORDS

    if not query_words:
        return []

    expanded = _expand_query(query_words)

    # Build bigrams from the raw query for phrase-level bonus scoring
    bigrams = [" ".join(raw_words[i:i + 2]) for i in range(len(raw_words) - 1)]

    scored_docs = []
    for doc in DOCUMENTS:
        content_lower = doc["content"].lower()
        title_lower = doc["title"].lower()
        summary_lower = doc["summary"].lower()
        score = 0

        for word in expanded:
            if len(word) < 3:
                continue
            if word in title_lower:
                score += 4   # Title matches are highest signal
            if word in summary_lower:
                score += 2   # Summary is second
            if word in content_lower:
                score += 1   # Content is broadest field

        # Bigram phrase bonus — exact two-word phrases are strong intent signals
        for bigram in bigrams:
            if bigram in title_lower:
                score += 6
            elif bigram in content_lower:
                score += 3

        if score > 0:
            scored_docs.append((score, doc))

    scored_docs.sort(key=lambda x: x[0], reverse=True)
    return [item[1] for item in scored_docs[:3]]

def get_template_fallback_answer(query: str, retrieved: List[Dict]) -> str:
    # Removed blockquote formatting
    ans = "### Source-Verified Answer (Local Template Mode)\n\n"
    ans += "Verified reference specifications retrieved from the model library:\n\n"
    for r in retrieved:
        ans += f"**[{r['id']}] {r['title']}**\n"
        ans += f"{r['content']}\n\n"
    ans += f"*(Synthesized locally from {', '.join([d['id'] for d in retrieved])} reference data — not sourced from a live document retrieval.)*"
    return ans

@router.post("/query", response_model=QueryResponse)
async def query_rag_engine(req: QueryRequest):
    retrieved = simple_retrieval(req.query)
    retrieved_ids = [d["id"] for d in retrieved]

    if not retrieved:
        return QueryResponse(
            answer="No matching reference specifications were found in the library for your query.",
            retrieved_documents=[],
        )

    gemini_key = os.getenv("GEMINI_API_KEY")
    groq_key = os.getenv("GROQ_API_KEY")

    prompt = (
        "You are an elite energy security analyst. Answer the user's question using ONLY the provided document excerpts. "
        "Do not invent facts outside the text. If the text does not contain the answer, say so. "
        "Do not format the answer or excerpts using blockquotes or quotes that suggest direct quotes of real people. "
        "Format the answer as a straightforward technical description.\n\n"
        "### User Question:\n"
        f"{req.query}\n\n"
        "### Retrieved Excerpts:\n"
    )
    for doc in retrieved:
        prompt += f"--- Document ID: {doc['id']} ({doc['title']}) ---\n{doc['content']}\n\n"
    
    prompt += "Provide a clear, structured answer, citing the document IDs for all factual assertions. Keep the answer professional and direct."

    answer = None

    if gemini_key:
        try:
            logger.info("Attempting RAG Q&A via Gemini API...")
            async with httpx.AsyncClient(timeout=10.0) as client:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={gemini_key}"
                payload = {"contents": [{"parts": [{"text": prompt}]}]}
                res = await client.post(url, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    answer = data["candidates"][0]["content"]["parts"][0]["text"]
        except Exception as e:
            logger.error(f"Gemini RAG lookup failed: {e}")

    if not answer and groq_key:
        try:
            logger.info("Attempting RAG Q&A via Groq LLaMA Fallback...")
            async with httpx.AsyncClient(timeout=10.0) as client:
                url = "https://api.groq.com/openai/v1/chat/completions"
                headers = {"Authorization": f"Bearer {groq_key}", "Content-Type": "application/json"}
                payload = {
                    "model": "llama-3.3-70b-versatile",
                    "messages": [
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.1
                }
                res = await client.post(url, headers=headers, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    answer = data["choices"][0]["message"]["content"]
        except Exception as e:
            logger.error(f"Groq RAG lookup failed: {e}")

    if not answer:
        logger.info("Falling back to local document template builder for RAG answer.")
        answer = get_template_fallback_answer(req.query, retrieved)

    return QueryResponse(
        answer=answer,
        retrieved_documents=retrieved_ids,
    )
