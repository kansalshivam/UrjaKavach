import asyncio
import httpx
from app.db.session import SessionLocal
from app.db.models import GeopoliticalAlert
from sqlalchemy import delete

async def test_csv_adv():
    # Insert raw payload with quotes, commas, and newlines
    async with SessionLocal() as session:
        # Clear existing alerts
        await session.execute(delete(GeopoliticalAlert))
        await session.commit()

        alert = GeopoliticalAlert(
            corridor="hormuz",
            alert_type="test_adv_csv",
            value=8.8,
            threshold=5.0,
            description='Alert with, comma, "quotes", and\nnewline.',
            raw_payload={"nested": 'Value, with "quotes" and\nnewline.'}
        )
        session.add(alert)
        await session.commit()
        print("Alert inserted successfully.")

    # Call CSV export endpoint via httpx
    async with httpx.AsyncClient() as client:
        r = await client.get('http://localhost:8000/api/alerts/export')
        print("=== CSV RESPONSE STATUS ===")
        print(r.status_code)
        print("=== RAW CSV BYTES ===")
        print(repr(r.text))

    # Clean up
    async with SessionLocal() as session:
        await session.execute(delete(GeopoliticalAlert))
        await session.commit()
        print("Cleaned up database.")

asyncio.run(test_csv_adv())
