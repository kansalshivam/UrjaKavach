import asyncio
from app.db.session import SessionLocal
from app.scoring.risk_score import compute_and_store_risk_score

async def main():
    async with SessionLocal() as session:
        for corridor in ["hormuz", "non_hormuz_west_africa", "non_hormuz_americas", "non_hormuz_russia"]:
            # Trigger score computation
            score_row = await compute_and_store_risk_score(
                session=session,
                corridor=corridor,
                sanctions_count=0,
            )
            print(f"[{corridor}] Risk Score: {score_row.score:.2f} | GDELT: {score_row.component_gdelt_volume:.2f} | Price: {score_row.component_price_volatility:.2f} | AIS: {score_row.component_ais_deviation:.2f}")

if __name__ == "__main__":
    asyncio.run(main())
