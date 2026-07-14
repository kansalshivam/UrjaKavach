from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import GdeltArticle, RiskScore
from app.db.session import get_session
from app.scoring.risk_score import DEFAULT_WEIGHTS

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/summary")
async def dashboard_summary(session: AsyncSession = Depends(get_session)) -> dict:
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
                "id": row.id,
                "corridor": row.corridor,
                "computed_at": row.computed_at.isoformat(),
                "score": row.score,
                "component_gdelt_volume": row.component_gdelt_volume,
                "component_price_volatility": row.component_price_volatility,
                "component_ais_deviation": row.component_ais_deviation,
                "component_sanctions_flag": row.component_sanctions_flag,
                "weights_used": row.weights_used,
                "component_gdelt_stale": row.component_gdelt_stale,
                "component_price_stale": row.component_price_stale,
                "component_ais_stale": row.component_ais_stale,
                "component_sanctions_stale": row.component_sanctions_stale,
            })

    # 2. Fetch historical risk scores for trend charts (last 100 entries, ordered chronologically)
    history_result = await session.execute(
        select(RiskScore)
        .order_by(RiskScore.computed_at.asc())
        .limit(100)
    )
    history_rows = history_result.scalars().all()
    history_list = [
        {
            "corridor": r.corridor,
            "computed_at": r.computed_at.isoformat(),
            "score": r.score,
        }
        for r in history_rows
    ]

    # 3. Fetch recent GDELT articles
    articles_result = await session.execute(
        select(GdeltArticle)
        .order_by(GdeltArticle.seendate.desc())
        .limit(15)
    )
    articles_rows = articles_result.scalars().all()
    recent_articles = [
        {
            "id": a.id,
            "corridor": a.corridor,
            "title": a.title,
            "url": a.url,
            "seendate": a.seendate,
            "domain": a.domain,
        }
        for a in articles_rows
    ]

    return {
        "risk_scores": risk_scores_list,
        "history": history_list,
        "recent_articles": recent_articles,
        "weights_used": DEFAULT_WEIGHTS,
    }

