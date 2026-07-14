"""Scenario Simulator routes."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.scoring.scenario import run_scenario

router = APIRouter(prefix="/api/scenario", tags=["scenario"])


class ScenarioRequest(BaseModel):
    scenario_id: str = Field(..., examples=["hormuz_partial_closure"])
    capacity_available_pct: float = Field(..., ge=0.0, le=100.0, examples=[50.0])


@router.post("/run")
async def execute_scenario(
    payload: ScenarioRequest,
    session: AsyncSession = Depends(get_session),
) -> dict:
    if payload.scenario_id != "hormuz_partial_closure":
        raise HTTPException(
            status_code=400,
            detail=f"Scenario ID '{payload.scenario_id}' is not supported in this version."
        )

    run = await run_scenario(
        session=session,
        scenario_id=payload.scenario_id,
        capacity_available_pct=payload.capacity_available_pct,
    )

    return {
        "id": run.id,
        "scenario_id": run.scenario_id,
        "capacity_available_pct": run.capacity_available_pct,
        "run_at": run.run_at.isoformat(),
        "projected_import_volume_change_pct": run.projected_import_volume_change_pct,
        "projected_spr_days_cover": run.projected_spr_days_cover,
        "narrative_text": run.narrative_text,
    }
