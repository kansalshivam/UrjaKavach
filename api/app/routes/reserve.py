from fastapi import APIRouter
from pydantic import BaseModel
from typing import List

router = APIRouter(prefix="/api/reserve", tags=["reserve"])

class CavernStatus(BaseModel):
    name: str
    capacity_mmt: float
    fill_pct: float
    current_stock_mmt: float

class ReserveCalculationRequest(BaseModel):
    shortfall_pct: float  # 0 to 100
    use_isprl: bool
    use_omc: bool
    use_diversification: bool

class ReserveCalculationResponse(BaseModel):
    isprl_available_barrels: float
    omc_available_barrels: float
    total_available_barrels: float
    raw_shortfall_barrels_day: float
    mitigated_shortfall_barrels_day: float
    days_cover_remaining: float
    iea_benchmark_days: float
    caverns: List[CavernStatus]

@router.post("/calculate", response_model=ReserveCalculationResponse)
def calculate_reserve_drawdown(req: ReserveCalculationRequest):
    # Real Ground-Truth Data from Dossier Part 0:
    # Total consumption ~ 5.0 million barrels / day.
    # Imports ~ 88% of consumption = 4.4 million barrels / day.
    # Conversion rate: 1 MMT ~ 7.33 million barrels.
    # IEA target: 90 days cover.
    bar_per_mmt = 7.33
    total_consumption_bpd = 5000000.0
    total_imports_bpd = 4400000.0

    # Dossier Part 0 (Line 21): Actual stock stood at ~3.372 MMT (approx 63.26% of 5.33 MMT capacity).
    # Reconciled to sum up to exactly 3.372 MMT across caverns:
    caverns = [
        CavernStatus(name="Visakhapatnam", capacity_mmt=1.33, fill_pct=63.26, current_stock_mmt=0.8414),
        CavernStatus(name="Mangaluru", capacity_mmt=1.50, fill_pct=63.26, current_stock_mmt=0.9490),
        CavernStatus(name="Padur", capacity_mmt=2.50, fill_pct=63.26, current_stock_mmt=1.5816)
    ]

    total_isprl_stock_mmt = 3.372
    isprl_available_barrels = total_isprl_stock_mmt * bar_per_mmt * 1000000.0  # Exactly 24,716,760 barrels

    # OMC Commercial Buffer (64.5 days of national consumption cover, Dossier Line 21)
    # Measured against total consumption (5.0M bpd): 64.5 * 5.0M = 322.5M barrels.
    omc_available_barrels = 64.5 * total_consumption_bpd

    # Shortfall calculations (shortfall is calculated against import requirement of 4.4M bpd)
    raw_shortfall_bpd = total_imports_bpd * (req.shortfall_pct / 100.0)

    # HEURISTIC MODELING ASSUMPTION: 
    # We model the 15% non-Hormuz sourcing share increase (from 55% to 70%) as a direct 15% volume mitigation 
    # of total imports (4.4M bpd * 0.15 = 660,000 bpd offset).
    mitigated_shortfall_bpd = raw_shortfall_bpd
    if req.use_diversification:
        mitigation_bpd = total_imports_bpd * 0.15
        mitigated_shortfall_bpd = max(0.0, raw_shortfall_bpd - mitigation_bpd)

    # Reserves pool selection
    total_avail_barrels = 0.0
    if req.use_isprl:
        total_avail_barrels += isprl_available_barrels
    if req.use_omc:
        total_avail_barrels += omc_available_barrels

    # Days cover remaining
    if mitigated_shortfall_bpd > 0:
        days_cover = total_avail_barrels / mitigated_shortfall_bpd
    else:
        days_cover = 365.0  # Cap display at 365

    return ReserveCalculationResponse(
        isprl_available_barrels=round(isprl_available_barrels, 1),
        omc_available_barrels=round(omc_available_barrels, 1),
        total_available_barrels=round(total_avail_barrels, 1),
        raw_shortfall_barrels_day=round(raw_shortfall_bpd, 1),
        mitigated_shortfall_barrels_day=round(mitigated_shortfall_bpd, 1),
        days_cover_remaining=round(days_cover, 1),
        iea_benchmark_days=90.0,
        caverns=caverns
    )
