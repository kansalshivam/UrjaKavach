from fastapi import APIRouter

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/summary")
async def dashboard_summary() -> dict:
    return {
        "risk_scores": [],
        "recent_articles": [],
        "weights_used": {
            "gdelt_volume": 0.35,
            "price_volatility": 0.25,
            "ais_deviation": 0.30,
            "sanctions_flag": 0.10,
        },
        "phase": "foundation",
    }
