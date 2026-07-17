import asyncio
from app.db.session import SessionLocal
from app.db.models import RiskScore
from sqlalchemy import select

async def main():
    async with SessionLocal() as session:
        result = await session.execute(
            select(RiskScore).order_by(RiskScore.computed_at.desc()).limit(10)
        )
        rows = result.scalars().all()
        for r in rows:
            print(f"Corridor: {r.corridor}, Score: {r.score}")
            print(f"  GDELT: {r.component_gdelt_volume} (stale={r.component_gdelt_stale})")
            print(f"  Price: {r.component_price_volatility} (stale={r.component_price_stale})")
            print(f"  AIS: {r.component_ais_deviation} (stale={r.component_ais_stale})")
            print(f"  Sanctions: {r.component_sanctions_flag} (stale={r.component_sanctions_stale})")
            print(f"  Weights: {r.weights_used}")
            print(f"  Computed At: {r.computed_at}")
            print("-" * 40)

if __name__ == "__main__":
    asyncio.run(main())
