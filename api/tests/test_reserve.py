import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.anyio
async def test_reserve_calculation_isprl_only():
    payload = {
        "shortfall_pct": 30.0,
        "use_isprl": True,
        "use_omc": False,
        "use_diversification": True
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/reserve/calculate", json=payload)
    
    assert response.status_code == 200
    data = response.json()
    assert data["isprl_available_barrels"] == 25004096.0
    assert data["omc_available_barrels"] == 283800000.0
    assert data["total_available_barrels"] == 25004096.0
    assert data["raw_shortfall_barrels_day"] == 1320000.0
    assert data["mitigated_shortfall_barrels_day"] == 660000.0
    assert data["days_cover_remaining"] == 37.9
    assert len(data["caverns"]) == 3
    assert data["caverns"][0]["name"] == "Visakhapatnam"

@pytest.mark.anyio
async def test_reserve_calculation_both_buffers():
    payload = {
        "shortfall_pct": 30.0,
        "use_isprl": True,
        "use_omc": True,
        "use_diversification": False
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/reserve/calculate", json=payload)
    
    assert response.status_code == 200
    data = response.json()
    assert data["total_available_barrels"] == 25004096.0 + 283800000.0
    assert data["mitigated_shortfall_barrels_day"] == 1320000.0
    assert data["days_cover_remaining"] == round((25004096.0 + 283800000.0) / 1320000.0, 1)
