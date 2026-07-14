from __future__ import annotations

import logging

from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.ingestion.eia import EiaConfigurationError, fetch_brent_spot_price
from app.ingestion.gdelt import fetch_gdelt_articles

logger = logging.getLogger(__name__)

CORRIDOR_QUERIES = [
    '"Strait of Hormuz"',
    '"Bab el-Mandeb" oil',
    '"Iran oil sanctions"',
]


def build_scheduler() -> AsyncIOScheduler:
    scheduler = AsyncIOScheduler(timezone="UTC")
    scheduler.add_job(run_gdelt_poll, "interval", minutes=15, id="gdelt_poll", replace_existing=True)
    scheduler.add_job(run_eia_poll, "interval", hours=1, id="eia_poll", replace_existing=True)
    return scheduler


async def run_gdelt_poll() -> None:
    for query in CORRIDOR_QUERIES:
        try:
            articles = await fetch_gdelt_articles(query=query, maxrecords=25)
        except Exception:
            logger.exception("GDELT poll failed for query %s", query)
            continue
        logger.info("GDELT query %s returned %s articles", query, len(articles))


async def run_eia_poll() -> None:
    try:
        points = await fetch_brent_spot_price(days_back=7)
    except EiaConfigurationError:
        logger.info("EIA poll skipped because EIA_API_KEY is not configured")
        return
    except Exception:
        logger.exception("EIA poll failed")
        return
    logger.info("EIA Brent spot query returned %s price points", len(points))
