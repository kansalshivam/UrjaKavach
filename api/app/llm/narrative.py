"""LLM Fallback Chain for Geopolitical Risk Narrative generation.

Attempts:
1. Google Gemini (GEMINI_API_KEY)
2. Groq LLaMA (GROQ_API_KEY)
3. Dynamic Template Fallback (showing raw database metrics)
"""
from __future__ import annotations

import logging
import os
import httpx
from datetime import datetime, timezone

logger = logging.getLogger(__name__)


def generate_template_fallback(
    risk_scores: list[dict],
    recent_articles: list[dict],
    ais_counts: dict,
) -> str:
    """Generate a clean markdown narrative based solely on raw database metrics."""
    lines = [
        "### Geopolitical Risk Narrative (Automated Briefing)",
        f"**Generated at**: {datetime.now(timezone.utc).isoformat()} (System Fallback Mode)",
        "",
        "#### Active Corridor Risk Assessment:",
    ]
    for r in risk_scores:
        corr_name = r["corridor"].replace("_", " ").title()
        lines.append(f"- **{corr_name}**: {r['score']:.1f}/100 (GDELT: {r['component_gdelt_volume']:.2f}, Price Volatility: {r['component_price_volatility']:.2f}, AIS: {r['component_ais_deviation']:.2f})")

    lines.extend([
        "",
        "#### Strategic Supply Chain Indicators:",
        f"- **Vessel Density**: Strait of Hormuz: {ais_counts.get('hormuz', 'N/A')} vessels | Jamnagar/Vadinar Bounding Box: {ais_counts.get('jamnagar_vadinar', 'N/A')} vessels",
        "",
        "#### Recent Geopolitical Signals Feed:",
    ])

    if recent_articles:
        for art in recent_articles[:5]:
            lines.append(f"- [{art['title']}]({art['url']}) ({art['domain']})")
    else:
        lines.append("- No recent articles retrieved from database.")

    return "\n".join(lines)


async def generate_narrative(
    risk_scores: list[dict],
    recent_articles: list[dict],
    ais_counts: dict,
) -> str:
    """Attempt Gemini, fallback to Groq, fallback to template."""
    gemini_key = os.getenv("GEMINI_API_KEY")
    groq_key = os.getenv("GROQ_API_KEY")

    # Format the prompt context
    corridors_summary = "\n".join([
        f"- {r['corridor']}: {r['score']:.1f}/100 (GDELT volume z-score component: {r['component_gdelt_volume']:.2f}, Brent Price Volatility component: {r['component_price_volatility']:.2f}, AIS deviation: {r['component_ais_deviation']:.2f})"
        for r in risk_scores
    ])
    articles_summary = "\n".join([
        f"- {art['title']} (Source: {art['domain']}, Corridor: {art['corridor']})"
        for art in recent_articles[:8]
    ])

    prompt = (
        "You are an elite energy security and geopolitics analyst. Write a concise, 2-3 paragraph strategic risk narrative briefing "
        "based on the following real-time signals from the Urja Kavach Operations Console:\n\n"
        "### Corridor Risk Scores (0-100 scale):\n"
        f"{corridors_summary}\n\n"
        "### Live AIS Vessel Density:\n"
        f"- Strait of Hormuz: {ais_counts.get('hormuz', 'N/A')} vessels\n"
        f"- Jamnagar & Vadinar Import Ports: {ais_counts.get('jamnagar_vadinar', 'N/A')} vessels\n\n"
        "### Recent Geopolitical News Headlines:\n"
        f"{articles_summary}\n\n"
        "NOTE: Under the free tier, AIS vessel tracking coverage is structurally limited to the Americas box. "
        "The Strait of Hormuz, West Africa, and Russia corridors currently have zero AIS stream coverage and are "
        "excluded from risk scoring calculations (+0.0% contribution). State this limitation plainly and do "
        "not fabricate real-world explanations (such as tanker rerouting or traffic suspension) for the absence of "
        "AIS data in these zones.\n\n"
        "Highlight the primary threat corridors (especially Hormuz if elevated) and assess their potential impact on India's energy supply chain resilience. "
        "Format your response as a professional markdown document with clear headings. Do not include meta-commentary or conversational intros."
    )

    # 1. Attempt Google Gemini
    if gemini_key:
        try:
            logger.info("Attempting narrative generation via Gemini API...")
            async with httpx.AsyncClient(timeout=10.0) as client:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key={gemini_key}"
                payload = {
                    "contents": [{
                        "parts": [{"text": prompt}]
                    }]
                }
                res = await client.post(url, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    text = data["candidates"][0]["content"]["parts"][0]["text"]
                    if text:
                        return text
                logger.warning("Gemini API call failed: %s %s", res.status_code, res.text)
        except Exception as e:
            logger.warning("Error during Gemini API call: %s", e)

    # 2. Attempt Groq LLaMA
    if groq_key:
        try:
            logger.info("Attempting narrative generation via Groq API...")
            async with httpx.AsyncClient(timeout=10.0) as client:
                url = "https://api.groq.com/openai/v1/chat/completions"
                headers = {"Authorization": f"Bearer {groq_key}"}
                payload = {
                    "model": "openai/gpt-oss-120b",
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.3,
                }
                res = await client.post(url, headers=headers, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    text = data["choices"][0]["message"]["content"]
                    if text:
                        return text
                logger.warning("Groq API call failed: %s %s", res.status_code, res.text)
        except Exception as e:
            logger.warning("Error during Groq API call: %s", e)

    # 3. Fallback to Dynamic Template
    logger.warning("All LLM providers offline or keys missing. Falling back to dynamic template.")
    return generate_template_fallback(risk_scores, recent_articles, ais_counts)
