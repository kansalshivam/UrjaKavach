"""Tests for Digital Twin Map API routes."""
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.db.session import get_session
from unittest.mock import AsyncMock


class MockResult:
    def __init__(self, value=None):
        self._value = value

    def scalar(self):
        return self._value

    def scalars(self):
        class MockScalars:
            def all(self):
                return []
        return MockScalars()

    def all(self):
        return []


async def mock_get_session():
    from unittest.mock import MagicMock
    session = AsyncMock()
    session.add = MagicMock()
    session.execute.return_value = MockResult()
    session.scalar.return_value = None
    yield session


@pytest.fixture(autouse=True)
def override_db():
    app.dependency_overrides[get_session] = mock_get_session
    yield
    app.dependency_overrides.pop(get_session, None)


@pytest.mark.anyio
async def test_twin_live():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/twin/live")
    assert response.status_code == 200
    data = response.json()
    assert "ais_data" in data
    assert "hormuz" in data["ais_data"]
    assert "count" in data["ais_data"]["hormuz"]
    assert "captured_at" in data["ais_data"]["hormuz"]
    assert "node_risks" in data
    assert "corridor_risk" in data


@pytest.mark.anyio
async def test_twin_recompute():
    payload = {
        "gdelt_volume": 0.35,
        "price_volatility": 0.25,
        "ais_deviation": 0.30,
        "sanctions_flag": 0.10
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/twin/recompute", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "node_risks" in data
    assert "corridor_risk" in data


@pytest.mark.anyio
async def test_twin_recompute_invalid_weights():
    payload = {
        "gdelt_volume": 0.5,
        "price_volatility": 0.5,
        "ais_deviation": 0.5,
        "sanctions_flag": 0.5
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/twin/recompute", json=payload)
    assert response.status_code == 422
    assert "value_error" in response.text

