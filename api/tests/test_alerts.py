import pytest
from httpx import AsyncClient, ASGITransport
from unittest.mock import AsyncMock
from datetime import datetime, timezone
from app.main import app
from app.db.session import get_session
from app.db.models import GeopoliticalAlert


class MockAlertsResult:
    def __init__(self, alerts):
        self._alerts = alerts

    def scalars(self):
        class MockScalars:
            def all(inner_self):
                return self._alerts
        return MockScalars()


# Mock data
MOCK_ALERTS = [
    GeopoliticalAlert(
        id=1,
        corridor="global",
        alert_type="price_volatility",
        triggered_at=datetime(2026, 7, 15, 12, 0, 0, tzinfo=timezone.utc),
        value=15.2,
        threshold=10.0,
        description="Brent crude spot price 3-day volatility reached 15.20% (threshold: 10.0%)",
        raw_payload={"price_volatility": 15.2}
    ),
    GeopoliticalAlert(
        id=2,
        corridor="hormuz",
        alert_type="gdelt_zscore",
        triggered_at=datetime(2026, 7, 15, 12, 10, 0, tzinfo=timezone.utc),
        value=2.5,
        threshold=2.0,
        description="GDELT article volume z-score for corridor 'hormuz' reached 2.50 (threshold: 2.0)",
        raw_payload={"z_score": 2.5}
    )
]


async def mock_get_session():
    session = AsyncMock()
    # Mock return for SELECT queries
    session.execute.return_value = MockAlertsResult(MOCK_ALERTS)
    yield session


@pytest.fixture(autouse=True)
def override_db():
    app.dependency_overrides[get_session] = mock_get_session
    yield
    app.dependency_overrides.pop(get_session, None)


@pytest.mark.anyio
async def test_list_alerts():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/alerts")
    assert response.status_code == 200
    data = response.json()
    assert "alerts" in data
    assert len(data["alerts"]) == 2
    assert data["alerts"][0]["id"] == 1
    assert data["alerts"][0]["corridor"] == "global"
    assert data["alerts"][1]["corridor"] == "hormuz"


@pytest.mark.anyio
async def test_export_alerts_csv():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/alerts/export")
    assert response.status_code == 200
    assert response.headers["content-type"] == "text/csv; charset=utf-8"
    assert "attachment; filename=geopolitical_alerts.csv" in response.headers["content-disposition"]
    csv_content = response.text
    assert "ID,Corridor,Alert Type,Triggered At,Value,Threshold,Description,Raw Payload" in csv_content
    assert "global,price_volatility" in csv_content
    assert "hormuz,gdelt_zscore" in csv_content
