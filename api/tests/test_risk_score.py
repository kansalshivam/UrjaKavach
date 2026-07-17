"""Tests for the risk-scoring formula — per Architecture Plan §11.

Targeted at the parts most likely to silently lie: the weights sum and the
normalization functions.
"""
import pytest
from unittest.mock import AsyncMock
from app.scoring.risk_score import (
    DEFAULT_WEIGHTS,
    SignalBundle,
    compute_risk_score,
    normalize_ais_deviation,
    normalize_price_volatility,
    normalize_zscore,
)


def test_weights_sum_to_one():
    """Architecture Plan §11: explicit test that weights sum to 1.0."""
    assert abs(sum(DEFAULT_WEIGHTS.values()) - 1.0) < 1e-6


def test_default_weights_match_spec():
    """Confirmed formula: 0.35 / 0.25 / 0.30 / 0.10."""
    assert DEFAULT_WEIGHTS["gdelt_volume"] == 0.35
    assert DEFAULT_WEIGHTS["price_volatility"] == 0.25
    assert DEFAULT_WEIGHTS["ais_deviation"] == 0.30
    assert DEFAULT_WEIGHTS["sanctions_flag"] == 0.10


def test_score_range_zero_to_hundred():
    """Score should always be in [0, 100]."""
    # All-low signals
    low = SignalBundle(
        gdelt_article_volume_zscore=-3.0,
        price_3day_pct_change=0.0,
        ais_count_vs_baseline=2.0,  # above baseline → no disruption
        sanctions_new_entries_7d=0,
    )
    score_low, _ = compute_risk_score(low)
    assert 0.0 <= score_low <= 100.0

    # All-high signals
    high = SignalBundle(
        gdelt_article_volume_zscore=5.0,
        price_3day_pct_change=15.0,
        ais_count_vs_baseline=0.0,  # no traffic → max disruption
        sanctions_new_entries_7d=5,
    )
    score_high, _ = compute_risk_score(high)
    assert 0.0 <= score_high <= 100.0
    assert score_high > score_low


def test_sanctions_flag_is_binary():
    """Sanctions signal should be 0 or 1, not a continuous value."""
    no_sanctions = SignalBundle(
        gdelt_article_volume_zscore=0.0,
        price_3day_pct_change=0.0,
        ais_count_vs_baseline=1.0,
        sanctions_new_entries_7d=0,
    )
    _, components_no = compute_risk_score(no_sanctions)
    assert components_no["sanctions_flag"] == 0.0

    has_sanctions = SignalBundle(
        gdelt_article_volume_zscore=0.0,
        price_3day_pct_change=0.0,
        ais_count_vs_baseline=1.0,
        sanctions_new_entries_7d=3,
    )
    _, components_yes = compute_risk_score(has_sanctions)
    assert components_yes["sanctions_flag"] == 1.0


def test_normalize_zscore_mapping():
    """z=-2 → 0.0, z=3 → 1.0, z=0.5 → 0.5."""
    assert normalize_zscore(-2.0) == 0.0
    assert normalize_zscore(3.0) == 1.0
    assert abs(normalize_zscore(0.5) - 0.5) < 1e-6


def test_normalize_price_volatility():
    """0% → 0.0, 10% → 1.0, -5% → 0.5 (absolute value)."""
    assert normalize_price_volatility(0.0) == 0.0
    assert normalize_price_volatility(10.0) == 1.0
    assert abs(normalize_price_volatility(-5.0) - 0.5) < 1e-6


def test_normalize_ais_deviation():
    """ratio >= 1.0 → 0.0, ratio == 0.0 → 1.0."""
    assert normalize_ais_deviation(1.0) == 0.0
    assert normalize_ais_deviation(1.5) == 0.0
    assert normalize_ais_deviation(0.0) == 1.0
    assert abs(normalize_ais_deviation(0.5) - 0.5) < 1e-6


