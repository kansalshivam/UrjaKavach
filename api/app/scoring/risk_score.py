"""Risk-scoring engine — the corrected 4-term weighted formula.

Implements Execution Plan §5 (corrected text) / HLD-LLD §2.5:

    risk_score(corridor, t) =
        w1 * normalized_gdelt_article_volume_zscore
      + w2 * normalized_price_volatility
      + w3 * ais_transit_deviation
      + w4 * sanctions_event_flag

    w1..w4 sum to 1.0; defaults: 0.35 / 0.25 / 0.30 / 0.10

Formula confirmed by human on 2026-07-14, recorded in HANDOFF.md §5B.
"""
from __future__ import annotations

import logging
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import AisSnapshot, PricePoint, RiskScore, GdeltArticle
from app.scoring.gdelt_signals import compute_gdelt_volume_zscore

logger = logging.getLogger(__name__)

# Default weights — stated explicitly in the UI's assumptions panel (Execution Plan §5).
# Editable by the user in the demo to show the model is transparent, not a black box.
DEFAULT_WEIGHTS: dict[str, float] = {
    "gdelt_volume": 0.35,
    "price_volatility": 0.25,
    "ais_deviation": 0.30,
    "sanctions_flag": 0.10,
}


@dataclass
class SignalBundle:
    """Raw signal values before normalization."""
    gdelt_article_volume_zscore: float
    price_3day_pct_change: float
    ais_count_vs_baseline: float  # ratio: current / baseline, 0 if no data
    sanctions_new_entries_7d: int


def normalize(value: float, floor: float = 0.0, ceiling: float = 1.0) -> float:
    """Clamp a value to [floor, ceiling].

    For z-scores and ratios, this keeps the weighted sum bounded.
    The specific normalization ranges are a documented simplification
    stated in the assumptions panel.
    """
    return max(floor, min(value, ceiling))


def normalize_zscore(zscore: float) -> float:
    """Map a z-score to [0, 1] using a sigmoid-like clamped linear mapping.

    z <= -2 → 0.0 (well below average — low signal)
    z >= 3  → 1.0 (well above average — high signal)
    Linear in between.
    """
    return normalize((zscore + 2.0) / 5.0)


def normalize_price_volatility(pct_change: float) -> float:
    """Map absolute 3-day % price change to [0, 1].

    0% → 0.0, >=10% → 1.0. Linear in between.
    A 10% 3-day move in Brent is historically extreme.
    """
    return normalize(abs(pct_change) / 10.0)


def normalize_ais_deviation(count_ratio: float) -> float:
    """Map AIS count deviation to [0, 1].

    ratio = current_count / baseline_count
    ratio >= 1.0 → 0.0 (normal or above-normal traffic)
    ratio == 0.0 → 1.0 (no traffic — maximum disruption signal)
    Linear in between.
    """
    if count_ratio >= 1.0:
        return 0.0
    return normalize(1.0 - count_ratio)


def compute_risk_score(signals: SignalBundle, weights: dict[str, float] | None = None) -> tuple[float, dict[str, float]]:
    """Compute the risk score from signal components.

    Returns:
        (score 0-100, dict of normalized component values)
    """
    w = weights or DEFAULT_WEIGHTS
    assert abs(sum(w.values()) - 1.0) < 1e-6, f"Weights must sum to 1.0, got {sum(w.values())}"

    components = {
        "gdelt_volume": normalize_zscore(signals.gdelt_article_volume_zscore),
        "price_volatility": normalize_price_volatility(signals.price_3day_pct_change),
        "ais_deviation": normalize_ais_deviation(signals.ais_count_vs_baseline),
        "sanctions_flag": float(signals.sanctions_new_entries_7d > 0),
    }

    raw_score = sum(w[k] * v for k, v in components.items())
    score = raw_score * 100.0  # Scale to 0-100

    return score, components


async def compute_price_volatility(session: AsyncSession, days: int = 3) -> float:
    """Compute 3-day rolling price volatility from EIA Brent data.

    Returns the percentage change over the last `days` trading days.
    """
    result = await session.execute(
        select(PricePoint.period, PricePoint.value)
        .where(PricePoint.series == "RBRTE", PricePoint.value.is_not(None))
        .order_by(PricePoint.period.desc())
        .limit(days + 1)
    )
    rows = result.all()

    if len(rows) < 2:
        logger.info("Price volatility: insufficient data (%d rows), returning 0.0", len(rows))
        return 0.0

    newest = rows[0].value
    oldest = rows[-1].value

    if oldest is None or oldest == 0:
        return 0.0

    pct_change = ((newest - oldest) / oldest) * 100.0
    logger.info(
        "Price volatility: newest=%.2f, oldest=%.2f, %d-day pct_change=%.2f%%",
        newest, oldest, len(rows) - 1, pct_change,
    )
    return pct_change


