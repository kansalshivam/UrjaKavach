from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Edge, Node
from app.db.session import get_session

router = APIRouter(prefix="/api/twin", tags=["twin"])


@router.get("/nodes")
async def twin_nodes(session: AsyncSession = Depends(get_session)) -> dict:
    nodes = (await session.execute(select(Node))).scalars().all()
    edges = (await session.execute(select(Edge))).scalars().all()
    return {
        "nodes": [
            {
                "id": node.id,
                "node_type": node.node_type,
                "name": node.name,
                "lat": node.lat,
                "lon": node.lon,
                "capacity_value": node.capacity_value,
                "capacity_unit": node.capacity_unit,
                "source_note": node.source_note,
            }
            for node in nodes
        ],
        "edges": [
            {
                "id": edge.id,
                "from_node_id": edge.from_node_id,
                "to_node_id": edge.to_node_id,
                "edge_type": edge.edge_type,
                "capacity_value": edge.capacity_value,
                "source_note": edge.source_note,
            }
            for edge in edges
        ],
    }
