import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy import select, delete
from datetime import datetime, timedelta, timezone
from app.main import app
from app.db.session import SessionLocal, engine
from app.db.models import GeopoliticalAlert, SecurityAuditLog
from app.scoring.risk_score import trigger_geopolitical_alert

@pytest.fixture(autouse=True)
async def cleanup_database_connections():
    # Clear the connection pool before the test starts
    await engine.dispose()
    yield
    # Clear it again after the test finishes
    await engine.dispose()

@pytest.mark.anyio
async def test_duplicate_alert_filter_integration():
    """Test duplicate alert filter:
    1. First alert lands in DB.
    2. Second alert within 1 hour is skipped.
    3. Third alert inserted with timestamp 2 hours ago allows a new alert to land.
    """
    async with SessionLocal() as session:
        # Clear existing alerts for the test corridor only to protect shared environment data
        await session.execute(delete(GeopoliticalAlert).where(GeopoliticalAlert.corridor == "test_corridor"))
        await session.commit()

        corridor = "test_corridor"
        alert_type = "test_alert_type"

        # 1. Trigger first alert (should be inserted)
        await trigger_geopolitical_alert(
            session=session,
            corridor=corridor,
            alert_type=alert_type,
            value=3.5,
            threshold=2.0,
            description="First test alert",
            raw_payload={"test": 1}
        )
        await session.commit()

        # Check DB count
        alerts = (await session.execute(
            select(GeopoliticalAlert).where(GeopoliticalAlert.corridor == corridor)
        )).scalars().all()
        assert len(alerts) == 1
        assert alerts[0].value == 3.5

        # 2. Trigger second alert immediately (should be skipped due to 1-hour duplicate window)
        await trigger_geopolitical_alert(
            session=session,
            corridor=corridor,
            alert_type=alert_type,
            value=4.5,
            threshold=2.0,
            description="Second test alert (duplicate)",
            raw_payload={"test": 2}
        )
        await session.commit()

        alerts = (await session.execute(
            select(GeopoliticalAlert).where(GeopoliticalAlert.corridor == corridor)
        )).scalars().all()
        assert len(alerts) == 1

        # 3. Simulate an alert 2 hours ago by updating the timestamp of the existing alert
        alerts[0].triggered_at = datetime.now(timezone.utc) - timedelta(hours=2)
        await session.commit()

        # Trigger third alert (should now be inserted since 2 hours have passed)
        await trigger_geopolitical_alert(
            session=session,
            corridor=corridor,
            alert_type=alert_type,
            value=5.5,
            threshold=2.0,
            description="Third test alert (after cooldown)",
            raw_payload={"test": 3}
        )
        await session.commit()

        alerts = (await session.execute(
            select(GeopoliticalAlert).where(GeopoliticalAlert.corridor == corridor)
        )).scalars().all()
        assert len(alerts) == 2
        # Clean up
        await session.execute(delete(GeopoliticalAlert).where(GeopoliticalAlert.corridor == corridor))
        await session.commit()


@pytest.mark.anyio
async def test_operator_id_spoofability_integration():
    """Test that client-supplied operator_id is ignored and the backend enforces 'IND-2026-OPS'."""
    # We do NOT use the dependency override get_session here, so that we hit the real DB
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Forge a client-supplied operator_id in the post request extra keys
        payload = {
            "action_source": "client_direct_post",
            "action_type": "TEST_SPOOF",
            "payload": {"data": "test"},
            "operator_id": "HACKER-SPOOFED-ID"
        }
        response = await ac.post("/api/audit/logs", json=payload)
    
    assert response.status_code == 200
    res_data = response.json()
    
    # Confirm the response returns the hardcoded ID, ignoring the client-supplied one
    assert res_data["operator_id"] == "IND-2026-OPS"
    
    # Query database to confirm it was stored as IND-2026-OPS
    async with SessionLocal() as session:
        result = await session.execute(
            select(SecurityAuditLog).where(SecurityAuditLog.action_source == "client_direct_post")
        )
        logs = result.scalars().all()
        assert len(logs) > 0
        for l in logs:
            assert l.operator_id == "IND-2026-OPS"
            
        # Clean up
        await session.execute(delete(SecurityAuditLog).where(SecurityAuditLog.action_source == "client_direct_post"))
        await session.commit()
