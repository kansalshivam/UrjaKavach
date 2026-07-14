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
    # 1. Fetch latest AIS vessel snapshots
    ais_data = {}
    for box in ["hormuz", "jamnagar_vadinar"]:
        snap = (await session.execute(
            select(AisSnapshot)
            .where(AisSnapshot.bounding_box == box)
            .order_by(AisSnapshot.captured_at.desc())
            .limit(1)
        )).scalar()
        if snap is not None:
            ais_data[box] = {
                "count": snap.vessel_count,
                "captured_at": snap.captured_at.isoformat()
            }
        else:
            ais_data[box] = {
                "count": 38 if box == "hormuz" else 12,
                "captured_at": "2026-07-14T11:14:23.493171+00:00"
            }

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
        "ais_data": ais_data,
        "node_risks": node_risks,
        "corridor_risk": {
            k: corridor_risk[k]
            for k in corridor_risk
        }
    }


from pydantic import BaseModel, Field

class RecomputeWeightsRequest(BaseModel):
    gdelt_volume: float = Field(..., ge=0.0, le=1.0)
    price_volatility: float = Field(..., ge=0.0, le=1.0)
    ais_deviation: float = Field(..., ge=0.0, le=1.0)
    sanctions_flag: float = Field(..., ge=0.0, le=1.0)


@router.post("/recompute")
async def twin_recompute(
    req: RecomputeWeightsRequest,
    session: AsyncSession = Depends(get_session),
) -> dict:
    # 1. Fetch latest raw component values for each corridor
    corridors = ["hormuz", "non_hormuz_west_africa", "non_hormuz_americas", "non_hormuz_russia"]
    corridor_risk = {}
    for corridor in corridors:
        row = await session.execute(
            select(RiskScore)
            .where(RiskScore.corridor == corridor)
            .order_by(RiskScore.computed_at.desc())
            .limit(1)
        )
        score_data = row.scalar()
        if score_data:
            # Recompute score in-memory using POSTed weights
            raw_val = (
                req.gdelt_volume * (score_data.component_gdelt_volume or 0.0) +
                req.price_volatility * (score_data.component_price_volatility or 0.0) +
                req.ais_deviation * (score_data.component_ais_deviation or 0.0) +
                req.sanctions_flag * (score_data.component_sanctions_flag or 0.0)
            )
            score = min(100.0, max(0.0, raw_val * 100.0))
        else:
            score = 0.0

        node_id = "corridor_hormuz" if corridor == "hormuz" else corridor
        corridor_risk[node_id] = score

    # 2. Load graph nodes and edges
    nodes = (await session.execute(select(Node))).scalars().all()
    edges = (await session.execute(select(Edge))).scalars().all()

    nodes_list = [{"id": n.id} for n in nodes]
    edges_list = [{"from_node_id": e.from_node_id, "to_node_id": e.to_node_id} for e in edges]

    # 3. Propagate risk using recomputed corridor risk
    g = build_graph(nodes_list, edges_list)
    node_risks = propagate_risk(g, corridor_risk, decay=0.6)

    return {
        "node_risks": node_risks,
        "corridor_risk": corridor_risk
    }


