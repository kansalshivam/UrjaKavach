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
    # Real Ground-Truth Data from Dossier:
    # 1 MMT ~ 7.33 million barrels of crude oil.
    # Total consumption ~ 5.0 million barrels / day.
    # Imports ~ 88% of consumption = 4.4 million barrels / day.
    bar_per_mmt = 7.33
    total_imports_bpd = 4400000.0

    # Caverns stock (March 2026 RTI disclosure: 64% average fill level)
    caverns = [
        CavernStatus(name="Visakhapatnam", capacity_mmt=1.33, fill_pct=64.0, current_stock_mmt=1.33 * 0.64),
        CavernStatus(name="Mangaluru", capacity_mmt=1.50, fill_pct=64.0, current_stock_mmt=1.50 * 0.64),
        CavernStatus(name="Padur", capacity_mmt=2.50, fill_pct=64.0, current_stock_mmt=2.50 * 0.64)
    ]

    total_isprl_stock_mmt = sum(c.current_stock_mmt for c in caverns)
    isprl_available_barrels = total_isprl_stock_mmt * bar_per_mmt * 1000000.0

    # OMC Commercial Buffer (64.5 days cover)
    omc_available_barrels = 64.5 * total_imports_bpd

    # Shortfall calculations
    raw_shortfall_bpd = total_imports_bpd * (req.shortfall_pct / 100.0)

    # Procurement Diversification mitigation (non-Hormuz share increase from 55% to 70% = 15% reduction in import shortfall risk)
    mitigated_shortfall_bpd = raw_shortfall_bpd
    if req.use_diversification:
        mitigation_bpd = total_imports_bpd * 0.15
        mitigated_shortfall_bpd = max(0.0, raw_shortfall_bpd - mitigation_bpd)

    # Reserves pool
    total_avail_barrels = 0.0
    if req.use_isprl:
        total_avail_barrels += isprl_available_barrels
    if req.use_omc:
        total_avail_barrels += omc_available_barrels

    # Days cover remaining
    if mitigated_shortfall_bpd > 0:
        days_cover = total_avail_barrels / mitigated_shortfall_bpd
    else:
        days_cover = 365.0  # Cap display at 1 year / stable state

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
