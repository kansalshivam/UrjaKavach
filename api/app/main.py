from contextlib import asynccontextmanager
from collections.abc import AsyncIterator

from fastapi import FastAPI

from app.db.session import SessionLocal
from app.routes import dashboard, twin
from app.scheduler import build_scheduler
from app.seed import seed_foundation_data


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    async with SessionLocal() as session:
        await seed_foundation_data(session)
    scheduler = build_scheduler()
    scheduler.start()
    try:
        yield
    finally:
        scheduler.shutdown(wait=False)


app = FastAPI(title="Urja Kavach API", lifespan=lifespan)
app.include_router(dashboard.router)
app.include_router(twin.router)


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}