def test_manual_score_recomputation():
    """Manually recompute one score to verify the formula matches.
    
    This is the Phase 4 verification step from Execution Plan §9:
    'Manually recompute one score by hand from the raw component values,
    confirm it matches the stored value.'
    """
    signals = SignalBundle(
        gdelt_article_volume_zscore=1.0,   # z=1.0 → normalized = (1+2)/5 = 0.6
        price_3day_pct_change=5.0,          # 5% → normalized = 5/10 = 0.5
        ais_count_vs_baseline=0.7,          # ratio 0.7 → normalized = 1-0.7 = 0.3
        sanctions_new_entries_7d=1,          # >0 → 1.0
    )
    score, components = compute_risk_score(signals)

    # Manual computation:
    expected_gdelt = 0.6       # (1.0 + 2.0) / 5.0
    expected_price = 0.5       # abs(5.0) / 10.0
    expected_ais = 0.3         # 1.0 - 0.7
    expected_sanctions = 1.0   # sanctions_count > 0

    assert abs(components["gdelt_volume"] - expected_gdelt) < 1e-6
    assert abs(components["price_volatility"] - expected_price) < 1e-6
    assert abs(components["ais_deviation"] - expected_ais) < 1e-6
    assert abs(components["sanctions_flag"] - expected_sanctions) < 1e-6

    expected_score = (
        0.35 * expected_gdelt
        + 0.25 * expected_price
        + 0.30 * expected_ais
        + 0.10 * expected_sanctions
    ) * 100.0

    assert abs(score - expected_score) < 1e-4, f"Expected {expected_score}, got {score}"


def test_compute_risk_score_invalid_weights():
    """Verify that compute_risk_score raises AssertionError if weights do not sum to 1.0."""
    import pytest
    signals = SignalBundle(
        gdelt_article_volume_zscore=0.0,
        price_3day_pct_change=0.0,
        ais_count_vs_baseline=1.0,
        sanctions_new_entries_7d=0,
    )
    bad_weights = {
        "gdelt_volume": 0.5,
        "price_volatility": 0.1,
        "ais_deviation": 0.0,
        "sanctions_flag": 0.0
    }
    with pytest.raises(AssertionError):
        compute_risk_score(signals, bad_weights)


def test_degenerate_normalization_inputs():
    """Verify normalization handles extreme out-of-bound inputs robustly."""
    from app.scoring.risk_score import normalize
    
    # Check clamping to custom bounds
    assert normalize(-50.0, floor=0.0, ceiling=100.0) == 0.0
    assert normalize(150.0, floor=0.0, ceiling=100.0) == 100.0
    
    # Check extreme z-scores
    assert normalize_zscore(1000.0) == 1.0
    assert normalize_zscore(-1000.0) == 0.0
    
    # Check extreme price volatility
    assert normalize_price_volatility(1000.0) == 1.0
    assert normalize_price_volatility(-1000.0) == 1.0
    
    # Check extreme AIS deviations
    assert normalize_ais_deviation(1000.0) == 0.0
    assert normalize_ais_deviation(-50.0) == 1.0


@pytest.mark.anyio
async def test_compute_price_volatility_insufficient_data():
    from app.scoring.risk_score import compute_price_volatility
    from unittest.mock import MagicMock
    
    # Session returns fewer than 2 rows
    mock_session = MagicMock()
    mock_session.execute = AsyncMock(return_value=MagicMock(all=MagicMock(return_value=[])))
    
    val = await compute_price_volatility(mock_session)
    assert val == 0.0


@pytest.mark.anyio
async def test_compute_price_volatility_valid():
    from app.scoring.risk_score import compute_price_volatility
    from unittest.mock import MagicMock
    
    # Session returns newest = 80.0, oldest = 75.0
    RowMock = MagicMock
    rows = [
        RowMock(value=80.0, period="2026-07-15"),
        RowMock(value=75.0, period="2026-07-12")
    ]
    mock_session = MagicMock()
    mock_session.execute = AsyncMock(return_value=MagicMock(all=MagicMock(return_value=rows)))
    
    pct_change = await compute_price_volatility(mock_session)
    expected_pct = ((80.0 - 75.0) / 75.0) * 100.0
    assert abs(pct_change - expected_pct) < 1e-6


