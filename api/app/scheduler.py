from __future__ import annotations

import logging
import asyncio
from datetime import datetime, timezone, timedelta

from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.db.session import SessionLocal
from app.ingestion.eia import EiaConfigurationError, fetch_brent_spot_price
from app.ingestion.gdelt import GdeltRateLimitedError, fetch_gdelt_articles
from app.ingestion.ofac import compute_sanctions_diff
from app.ingestion.repository import store_gdelt_articles, store_price_points
from app.scoring.risk_score import compute_and_store_risk_score
import app.ingestion.ais as ais_module

logger = logging.getLogger(__name__)

CORRIDOR_QUERIES = [
    ("hormuz", '"Strait of Hormuz"'),
    ("non_hormuz_west_africa", '"Bab el-Mandeb" oil'),
    ("hormuz", '"Iran oil sanctions"'),
]

# Corridors to compute risk scores for (Execution Plan §5)
RISK_CORRIDORS = [
    "hormuz",
    "non_hormuz_west_africa",
    "non_hormuz_americas",
    "non_hormuz_russia",
]

# Module-level cache for latest OFAC diff count (used by risk score job)
_latest_sanctions_count: int = 0
LAST_OFAC_SUCCESS_TIME: datetime | None = None


def build_scheduler() -> AsyncIOScheduler:
    scheduler = AsyncIOScheduler(timezone="UTC")
    scheduler.add_job(run_gdelt_poll, "interval", minutes=15, id="gdelt_poll", replace_existing=True)
    scheduler.add_job(run_eia_poll, "interval", hours=1, id="eia_poll", replace_existing=True)
    scheduler.add_job(run_ofac_poll, "interval", hours=24, id="ofac_poll", replace_existing=True)
    # Risk score recompute every 10 minutes, matching GDELT poll cadence (HLD/LLD §2.5)
    scheduler.add_job(run_risk_score_compute, "interval", minutes=10, id="risk_score_compute", replace_existing=True)
    return scheduler


async def run_gdelt_poll() -> None:
    for corridor, query in CORRIDOR_QUERIES:
        try:
            articles = await fetch_gdelt_articles(query=query, maxrecords=25)
        except GdeltRateLimitedError as exc:
            logger.warning("GDELT query %s rate limited after cooldown of %s seconds", query, exc.retry_after_seconds)
            return
        except Exception:
            logger.exception("GDELT poll failed for query %s", query)
            continue
        async with SessionLocal() as session:
            stored = await store_gdelt_articles(session, corridor=corridor, query=query, articles=articles)
        logger.info("GDELT query %s returned %s articles and stored %s new rows", query, len(articles), stored)
        await asyncio.sleep(6)


async def run_eia_poll() -> None:
    try:
        points = await fetch_brent_spot_price(days_back=7)
    except EiaConfigurationError:
        logger.info("EIA poll skipped because EIA_API_KEY is not configured")
        return
    except Exception:
        logger.exception("EIA poll failed")
        return
    async with SessionLocal() as session:
        stored = await store_price_points(session, source="EIA", points=points)
    logger.info("EIA Brent spot query returned %s price points and stored %s rows", len(points), stored)


async def run_ofac_poll() -> None:
    """Daily OFAC SDN diff — updates the module-level sanctions count for risk scoring."""
    global _latest_sanctions_count, LAST_OFAC_SUCCESS_TIME
    try:
        diff = await compute_sanctions_diff()
        _latest_sanctions_count = diff.new_iran_entries
        LAST_OFAC_SUCCESS_TIME = datetime.now(timezone.utc)
        logger.info(
            "OFAC poll complete: %d new Iran entries, %d total Iran entries",
            diff.new_iran_entries, diff.total_iran_entries,
        )
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
                    sanctions_count=_latest_sanctions_count,
                    ais_stale=ais_stale,
                    sanctions_stale=sanctions_stale,
                )
                logger.info("Risk score for %s: %.1f (stale components: GDELT=%s, Price=%s, AIS=%s, Sanctions=%s)", 
                            corridor, row.score, row.component_gdelt_stale, row.component_price_stale, row.component_ais_stale, row.component_sanctions_stale)
        except Exception:
            logger.exception("Risk score computation failed for corridor %s", corridor)
