import asyncio
import httpx
import sys
from datetime import datetime, timedelta, timezone
from sqlalchemy import select, delete
from app.db.session import SessionLocal
from app.db.models import GdeltArticle, PricePoint, RiskScore, AisSnapshot
from app.scoring.risk_score import compute_and_store_risk_score

BASE_URL = "http://localhost:8000"

async def stress_endpoint_edge_cases():
    print("=== STARTING ENDPOINT EDGE CASE STRESS TESTS ===")
    async with httpx.AsyncClient() as client:
        # 1. POST /api/scenario/run
        # Edge Case 1: Missing required fields
        res1 = await client.post(f"{BASE_URL}/api/scenario/run", json={})
        print(f"Scenario Run (Empty Payload): Status {res1.status_code}\nResponse: {res1.text}\n")
        
        # Edge Case 2: Negative capacity percent
        res2 = await client.post(f"{BASE_URL}/api/scenario/run", json={"scenario_id": "hormuz_partial_closure", "capacity_available_pct": -5.0})
        print(f"Scenario Run (Negative Capacity): Status {res2.status_code}\nResponse: {res2.text}\n")

        # Edge Case 3: Overflow capacity percent
        res3 = await client.post(f"{BASE_URL}/api/scenario/run", json={"scenario_id": "hormuz_partial_closure", "capacity_available_pct": 150.0})
        print(f"Scenario Run (Overflow Capacity): Status {res3.status_code}\nResponse: {res3.text}\n")

        # Edge Case 4: Invalid JSON format
        res4 = await client.post(f"{BASE_URL}/api/scenario/run", content="invalid-json-format", headers={"Content-Type": "application/json"})
        print(f"Scenario Run (Malformed JSON): Status {res4.status_code}\nResponse: {res4.text}\n")

        # 2. POST /api/reserve/calculate
        # Edge Case 1: Missing shortfall_pct
        res5 = await client.post(f"{BASE_URL}/api/reserve/calculate", json={"use_isprl": True})
        print(f"Reserve Calculate (Missing Shortfall): Status {res5.status_code}\nResponse: {res5.text}\n")

        # Edge Case 2: Out of bound shortfall
        res6 = await client.post(f"{BASE_URL}/api/reserve/calculate", json={"shortfall_pct": 105.0, "use_isprl": True, "use_omc": True, "use_diversification": True})
        print(f"Reserve Calculate (Shortfall > 100): Status {res6.status_code}\nResponse: {res6.text}\n")

        # 3. POST /api/rag/query
        # Edge Case 1: Empty query
        res7 = await client.post(f"{BASE_URL}/api/rag/query", json={"query": ""})
        print(f"RAG Query (Empty Query): Status {res7.status_code}\nResponse: {res7.text}\n")

        # Edge Case 2: Missing query field
        res8 = await client.post(f"{BASE_URL}/api/rag/query", json={})
        print(f"RAG Query (Missing Query): Status {res8.status_code}\nResponse: {res8.text}\n")

        # 4. POST /api/twin/recompute
        # Edge Case 1: Weights sum is 2.0 (does not equal 1.0)
        res9 = await client.post(f"{BASE_URL}/api/twin/recompute", json={
            "gdelt_volume": 0.5,
            "price_volatility": 0.5,
            "ais_deviation": 0.5,
            "sanctions_flag": 0.5
        })
        print(f"Twin Recompute (Sum 2.0): Status {res9.status_code}\nResponse: {res9.text}\n")

        # Edge Case 2: Negative weights
        res10 = await client.post(f"{BASE_URL}/api/twin/recompute", json={
            "gdelt_volume": -0.2,
            "price_volatility": 0.5,
            "ais_deviation": 0.5,
            "sanctions_flag": 0.2
        })
        print(f"Twin Recompute (Negative Weight): Status {res10.status_code}\nResponse: {res10.text}\n")

        # 5. GET /api/alerts
        # Edge Case 1: Unknown corridor param
        res11 = await client.get(f"{BASE_URL}/api/alerts?corridor=unknown_corridor")
        print(f"Get Alerts (Unknown Corridor): Status {res11.status_code}\nResponse: {res11.text}\n")

        # 6. GET /api/procurement/recommendations
        # Edge Case 1: Negative capacity
        res12 = await client.get(f"{BASE_URL}/api/procurement/recommendations?capacity_available_pct=-10.0")
        print(f"Procurement Recommendations (Negative Capacity): Status {res12.status_code}\nResponse: {res12.text}\n")