async def compute_ais_deviation(session: AsyncSession, bounding_box: str = "hormuz") -> float:
    """Compute AIS transit deviation: current snapshot count vs. 30-day baseline average.

    Returns the ratio current/baseline. If no current data, returns 0.0 (max disruption signal).
    If no baseline data, returns 1.0 (assume normal — no signal).
    """
    now = datetime.now(timezone.utc)
    baseline_cutoff = now - timedelta(days=30)
    recent_cutoff = now - timedelta(hours=1)

    # Latest snapshot (within last hour)
    current_count = await session.scalar(
        select(AisSnapshot.vessel_count)
        .where(
            AisSnapshot.bounding_box == bounding_box,
            AisSnapshot.captured_at >= recent_cutoff,
        )
        .order_by(AisSnapshot.captured_at.desc())
        .limit(1)
    )

    # 30-day baseline average
    baseline_avg = await session.scalar(
        select(func.avg(AisSnapshot.vessel_count))
        .where(
            AisSnapshot.bounding_box == bounding_box,
            AisSnapshot.captured_at >= baseline_cutoff,
        )
    )

    if current_count is None:
        # No recent AIS data — could be known-issue state.
        # Return 0.0 ratio (will map to max disruption signal in normalize_ais_deviation).
        # But if there's also no baseline, return 1.0 (no signal either way).
        if baseline_avg is None:
            logger.info("AIS deviation for %s: no data at all, returning 1.0 (no signal)", bounding_box)
            return 1.0
        logger.info("AIS deviation for %s: no recent data (known-issue?), baseline_avg=%.1f, returning 0.0", bounding_box, baseline_avg)
        return 0.0

    if baseline_avg is None or baseline_avg == 0:
        logger.info("AIS deviation for %s: no baseline, current=%d, returning 1.0 (no signal)", bounding_box, current_count)
        return 1.0

    ratio = float(current_count) / float(baseline_avg)
    logger.info(
        "AIS deviation for %s: current=%d, baseline_avg=%.1f, ratio=%.3f",
        bounding_box, current_count, baseline_avg, ratio,
    )
    return ratio


async def compute_and_store_risk_score(
    session: AsyncSession,
    corridor: str,
    sanctions_count: int = 0,
    weights: dict[str, float] | None = None,
    ais_stale: bool = False,
    sanctions_stale: bool = False,
) -> RiskScore:
    """Full pipeline: gather signals, compute score, store to risk_scores table."""

    # GDELT staleness check (older than 25 minutes)
    latest_gdelt = await session.scalar(
        select(func.max(GdeltArticle.fetched_at))
        .where(GdeltArticle.corridor == corridor)
    )
    now = datetime.now(timezone.utc)
    gdelt_stale = False
    if latest_gdelt is None or (now - latest_gdelt).total_seconds() > 25 * 60:
        gdelt_stale = True

    # EIA staleness check (older than 120 minutes)
    latest_price = await session.scalar(
        select(func.max(PricePoint.fetched_at))
    )
    price_stale = False
    if latest_price is None or (now - latest_price).total_seconds() > 120 * 60:
        price_stale = True

    # Gather all signal components
    gdelt_zscore = await compute_gdelt_volume_zscore(session, corridor)
    price_vol = await compute_price_volatility(session)
    ais_dev = await compute_ais_deviation(session, bounding_box="hormuz")

    signals = SignalBundle(
        gdelt_article_volume_zscore=gdelt_zscore,
        price_3day_pct_change=price_vol,
        ais_count_vs_baseline=ais_dev,
        sanctions_new_entries_7d=sanctions_count,
    )

    score, components = compute_risk_score(signals, weights)

    row = RiskScore(
        corridor=corridor,
        score=score,
        component_gdelt_volume=components["gdelt_volume"],
        component_price_volatility=components["price_volatility"],
        component_ais_deviation=components["ais_deviation"],
        component_sanctions_flag=components["sanctions_flag"],
        weights_used=weights or DEFAULT_WEIGHTS,
        component_gdelt_stale=gdelt_stale,
        component_price_stale=price_stale,
        component_ais_stale=ais_stale,
        component_sanctions_stale=sanctions_stale,
    )
    session.add(row)
    await session.commit()
    await session.refresh(row)

    logger.info(
        "Risk score stored: corridor=%s, score=%.1f, components=%s, stale_flags=(GDELT=%s, Price=%s, AIS=%s, Sanctions=%s)",
        corridor, score, components, gdelt_stale, price_stale, ais_stale, sanctions_stale,
    )
    return row
