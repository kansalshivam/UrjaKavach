import json
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Edge, Node, Scenario

SEED_PATH = Path("/app/data/india_energy_nodes.json")


async def seed_foundation_data(session: AsyncSession) -> None:
    node_exists = await session.scalar(select(Node.id).limit(1))
    if node_exists:
        return

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
    await session.commit()