async def stress_stale_flag_behavior():
    print("=== STARTING STALE-FLAG FORCED BEHAVIOR TESTS ===")
    async with SessionLocal() as session:
        # Clear existing data to avoid baseline interference
        await session.execute(delete(GdeltArticle))
        await session.execute(delete(PricePoint))
        await session.execute(delete(AisSnapshot))
        await session.execute(delete(RiskScore))
        await session.commit()

        now = datetime.now(timezone.utc)

        # 1. Force GDELT & EIA Staleness
        # Insert GDELT article fetched 30 minutes ago (> 25 min threshold)
        gdelt_stale_time = now - timedelta(minutes=30)
        session.add(GdeltArticle(
            corridor="hormuz",
            query="hormuz",
            title="Stale Article Test",
            url="http://example.com/stale-gdelt",
            domain="example.com",
            seendate="20260715",
            fetched_at=gdelt_stale_time
        ))

        # Insert PricePoint fetched 130 minutes ago (> 120 min threshold)
        price_stale_time = now - timedelta(minutes=130)
        session.add(PricePoint(
            series="RBRTE",
            source="EIA",
            period="2026-07-10",
            value=70.0,
            fetched_at=price_stale_time
        ))
        await session.commit()

        # Run scoring run for 'hormuz'
        print("Running compute_and_store_risk_score with GDELT/EIA stale records...")
        score_row = await compute_and_store_risk_score(
            session=session,
            corridor="hormuz",
            sanctions_count=0,
            ais_stale=False,
            sanctions_stale=False
        )

        print(f"Scoring result: score={score_row.score}")
        print(f"Stale flags check: GDELT={score_row.component_gdelt_stale}, Price={score_row.component_price_stale}, AIS={score_row.component_ais_stale}, Sanctions={score_row.component_sanctions_stale}")
        assert score_row.component_gdelt_stale is True, "GDELT should be marked stale!"
        assert score_row.component_price_stale is True, "Price should be marked stale!"
        assert score_row.component_ais_stale is False, "AIS should NOT be marked stale!"
        assert score_row.component_sanctions_stale is False, "Sanctions should NOT be marked stale!"
        print("Stale GDELT & EIA verification: SUCCESS\n")

        # 2. Force AIS & Sanctions Staleness
        # Run scoring run with ais_stale=True, sanctions_stale=True
        print("Running compute_and_store_risk_score with explicit AIS/Sanctions stale flags...")
        score_row_2 = await compute_and_store_risk_score(
            session=session,
            corridor="hormuz",
            sanctions_count=0,
            ais_stale=True,
            sanctions_stale=True
        )

        print(f"Scoring result 2: score={score_row_2.score}")
        print(f"Stale flags check 2: GDELT={score_row_2.component_gdelt_stale}, Price={score_row_2.component_price_stale}, AIS={score_row_2.component_ais_stale}, Sanctions={score_row_2.component_sanctions_stale}")
        assert score_row_2.component_ais_stale is True, "AIS should be marked stale!"
        assert score_row_2.component_sanctions_stale is True, "Sanctions should be marked stale!"
        print("Stale AIS & Sanctions verification: SUCCESS\n")


async def main():
    try:
        await stress_endpoint_edge_cases()
        await stress_stale_flag_behavior()
        print("=== ALL STRESS AND INTEGRITY CHECKS COMPLETED SUCCESSFULLY ===")
    except AssertionError as ae:
        print(f"Assertion failed during verification: {ae}")
        sys.exit(1)
    except Exception as e:
        print(f"Unexpected error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
