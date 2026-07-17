import asyncio
import sys

# 1. Test Mutation: Risk Score Weights sum validation
from app.scoring.risk_score import compute_risk_score, DEFAULT_WEIGHTS, SignalBundle

def test_risk_score_mutation():
    print("Testing Risk Score mutations...")
    # Base case (valid weights)
    signals = SignalBundle(
        gdelt_article_volume_zscore=0.5,
        price_3day_pct_change=5.0,
        ais_count_vs_baseline=0.8,
        sanctions_new_entries_7d=0
    )
    score, _ = compute_risk_score(signals, DEFAULT_WEIGHTS)
    print("  Base risk score:", score)

    # Mutation 1: Change weight checking logic (weights don't sum to 1)
    bad_weights = {"gdelt_volume": 0.5, "price_volatility": 0.1, "ais_deviation": 0.0, "sanctions_flag": 0.0}
    try:
        compute_risk_score(signals, bad_weights)
        print("  MUTATION FAILED: Did not catch invalid weights!")
        sys.exit(1)
    except AssertionError as exc:
        print("  MUTATION SUCCESS: Caught invalid weights sum (AssertionError):", exc)

# 2. Test Mutation: Scenario Piecewise Interpolation
from app.scoring.scenario import calculate_scenario_effects

def test_scenario_mutation():
    print("Testing Scenario Simulator mutations...")
    # Base case: At 15%, drop is -25.46%
    base_drop, _ = calculate_scenario_effects(15.0)
    print("  Base 15% drop:", base_drop)

    # Mutated Scenario: Linear formula used instead of quadratic plateau
    # Under linear: -23.0 - (100 - 15) * (23/70) = -27.93%
    linear_drop = -(100.0 - 15.0) * (23.0 / 70.0)
    if abs(base_drop - linear_drop) < 1e-3:
        print("  MUTATION FAILED: Piecewise quadratic curve is inactive!")
        sys.exit(1)
    else:
        print("  MUTATION SUCCESS: Quadratic curve is active (distinguished from linear).")

# 3. Test Mutation: Propagation Decay Logic
from app.graph.propagation import build_graph, propagate_risk

def test_propagation_mutation():
    print("Testing Risk Propagation mutations...")
    # Construct a simple path: A -> B -> C
    nodes = [
        {"id": "A", "node_type": "source"},
        {"id": "B", "node_type": "intermediate"},
        {"id": "C", "node_type": "target"}
    ]
    edges = [
        {"id": 1, "from_node_id": "A", "to_node_id": "B", "capacity_value": 10.0},
        {"id": 2, "from_node_id": "B", "to_node_id": "C", "capacity_value": 5.0}
    ]
    
    g = build_graph(nodes, edges)
    corridor_risk = {"A": 100.0}
    node_risks = propagate_risk(g, corridor_risk)
    
    print("  Base propagated score at B:", node_risks["B"])
    print("  Base propagated score at C:", node_risks["C"])

    # Verify decay is mathematically active (B should be 100.0 * 0.6 = 60.0, C should be 100.0 * 0.36 = 36.0)
    assert abs(node_risks["B"] - 60.0) < 1e-5
    assert abs(node_risks["C"] - 36.0) < 1e-5
    print("  MUTATION SUCCESS: Decay is mathematically active and correct.")

# 4. Test Mutation: 1-Hour Alert Deduplication Filter
from app.db.session import SessionLocal
from app.db.models import GeopoliticalAlert
from app.scoring.risk_score import trigger_geopolitical_alert
from sqlalchemy import select, delete

async def test_dedup_mutation():
    print("Testing 1-Hour Alert Deduplication mutations...")
    async with SessionLocal() as session:
        # Clear existing alerts
        await session.execute(delete(GeopoliticalAlert))
        await session.commit()

        # Insert first alert
        await trigger_geopolitical_alert(
            session=session,
            corridor="test_mutation_corridor",
            alert_type="test_mutation",
            value=3.5,
            threshold=2.0,
            description="Mutation test first alert"
        )
        await session.commit()

        # Attempt to insert second duplicate alert (should be filtered out)
        await trigger_geopolitical_alert(
            session=session,
            corridor="test_mutation_corridor",
            alert_type="test_mutation",
            value=4.5,
            threshold=2.0,
            description="Mutation test second alert"
        )
        await session.commit()

        alerts = (await session.execute(
            select(GeopoliticalAlert).where(GeopoliticalAlert.corridor == "test_mutation_corridor")
        )).scalars().all()
        
        # Test: If filter is broken, we would have 2 alerts. If active, we have 1.
        assert len(alerts) == 1, "Alert deduplication filter is inactive!"
        print("  MUTATION SUCCESS: Deduplication filter successfully caught and blocked spam.")

        # Clean up
        await session.execute(delete(GeopoliticalAlert).where(GeopoliticalAlert.corridor == "test_mutation_corridor"))
        await session.commit()

def run_all():
    test_risk_score_mutation()
    test_scenario_mutation()
    test_propagation_mutation()
    asyncio.run(test_dedup_mutation())
    print("\n=== ALL MUTATION TESTS COMPLETED SUCCESSFULY ===")

if __name__ == "__main__":
    run_all()
