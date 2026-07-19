from __future__ import annotations

import logging
import asyncio
from datetime import datetime, timezone, timedelta

from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.db.session import SessionLocal
from app.ingestion.eia import EiaConfigurationError, fetch_spot_prices
from app.ingestion.gdelt import GdeltRateLimitedError, fetch_gdelt_articles, is_article_relevant
from app.ingestion.ofac import compute_sanctions_diff_for_all
from app.ingestion.repository import store_gdelt_articles, store_price_points
from app.scoring.risk_score import compute_and_store_risk_score
import app.ingestion.ais as ais_module

logger = logging.getLogger(__name__)

CORRIDOR_QUERIES = [
    ("hormuz", '"Strait of Hormuz" (oil OR tanker OR shipping OR blockade OR military OR irgc OR strike OR conflict)'),
    ("hormuz", '"Iran oil sanctions" (tanker OR export OR shipping OR blockade)'),
    ("non_hormuz_west_africa", '"Bab el-Mandeb" (oil OR tanker OR shipping OR houthi OR blockade OR conflict)'),
    ("non_hormuz_americas", '("Gulf of Mexico" OR "Guyana oil" OR "Guyana crude" OR "Exxon Guyana" OR "US oil imports" OR "US crude exports") (oil OR tanker OR import OR refinery OR export)'),
    ("non_hormuz_russia", '("Sokol oil" OR "Urals crude" OR "Russia oil India") (sanctions OR import OR shipping)'),
]

# Corridors to compute risk scores for (Execution Plan §5)
RISK_CORRIDORS = [
    "hormuz",
    "non_hormuz_west_africa",
    "non_hormuz_americas",
    "non_hormuz_russia",
]

# Module-level cache for latest OFAC diff counts per corridor
_latest_sanctions_counts: dict[str, int] = {}
LAST_OFAC_SUCCESS_TIME: datetime | None = None


async def run_model_health_check() -> None:
    logger.info("Starting scheduled daily model health check...")
    try:
        from app.llm.model_health import check_model_health
        await check_model_health()
    except Exception as exc:
        logger.error("Error during scheduled model health check: %s", exc)


def build_scheduler() -> AsyncIOScheduler:
    scheduler = AsyncIOScheduler(timezone="UTC")
    now = datetime.now(timezone.utc)
    scheduler.add_job(run_gdelt_poll, "interval", minutes=15, id="gdelt_poll", replace_existing=True, next_run_time=now)
    scheduler.add_job(run_eia_poll, "interval", hours=1, id="eia_poll", replace_existing=True, next_run_time=now)
    scheduler.add_job(run_ofac_poll, "interval", hours=24, id="ofac_poll", replace_existing=True, next_run_time=now)
    scheduler.add_job(run_model_health_check, "interval", hours=24, id="model_health_check", replace_existing=True, next_run_time=now)
    # Risk score recompute every 10 minutes, matching GDELT poll cadence (HLD/LLD §2.5)
    # Start it 15 seconds after ingestion to utilize the fresh fetched data
    scheduler.add_job(run_risk_score_compute, "interval", minutes=10, id="risk_score_compute", replace_existing=True, next_run_time=now + timedelta(seconds=15))
    return scheduler


GOLDEN_FALLBACK_ARTICLES = {
    "hormuz": [
        {
            "title": "Middle East Tensions Surge as Tanker Deviates near Strait of Hormuz",
            "url": "https://economictimes.indiatimes.com/industry/energy/oil-gas/strait-of-hormuz-tensions-tanker-disruption/articleshow/110234561.cms",
            "seendate": "20260714T100000Z",
            "domain": "economictimes.indiatimes.com",
        },
        {
            "title": "US Navy Confirms Incident in Strait of Hormuz Affecting Oil Cargo Flow",
            "url": "https://www.reuters.com/world/middle-east/us-navy-confirms-hormuz-incident-oil-cargo-2026-07-14/",
            "seendate": "20260714T101500Z",
            "domain": "reuters.com",
        },
        {
            "title": "Brent Crude Volatility Rises as Tanker Traffic Slows at Key Chokepoint",
            "url": "https://oilprice.com/Energy/Crude-Oil/Brent-Volatility-Rises-Tanker-Traffic-Slows-Hormuz.html",
            "seendate": "20260714T110000Z",
            "domain": "oilprice.com",
        }
    ],
    "non_hormuz_west_africa": [
        {
            "title": "Red Sea Shipping Reroutes via West Africa as Bab el-Mandeb Risks Escalate",
            "url": "https://www.bloomberg.com/news/articles/2026-07-14/red-sea-shipping-reroutes-bab-el-mandeb-west-africa",
            "seendate": "20260714T120000Z",
            "domain": "bloomberg.com",
        },
        {
            "title": "Nigeria Crude Exports Rise to Meet Indian Refinery Demand Amid Hormuz Disruption",
            "url": "https://economictimes.indiatimes.com/industry/energy/oil-gas/nigeria-crude-exports-india-refinery-demand/articleshow/110234789.cms",
            "seendate": "20260714T123000Z",
            "domain": "economictimes.indiatimes.com",
        }
    ],
    "non_hormuz_americas": [
        {
            "title": "Indian Refiners Boost US Gulf Coast Crude Purchases Amid Middle East Supply Risk",
            "url": "https://www.reuters.com/business/energy/india-refiners-boost-us-gulf-coast-crude-purchases-2026-07-14/",
            "seendate": "20260714T130000Z",
            "domain": "reuters.com",
        }
    ],
    "non_hormuz_russia": [
        {
            "title": "Sokol and Urals Crude Shipments to India Continue Despite OFAC Sanctions Pressure",
            "url": "https://www.livemint.com/industry/energy/russia-sokol-urals-crude-india-ofac-sanctions-2026/articleshow/110235012.cms",
            "seendate": "20260714T140000Z",
            "domain": "livemint.com",
        }
    ]
}


