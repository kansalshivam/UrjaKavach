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

# Renamed to make it unambiguously synthetic and rephrased to be technical reference specifications
DOCUMENTS = [
    {
        "id": "SYNTH-MODEL-ISPRL-CAPACITY",
        "title": "Reference Specification: Strategic Petroleum Reserves & Caverns",
        "source": "Urja Kavach Reference Data Model",
        "date": "March 12, 2026",
        "summary": "Synthetic modeling reference for ISPRL caverns fill levels, capacities, and OMC commercial reserves.",
        "content": "Model Reference: The Indian Strategic Petroleum Reserves Limited (ISPRL) capacity is set to 5.33 Million Metric Tonnes (MMT) across three underground rock cavern facilities: Visakhapatnam (1.33 MMT), Mangaluru (1.50 MMT), and Padur (2.50 MMT). The active fill level is modeled at 63.26% of capacity (~3.372 MMT, or 23,357,267.4 barrels using the cavern-specific conversion rate of 6.926829 bbl/MMT). These caverns correspond to 9.5 days of national consumption cover, and Oil Marketing Companies (OMCs) commercial reserves are set to 64.5 days of storage, yielding a total of 74 days of national cover based on the 5.0M bpd national consumption base."
    },
    {
        "id": "SYNTH-MODEL-REFINERY-DATA",
        "title": "Reference Specification: Refinery Tonnage & Sourcing Composition",
        "source": "Urja Kavach Reference Data Model",
        "date": "February 28, 2026",
        "summary": "Synthetic modeling reference for refining nameplate capacities, private-public shares, and Jamnagar throughput.",
        "content": "Model Reference: India's total refining sector nameplate capacity is set to 251.2 MMTPA. Public sector refiners account for approximately 65% of processed crude. The Reliance Industries Jamnagar complex is modeled with a capacity of 1.24 million bpd (approx 62 MMTPA). Sourcing metrics are modeled with a 15-percentage-point composition shift, representing non-Hormuz sourcing share rising from 55% to 70% to evaluate maritime supply disruption contingencies."
    },
    {
        "id": "SYNTH-MODEL-CONTINGENCY-ROUTING",
        "title": "Reference Specification: Supply Diversification & Absolute Mitigation Offsets",
        "source": "Urja Kavach Reference Data Model",
        "date": "March 5, 2026",
        "summary": "Synthetic modeling reference for contingency imports routing via West Africa, US Gulf, and Guyana pathways.",
        "content": "Model Reference: Alternative routing contingencies redirect imports through West Africa, the US Gulf Coast, and Guyanese supply corridors. The 15% non-Hormuz sourcing shift is modeled as a fixed absolute volume offset of 660,000 bpd (calculated against the 4.4M bpd import capacity) to evaluate transit shortfalls regardless of the shortfall percentage. Supply lanes are mapped via coordinates from the Information Fusion Centre (IFC-IOR)."
    },
    {
        "id": "SYNTH-MODEL-PHASE2-PLAN",
        "title": "Reference Specification: Planned Caverns Phase II Expansion",
        "source": "Urja Kavach Reference Data Model",
        "date": "July 8, 2021",
        "summary": "Synthetic modeling reference for planned expansion caverns at Chandikhole (4.0 MMT) and Padur (2.5 MMT).",
        "content": "Model Reference: Future capacity scenarios model the establishment of additional Strategic Petroleum Reserves (SPR) caverns under Phase II. The expansion includes two planned caverns: a 4.0 MMT facility at Chandikhole in Odisha, and a 2.5 MMT facility at Padur in Karnataka. This adds 6.5 MMT of storage capacity, bringing total strategic reserve capacity to 11.83 MMT to support energy security evaluations aligned with the IEA's 90-day recommended cover target."
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
            summary=d["summary"]
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
                content=d["content"]
            )
    return DocumentDetail(id="not-found", title="Not Found", source="", date="", content="Document not found.")

def simple_retrieval(query: str) -> List[Dict]:
    scored_docs = []
    query_words = set(query.lower().split())
    for doc in DOCUMENTS:
        content_lower = doc["content"].lower()
        title_lower = doc["title"].lower()
        score = 0
        for word in query_words:
            if word in content_lower:
                score += 1
            if word in title_lower:
                score += 2
        scored_docs.append((score, doc))
    
    scored_docs.sort(key=lambda x: x[0], reverse=True)
    return [scored_docs[0][1], scored_docs[1][1]]

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
    
    prompt += "Provide a clear, structured answer, citing the document IDs (e.g. [SYNTH-MODEL-ISPRL-CAPACITY] or [SYNTH-MODEL-REFINERY-DATA]) for all factual assertions. Keep the answer professional and direct."

    answer = None

    if gemini_key:
        try:
            logger.info("Attempting RAG Q&A via Gemini API...")
            async with httpx.AsyncClient(timeout=10.0) as client:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={gemini_key}"
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
                    "model": "llama3-8b-8192",
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

    return QueryResponse(answer=answer, retrieved_documents=retrieved_ids)
