import json
from pathlib import Path
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Edge, Node, Scenario, GdeltArticle, PricePoint, RiskScore, AisSnapshot

SEED_PATH = Path("/app/data/india_energy_nodes.json")


async def seed_foundation_data(session: AsyncSession) -> None:
    # 1. Seed static energy nodes & edges
    node_exists = await session.scalar(select(Node.id).limit(1))
    if not node_exists:
        payload = json.loads(SEED_PATH.read_text(encoding="utf-8-sig"))
        session.add_all(Node(**node) for node in payload["nodes"])
        await session.flush()
        session.add_all(Edge(**edge) for edge in payload["edges"])
        session.add(
            Scenario(
                id="hormuz_partial_closure",
                name="Hormuz partial closure",
                description="Capacity-available slider scenario for Strait of Hormuz disruption.",
                ground_truth_source="FINAL_ALIGNED_DOSSIER sections 1-2, as referenced by Execution Plan.",
            )
        )
        await session.flush()

    # 2. Seed baseline EIA price point (Golden Fallback §11)
    price_exists = await session.scalar(select(PricePoint.id).limit(1))
    if not price_exists:
        session.add(
            PricePoint(
                source="EIA",
                series="RBRTE",
                period="20260706",
                value=69.56,
                units="Dollars per Barrel",
            )
        )
        await session.flush()

    # 3. Seed baseline GDELT articles (Golden Fallback §11)
    article_exists = await session.scalar(select(GdeltArticle.id).limit(1))
    if not article_exists:
        baseline_articles = [
            {
                "corridor": "hormuz",
                "query": "Hormuz Strait crude",
                "title": "Middle East Tensions Surge as Tanker Deviates near Strait of Hormuz",
                "url": "https://www.reuters.com/business/energy/tanker-hormuz-disruption-2026",
                "seendate": "20260714T100000Z",
                "domain": "reuters.com",
            },
            {
                "corridor": "hormuz",
                "query": "Hormuz Strait crude",
                "title": "US Navy Confirms Incident in Strait of Hormuz affecting Oil Cargo Flow",
                "url": "https://www.ap.org/news/navy-hormuz-incident-2026",
                "seendate": "20260714T101500Z",
                "domain": "ap.org",
            }
        ]
        session.add_all(GdeltArticle(**art) for art in baseline_articles)
        await session.flush()

    # 4. Seed baseline AIS count snapshot (Golden Fallback §11)
    ais_exists = await session.scalar(select(AisSnapshot.id).limit(1))
    if not ais_exists:
        session.add(AisSnapshot(bounding_box="hormuz", vessel_count=38))
        session.add(AisSnapshot(bounding_box="jamnagar_vadinar", vessel_count=12))
        await session.flush()

    # 5. Seed baseline calculated risk scores (Golden Fallback §11)
    score_exists = await session.scalar(select(RiskScore.id).limit(1))
    if not score_exists:
        now_dt = datetime.now(timezone.utc)
        baseline_scores = [
            RiskScore(
                corridor="hormuz",
                computed_at=now_dt,
                score=22.1554,
                component_gdelt_volume=0.6,
                component_price_volatility=0.0462,
                component_ais_deviation=0.0,
                component_sanctions_flag=0.0,
                weights_used={"gdelt_volume": 0.35, "price_volatility": 0.25, "ais_deviation": 0.30, "sanctions_flag": 0.10},
            ),
            RiskScore(
                corridor="non_hormuz_west_africa",
                computed_at=now_dt,
                score=15.1554,
                component_gdelt_volume=0.4,
                component_price_volatility=0.0462,
                component_ais_deviation=0.0,
                component_sanctions_flag=0.0,
                weights_used={"gdelt_volume": 0.35, "price_volatility": 0.25, "ais_deviation": 0.30, "sanctions_flag": 0.10},
            ),
            RiskScore(
                corridor="non_hormuz_americas",
                computed_at=now_dt,
                score=15.1554,
                component_gdelt_volume=0.4,
                component_price_volatility=0.0462,
                component_ais_deviation=0.0,
                component_sanctions_flag=0.0,
                weights_used={"gdelt_volume": 0.35, "price_volatility": 0.25, "ais_deviation": 0.30, "sanctions_flag": 0.10},
            ),
            RiskScore(
                corridor="non_hormuz_russia",
                computed_at=now_dt,
                score=15.1554,
                component_gdelt_volume=0.4,
                component_price_volatility=0.0462,
                component_ais_deviation=0.0,
                component_sanctions_flag=0.0,
                weights_used={"gdelt_volume": 0.35, "price_volatility": 0.25, "ais_deviation": 0.30, "sanctions_flag": 0.10},
            ),
        ]
        session.add_all(baseline_scores)

    await session.commit()
