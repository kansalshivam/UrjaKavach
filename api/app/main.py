from contextlib import asynccontextmanager
from collections.abc import AsyncIterator
import asyncio
import os
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration

sentry_dsn = os.getenv("SENTRY_DSN", "").strip()
if sentry_dsn:
    sentry_sdk.init(
        dsn=sentry_dsn,
        integrations=[FastApiIntegration()],
        traces_sample_rate=1.0,
    )

from fastapi import FastAPI, Response, status
from sqlalchemy import text

from app.db.session import SessionLocal
from app.ingestion.ais import run_ais_stream
from app.routes import dashboard, twin, scenario, narrative, procurement, reserve, rag, audit, alerts
from app.scheduler import build_scheduler
from app.seed import seed_foundation_data


import logging
from app.logging_config import setup_logging

setup_logging()

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    try:
        async with SessionLocal() as session:
            await seed_foundation_data(session)
    except Exception as exc:
        logger.error("Failed to seed foundation data on startup (database may be offline): %s", exc)
    scheduler = build_scheduler()
    scheduler.start()
    ais_task = asyncio.create_task(run_ais_stream(SessionLocal))
    try:
        yield
    finally:
        ais_task.cancel()
        scheduler.shutdown(wait=False)


app = FastAPI(title="Urja Kavach API", lifespan=lifespan)
app.include_router(dashboard.router)
app.include_router(twin.router)
app.include_router(scenario.router)
app.include_router(narrative.router)
app.include_router(procurement.router)
app.include_router(reserve.router)
app.include_router(rag.router)
app.include_router(audit.router)
app.include_router(alerts.router)




@app.get("/sentry-debug")
async def trigger_error():
    return 1 / 0


@app.api_route("/health", methods=["GET", "HEAD"])
async def health(response: Response) -> dict:
    try:
        async with SessionLocal() as session:
            await session.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected"}
    except Exception as exc:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return {"status": "error", "database": f"offline: {str(exc)}"}