@pytest.mark.anyio
async def test_compute_ais_deviation_no_data():
    from app.scoring.risk_score import compute_ais_deviation
    from unittest.mock import MagicMock
    
    # Session returns None for both current and baseline
    mock_session = MagicMock()
    mock_session.scalar = AsyncMock(side_effect=[None, None])
    
    val = await compute_ais_deviation(mock_session, bounding_box="non_hormuz_americas")
    assert val is None  # Returns None representing insufficient data


@pytest.mark.anyio
async def test_compute_ais_deviation_valid():
    from app.scoring.risk_score import compute_ais_deviation
    from unittest.mock import MagicMock
    
    # Session returns current_count=30, baseline_avg=40.0
    mock_session = MagicMock()
    mock_session.scalar = AsyncMock(side_effect=[30, 40.0])
    
    val = await compute_ais_deviation(mock_session, bounding_box="non_hormuz_americas")
    assert val == 0.75  # 30 / 40.0


@pytest.mark.anyio
async def test_compute_risk_score_no_baseline():
    from app.scoring.risk_score import compute_and_store_risk_score
    from unittest.mock import MagicMock, patch
    
    mock_session = MagicMock()
    # Mock database scalar calls to return None (no GDELT fetches, no Price fetches)
    mock_session.scalar = AsyncMock(return_value=None)
    mock_session.execute = AsyncMock()
    mock_session.commit = AsyncMock()
    mock_session.refresh = AsyncMock()
    
    # Mock dependencies
    with patch("app.scoring.risk_score.compute_gdelt_volume_zscore", new_callable=AsyncMock, return_value=0.0), \
         patch("app.scoring.risk_score.compute_price_volatility", new_callable=AsyncMock, return_value=0.0), \
         patch("app.scoring.risk_score.compute_ais_deviation", new_callable=AsyncMock, return_value=None):
         
        row = await compute_and_store_risk_score(mock_session, corridor="non_hormuz_americas")
        assert row.component_ais_stale is True
        assert row.component_ais_deviation == 0.0  # contribution is dropped to zero because it is stale/excluded


def test_compute_risk_score_stale_exclusion():
    from app.scoring.risk_score import compute_risk_score, SignalBundle

    signals = SignalBundle(
        gdelt_article_volume_zscore=1.5,  # maps to normalized z-score: (1.5 + 2) / 5 = 0.70
        price_3day_pct_change=5.0,        # maps to normalized price volatility: 5 / 10 = 0.50
        ais_count_vs_baseline=0.0,        # maps to normalized ais deviation: 1.0 - 0.0 = 1.00 (max)
        sanctions_new_entries_7d=1,       # maps to normalized sanctions flag: 1.0
    )

    # 1. Normal active calculation
    score_normal, components_normal = compute_risk_score(signals)
    # Expected normal:
    # GDELT: 0.70 * 0.35 = 0.245
    # Price: 0.50 * 0.25 = 0.125
    # AIS: 1.00 * 0.30 = 0.300
    # Sanctions: 1.00 * 0.10 = 0.100
    # Sum: 0.770 * 100 = 77.0
    assert abs(score_normal - 77.0) < 1e-4
    assert components_normal["ais_deviation"] == 1.0

    # 2. AIS and Price stale calculation (Stale signals keep their last known value contribution)
    score_stale, components_stale = compute_risk_score(
        signals=signals,
        price_stale=True,
        ais_stale=True,
    )
    # Expected stale:
    # GDELT: 0.70 * 0.35 = 0.245
    # Price: 0.50 * 0.25 = 0.125 (Kept last known value)
    # AIS: 1.00 * 0.30 = 0.300 (Kept last known value)
    # Sanctions: 1.00 * 0.10 = 0.100
    # Sum: 0.770 * 100 = 77.0
    assert abs(score_stale - 77.0) < 1e-4
    assert components_stale["ais_deviation"] == 1.0
    assert components_stale["price_volatility"] == 0.50
    assert components_stale["gdelt_volume"] == 0.70



