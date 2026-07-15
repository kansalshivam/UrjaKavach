import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.anyio
async def test_procurement_recommendations():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/procurement/recommendations?capacity_available_pct=50.0")
    
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 5
    
    # Assert ranking order and key fields are present
    assert data[0]["rank"] == 1
    assert data[0]["country"] == "Russia"
    assert "suitability_score" in data[0]
    assert "actual_2026_role" in data[0]

@pytest.mark.anyio
async def test_procurement_recommendations_bounds():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/procurement/recommendations?capacity_available_pct=150.0")
    assert response.status_code == 422
