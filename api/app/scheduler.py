from __future__ import annotations

import logging
import asyncio

from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.db.session import SessionLocal
from app.ingestion.eia import EiaConfigurationError, fetch_brent_spot_price
from app.ingestion.gdelt import GdeltRateLimitedError, fetch_gdelt_articles
from app.ingestion.repository import store_gdelt_articles, store_price_points

logger = logging.getLogger(__name__)

CORRIDOR_QUERIES = [
    ("hormuz", '"Strait of Hormuz"'),
    ("non_hormuz_west_africa", '"Bab el-Mandeb" oil'),
    ("hormuz", '"Iran oil sanctions"'),
]


def build_scheduler() -> AsyncIOScheduler:
    scheduler = AsyncIOScheduler(timezone="UTC")
    scheduler.add_job(run_gdelt_poll, "interval", minutes=15, id="gdelt_poll", replace_existing=True)
    scheduler.add_job(run_eia_poll, "interval", hours=1, id="eia_poll", replace_existing=True)
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