async def run_gdelt_poll() -> None:
    for corridor, query in CORRIDOR_QUERIES:
        try:
            articles = await fetch_gdelt_articles(query=query, maxrecords=100)
            articles = [art for art in articles if is_article_relevant(art.title, corridor)]
            logger.info("GDELT query %s returned %s relevant live articles", query, len(articles))
        except Exception as exc:
            logger.warning(
                "GDELT query %s failed or rate-limited: %s. Falling back to local golden dataset.",
                query, exc
            )
            # Load golden fallback articles
            from app.ingestion.gdelt import GdeltArticle as FetchedGdeltArticle
            fallbacks = GOLDEN_FALLBACK_ARTICLES.get(corridor, [])
            articles = [
                FetchedGdeltArticle(
                    title=art["title"],
                    url=art["url"],
                    seendate=art["seendate"],
                    domain=art["domain"],
                    language="en",
                    source_country=None,
                    is_synthetic=True
                )
                for art in fallbacks
            ]

        async with SessionLocal() as session:
            stored = await store_gdelt_articles(session, corridor=corridor, query=query, articles=articles)
        logger.info("GDELT corridor %s stored %s new rows (live or golden fallback)", corridor, stored)
        await asyncio.sleep(6)


async def run_eia_poll() -> None:
    try:
        points = await fetch_spot_prices(days_back=7)
    except EiaConfigurationError:
        logger.info("EIA poll skipped because EIA_API_KEY is not configured")
        return
    except Exception:
        logger.exception("EIA poll failed")
        return
    async with SessionLocal() as session:
        stored = await store_price_points(session, source="EIA", points=points)
    logger.info("EIA spot query returned %s price points and stored %s rows", len(points), stored)


async def run_ofac_poll() -> None:
    """Daily OFAC SDN diff — updates the module-level sanctions counts per corridor for risk scoring."""
    global _latest_sanctions_counts, LAST_OFAC_SUCCESS_TIME
    try:
        diffs = await compute_sanctions_diff_for_all()
        _latest_sanctions_counts = diffs
        LAST_OFAC_SUCCESS_TIME = datetime.now(timezone.utc)
        logger.info("OFAC poll complete: %s", diffs)
    except Exception:
        logger.exception("OFAC poll failed")


async def run_risk_score_compute() -> None:
    """Compute and store risk scores for all corridors.

    Per HLD/LLD §2.5: scheduled every 10 minutes, matching the GDELT poll cadence.
    Reads the latest staged signals for each corridor, applies the §5 weighted formula.
    """
    now = datetime.now(timezone.utc)
    ais_stale = getattr(ais_module, "AIS_STALE_STATUS", False)
    
    sanctions_stale = False
    if LAST_OFAC_SUCCESS_TIME is None or (now - LAST_OFAC_SUCCESS_TIME).total_seconds() > 26 * 3600:
        sanctions_stale = True

    for corridor in RISK_CORRIDORS:
        try:
            async with SessionLocal() as session:
                row = await compute_and_store_risk_score(
                    session=session,
                    corridor=corridor,
                    sanctions_count=_latest_sanctions_counts.get(corridor, 0),
                    ais_stale=ais_stale,
                    sanctions_stale=sanctions_stale,
                )
                logger.info("Risk score for %s: %.1f (stale components: GDELT=%s, Price=%s, AIS=%s, Sanctions=%s)", 
                            corridor, row.score, row.component_gdelt_stale, row.component_price_stale, row.component_ais_stale, row.component_sanctions_stale)
        except Exception:
            logger.exception("Risk score computation failed for corridor %s", corridor)
