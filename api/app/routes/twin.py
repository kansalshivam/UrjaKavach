from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import AisSnapshot, Edge, Node, RiskScore
from app.db.session import get_session
from app.graph.propagation import build_graph, propagate_risk

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


@router.get("/live")
async def twin_live(session: AsyncSession = Depends(get_session)) -> dict:
    # 1. Fetch latest AIS vessel counts (Hormuz: 38, Jamnagar/Vadinar: 12 as fallback if empty)
    ais_counts = {}
    for box in ["hormuz", "jamnagar_vadinar"]:
        count = await session.scalar(
            select(AisSnapshot.vessel_count)
            .where(AisSnapshot.bounding_box == box)
            .order_by(AisSnapshot.captured_at.desc())
            .limit(1)
        )
        if count is None:
            count = 38 if box == "hormuz" else 12
        ais_counts[box] = count

    # 2. Fetch latest risk scores for each corridor
    corridors = ["hormuz", "non_hormuz_west_africa", "non_hormuz_americas", "non_hormuz_russia"]
    corridor_risk = {}
    for corridor in corridors:
        score = await session.scalar(
            select(RiskScore.score)
            .where(RiskScore.corridor == corridor)
            .order_by(RiskScore.computed_at.desc())
            .limit(1)
        )
        if score is None:
            score = 0.0
        # Map "hormuz" to the node ID "corridor_hormuz" in the seeded graph
        node_id = "corridor_hormuz" if corridor == "hormuz" else corridor
        corridor_risk[node_id] = score

    # 3. Load graph and propagate risk
    nodes = (await session.execute(select(Node))).scalars().all()
    edges = (await session.execute(select(Edge))).scalars().all()

    nodes_list = [{"id": n.id} for n in nodes]
    edges_list = [{"from_node_id": e.from_node_id, "to_node_id": e.to_node_id} for e in edges]

    g = build_graph(nodes_list, edges_list)
    node_risks = propagate_risk(g, corridor_risk, decay=0.6)

    return {
        "ais_counts": ais_counts,
        "node_risks": node_risks,
        "corridor_risk": {
            k: corridor_risk[k]
            for k in corridor_risk
        }
    }

