import json
import asyncio
from pathlib import Path
from app.db.session import SessionLocal
from app.db.models import Edge, Node
from sqlalchemy import delete

SEED_PATH = Path("/app/data/india_energy_nodes.json")

async def main():
    async with SessionLocal() as session:
        print("Clearing old network data...")
        await session.execute(delete(Edge))
        await session.execute(delete(Node))
        await session.commit()
        
        print("Inserting new network nodes & edges...")
        payload = json.loads(SEED_PATH.read_text(encoding="utf-8-sig"))
        async with SessionLocal() as session2:
            session2.add_all(Node(**node) for node in payload["nodes"])
            await session2.flush()
            session2.add_all(Edge(**edge) for edge in payload["edges"])
            await session2.commit()
        print("Reseed complete.")

if __name__ == "__main__":
    asyncio.run(main())
