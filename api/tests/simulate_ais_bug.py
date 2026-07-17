import asyncio
from datetime import datetime, timezone, timedelta
from app.db.session import SessionLocal
from app.db.models import AisSnapshot
from app.scoring.risk_score import compute_and_store_risk_score

async def main():
    async with SessionLocal() as session:
        # Clear existing snapshots
        from sqlalchemy import delete
        await session.execute(delete(AisSnapshot))
        
        now = datetime.now(timezone.utc)
        # 1. Insert Hormuz snapshots (ratio: 50/100 = 0.50 -> normalized: 1.0 - 0.5 = 0.50)
        for i in range(10):
            session.add(AisSnapshot(bounding_box='hormuz', vessel_count=100, captured_at=now - timedelta(days=i+1)))
        session.add(AisSnapshot(bounding_box='hormuz', vessel_count=50, captured_at=now - timedelta(minutes=10)))
        
        # 2. Insert West Africa snapshots (ratio: 180/200 = 0.90 -> normalized: 1.0 - 0.9 = 0.10)
        for i in range(10):
            session.add(AisSnapshot(bounding_box='non_hormuz_west_africa', vessel_count=200, captured_at=now - timedelta(days=i+1)))
        session.add(AisSnapshot(bounding_box='non_hormuz_west_africa', vessel_count=180, captured_at=now - timedelta(minutes=10)))
        
        await session.commit()
        
        print("--- RUNNING WITH HARCODED HORMUZ AIS DEV ---")
        for corridor in ['hormuz', 'non_hormuz_west_africa', 'non_hormuz_americas', 'non_hormuz_russia']:
            score_row = await compute_and_store_risk_score(session=session, corridor=corridor, sanctions_count=0)
            print(f"[{corridor}] AIS component value: {score_row.component_ais_deviation:.2f}")

if __name__ == "__main__":
    asyncio.run(main())
