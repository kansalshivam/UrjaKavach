"""Scenario Simulation calculations.

Implements the cascading projection logic for the Hormuz partial closure scenario
calibrated against FINAL_ALIGNED_DOSSIER §1-2 real 2026 data.
"""
from __future__ import annotations

import logging
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import ScenarioRun

logger = logging.getLogger(__name__)

# SPR baseline days of cover (Dossier Part 0 / HLD-LLD §2.7)
SPR_BASELINE_DAYS = 9.5


def calculate_scenario_effects(capacity_available_pct: float) -> tuple[float, float]:
    """Compute projected import volume change and remaining SPR days cover.

    Calibrated anchors:
    - 100% capacity available -> 0% import change, 9.5 SPR days cover
    - 30% capacity available -> -23% import change, 2.6 SPR days cover (after 30-day drawdown)
    """
    # Linear interpolation of import change: (100 -> 0%, 30 -> -23%, 0 -> -32.8%)
    import_volume_change_pct = -(100.0 - capacity_available_pct) * (23.0 / 70.0)

    # SPR days cover remaining after 30-day drawdown at the shortfall rate
    shortfall_ratio = abs(import_volume_change_pct) / 100.0
    projected_spr_days_cover = max(0.0, SPR_BASELINE_DAYS - (30.0 * shortfall_ratio))

    logger.info(
        "Scenario calculations: capacity=%s%%, import_change=%.2f%%, spr_cover=%.2f days",
        capacity_available_pct, import_volume_change_pct, projected_spr_days_cover,
    )
    return import_volume_change_pct, projected_spr_days_cover


async def run_scenario(
    session: AsyncSession,
    scenario_id: str,
    capacity_available_pct: float,
) -> ScenarioRun:
    """Run the scenario engine and write the run to the scenario_runs table."""
    import_change, spr_cover = calculate_scenario_effects(capacity_available_pct)

    # Narrative placeholder (to be updated in Phase 8 via LLM)
    narrative = (
        f"Under a {scenario_id} scenario with {capacity_available_pct:.0f}% capacity available, "
        f"India's crude imports are projected to drop by {abs(import_change):.1f}%. "
        f"Strategic reserves (SPR) days of cover will deplete to {spr_cover:.1f} days over a 30-day window."
    )

    run = ScenarioRun(
        scenario_id=scenario_id,
        capacity_available_pct=capacity_available_pct,
        projected_import_volume_change_pct=import_change,
        projected_spr_days_cover=spr_cover,
        narrative_text=narrative,
    )
    session.add(run)
    await session.commit()
    await session.refresh(run)

    return run
