"""Routes for LLM Risk Narrative."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import GdeltArticle, RiskScore, AisSnapshot
from app.db.session import get_session
from app.llm.narrative import generate_narrative

router = APIRouter(prefix="/api/narrative", tags=["narrative"])


@router.get("")
async def get_risk_narrative(session: AsyncSession = Depends(get_session)) -> dict:
    corridors = ["hormuz", "non_hormuz_west_africa", "non_hormuz_americas", "non_hormuz_russia"]

    # 1. Fetch latest risk score for each corridor
    risk_scores_list = []
    for corridor in corridors:
        row = await session.scalar(
            select(RiskScore)
            .where(RiskScore.corridor == corridor)
            .order_by(RiskScore.computed_at.desc())
            .limit(1)
        )
        if row:
            risk_scores_list.append({
                "corridor": row.corridor,
                "score": row.score,
                "component_gdelt_volume": row.component_gdelt_volume or 0.0,
                "component_price_volatility": row.component_price_volatility or 0.0,
                "component_ais_deviation": row.component_ais_deviation or 0.0,
            })

    # If no risk scores in DB, add a dummy entry to prevent crash
    if not risk_scores_list:
        risk_scores_list = [
            {"corridor": c, "score": 0.0, "component_gdelt_volume": 0.0, "component_price_volatility": 0.0, "component_ais_deviation": 0.0}
            for c in corridors
        ]

    # 2. Fetch recent GDELT articles
    articles_result = await session.execute(
        select(GdeltArticle)
        .order_by(GdeltArticle.seendate.desc())
        .limit(15)
    )
    articles_rows = articles_result.scalars().all()
    recent_articles = [
        {
            "title": a.title,
            "url": a.url,
            "domain": a.domain or "unknown",
            "corridor": a.corridor,
        }
        for a in articles_rows
    ]

    # 3. Fetch latest AIS vessel counts
    ais_counts = {"hormuz": 38, "jamnagar_vadinar": 12}
    for box in ["hormuz", "jamnagar_vadinar"]:
        row = await session.scalar(
            select(AisSnapshot)
            .where(AisSnapshot.bounding_box == box)
            .order_by(AisSnapshot.captured_at.desc())
            .limit(1)
        )
        if row:
            ais_counts[box] = row.vessel_count

    # 4. Generate LLM Risk Narrative
    narrative_text = await generate_narrative(risk_scores_list, recent_articles, ais_counts)

    return {
        "narrative": narrative_text,
    }
