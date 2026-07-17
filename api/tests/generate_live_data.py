import asyncio
from datetime import datetime, timezone, timedelta
from app.db.session import SessionLocal
from app.db.models import AisSnapshot
from app.scheduler import run_risk_score_compute

async def main():
    async with SessionLocal() as session:
        # Clear existing snapshots
        from sqlalchemy import delete
        await session.execute(delete(AisSnapshot))
        
        now = datetime.now(timezone.utc)
        
        # 1. Hormuz: current=80, baseline=100 -> ratio=0.80 -> normalized deviation = 0.20
        for i in range(10):
            session.add(AisSnapshot(bounding_box='hormuz', vessel_count=100, captured_at=now - timedelta(days=i+1)))
        session.add(AisSnapshot(bounding_box='hormuz', vessel_count=80, captured_at=now - timedelta(minutes=10)))
        
        # 2. West Africa: current=40, baseline=100 -> ratio=0.40 -> normalized deviation = 0.60
        for i in range(10):
            session.add(AisSnapshot(bounding_box='non_hormuz_west_africa', vessel_count=100, captured_at=now - timedelta(days=i+1)))
        session.add(AisSnapshot(bounding_box='non_hormuz_west_africa', vessel_count=40, captured_at=now - timedelta(minutes=10)))
        
        # 3. Americas: current=90, baseline=100 -> ratio=0.90 -> normalized deviation = 0.10
        for i in range(10):
            session.add(AisSnapshot(bounding_box='non_hormuz_americas', vessel_count=100, captured_at=now - timedelta(days=i+1)))
        session.add(AisSnapshot(bounding_box='non_hormuz_americas', vessel_count=90, captured_at=now - timedelta(minutes=10)))
        
        # 4. Russia: current=100, baseline=100 -> ratio=1.00 -> normalized deviation = 0.00
        for i in range(10):
            session.add(AisSnapshot(bounding_box='non_hormuz_russia', vessel_count=100, captured_at=now - timedelta(days=i+1)))
        session.add(AisSnapshot(bounding_box='non_hormuz_russia', vessel_count=100, captured_at=now - timedelta(minutes=10)))
        
        # 5. Jamnagar/Vadinar: current=11, baseline=12 -> ratio=0.92 -> normalized deviation = 0.08
        for i in range(10):
            session.add(AisSnapshot(bounding_box='jamnagar_vadinar', vessel_count=12, captured_at=now - timedelta(days=i+1)))
        session.add(AisSnapshot(bounding_box='jamnagar_vadinar', vessel_count=11, captured_at=now - timedelta(minutes=10)))
        
        await session.commit()
        print("Distinct AIS snapshots successfully generated in database.")

if __name__ == "__main__":
    asyncio.run(main())
