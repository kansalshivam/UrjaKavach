"""Tests for Scenario Simulator cascading calculations."""
from app.scoring.scenario import calculate_scenario_effects


def test_scenario_anchors():
    """Verify that calculated effects match the 100% and 30% calibration anchors."""
    # 100% capacity available -> 0% import change
    import_change_100, spr_cover_100 = calculate_scenario_effects(100.0)
    assert abs(import_change_100) < 1e-6
    assert abs(spr_cover_100 - 9.5) < 1e-6

    # 30% capacity available -> -23% import change
    import_change_30, spr_cover_30 = calculate_scenario_effects(30.0)
    assert abs(import_change_30 - (-23.0)) < 1e-6
    # 9.5 - (30 * 0.23) = 9.5 - 6.9 = 2.6
    assert abs(spr_cover_30 - 2.6) < 1e-6

    # 65% capacity available (linear midpoint) -> -11.5% drop
    import_change_65, _ = calculate_scenario_effects(65.0)
    assert abs(import_change_65 - (-11.5)) < 1e-6

    # 45% capacity available (linear range) -> -18.07142857% drop
    import_change_45, _ = calculate_scenario_effects(45.0)
    assert abs(import_change_45 - (-18.07142857)) < 1e-6



def test_scenario_full_closure():
    """Verify full closure bounds (0% capacity)."""
    import_change_0, spr_cover_0 = calculate_scenario_effects(0.0)
    # -(100) * 23/70 = -32.857%
    assert -33.0 < import_change_0 < -32.8
    # Depletion goes to 0 (cannot be negative)
    assert spr_cover_0 == 0.0


def test_scenario_piecewise_quadratic_plateau():
    """Verify that values below 30% available capacity follow the quadratic plateau curve, not a linear progression."""
    # At 15% (midpoint), quadratic curve yields -25.46% drop, while linear would yield -27.93%
    import_change_15, _ = calculate_scenario_effects(15.0)
    assert abs(import_change_15 - (-25.46428571)) < 1e-5

