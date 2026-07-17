"""Tests for Security Audit Log routes."""
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.db.session import get_session
from unittest.mock import AsyncMock
from datetime import datetime

class MockResult:
    def __init__(self, value=None):
        self._value = value

    def scalar(self):
        return self._value

    def scalars(self):
        class MockScalars:
            def all(self):
                # Return dummy SecurityAuditLog object for testing GET
                class DummyLog:
                    id = 1
                    timestamp = datetime.now()
                    operator_id = "IND-2026-OPS"
                    action_source = "dashboard_weight_adjustment"
                    action_type = "UPDATE_WEIGHTS"
                    payload = {"test": True}
                return [DummyLog()]
        return MockScalars()


async def mock_get_session():
    from unittest.mock import MagicMock
    session = AsyncMock()
    session.add = MagicMock()
    session.execute.return_value = MockResult()
    yield session


@pytest.fixture(autouse=True)
def override_db():
    app.dependency_overrides[get_session] = mock_get_session
    yield
    app.dependency_overrides.pop(get_session, None)


@pytest.mark.anyio
async def test_get_audit_logs():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/audit/logs")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["operator_id"] == "IND-2026-OPS"
    assert data[0]["action_source"] == "dashboard_weight_adjustment"


@pytest.mark.anyio
async def test_create_audit_log():
    payload = {
        "action_source": "scenario_run",
        "action_type": "RUN_SIMULATION",
        "payload": {"capacity": 50.0}
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/audit/logs", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["operator_id"] == "IND-2026-OPS"
    assert data["action_source"] == "scenario_run"
    assert data["action_type"] == "RUN_SIMULATION"
