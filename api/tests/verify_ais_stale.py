import json
from app.scoring.risk_score import compute_risk_score, SignalBundle

def test_stale_scoring():
    signals = SignalBundle(
        gdelt_article_volume_zscore=1.5,   # normalized: 0.70
        price_3day_pct_change=5.0,         # normalized: 0.50
        ais_count_vs_baseline=0.0,         # normalized: 1.00 (max deviation)
        sanctions_new_entries_7d=1,        # normalized: 1.00
    )

    print("--- 1. ACTIVE SIGNALS (BEFORE STALENESS) ---")
    score_active, comp_active = compute_risk_score(signals)
    print(f"Overall Risk Score: {score_active:.2f}")
    print("Component Values:")
    for k, v in comp_active.items():
        print(f"  - {k}: {v:.2f}")
    
    print("\n--- 2. STALE SIGNALS (AFTER AIS STALENESS TRIGGERED) ---")
    score_stale, comp_stale = compute_risk_score(
        signals=signals,
        ais_stale=True
    )
    print(f"Overall Risk Score: {score_stale:.2f}")
    print("Component Values:")
    for k, v in comp_stale.items():
        print(f"  - {k}: {v:.2f} {'(STALE / EXCLUDED)' if k == 'ais_deviation' else ''}")

if __name__ == "__main__":
    test_stale_scoring()
