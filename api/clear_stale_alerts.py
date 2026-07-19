import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

async def clear_stale():
    url = os.environ["DATABASE_URL"]
    engine = create_async_engine(url)
    async with engine.begin() as conn:
        r1 = await conn.execute(text("DELETE FROM geopolitical_alerts"))
        print(f"Deleted {r1.rowcount} stale alerts from Neon")
        r2 = await conn.execute(text("DELETE FROM gdelt_articles WHERE is_synthetic = true"))
        print(f"Deleted {r2.rowcount} synthetic articles from Neon")
    await engine.dispose()
    print("Done. Run update_render.bat again to populate with fresh data.")

asyncio.run(clear_stale())
