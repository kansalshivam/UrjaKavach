from contextlib import asynccontextmanager
from collections.abc import AsyncIterator
import asyncio

from fastapi import FastAPI

from app.db.session import SessionLocal
from app.ingestion.ais import run_ais_stream
from app.routes import dashboard, twin, scenario, narrative, procurement, reserve, rag, audit
from app.scheduler import build_scheduler
from app.seed import seed_foundation_data


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    async with SessionLocal() as session:
        await seed_foundation_data(session)
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




@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}
