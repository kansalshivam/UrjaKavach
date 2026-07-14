"""GDELT signal computation — article-volume z-score per corridor.

Computes the GDELT component of the risk-scoring formula (Execution Plan §5,
corrected per HLD/LLD §2.5): count of articles in the last 24h vs. a 30-day
rolling baseline count, expressed as a z-score.
"""
from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import GdeltArticle

logger = logging.getLogger(__name__)

# Corridors map to the `corridor` column in gdelt_articles
CORRIDORS = ["hormuz", "non_hormuz_west_africa", "non_hormuz_americas", "non_hormuz_russia"]


async def compute_gdelt_volume_zscore(
    session: AsyncSession,
    corridor: str,
    window_hours: int = 24,
    baseline_days: int = 30,
) -> float:
    """Compute article-volume z-score for a corridor.

    z = (count_recent - mean_daily_baseline) / std_daily_baseline

    If the baseline has zero variance (e.g. early in the project when there's only
    one day of data), return a simple ratio indicator instead: count_recent / max(1, mean).
    This is documented in the assumptions panel as a bootstrap limitation.
    """
    now = datetime.now(timezone.utc)
    recent_cutoff = now - timedelta(hours=window_hours)
    baseline_cutoff = now - timedelta(days=baseline_days)

    # Count articles in the recent window
    recent_count_result = await session.scalar(
        select(func.count(GdeltArticle.id)).where(
            GdeltArticle.corridor == corridor,
            GdeltArticle.fetched_at >= recent_cutoff,
        )
    )
    recent_count = recent_count_result or 0

    # Compute daily article counts over the baseline period (excluding the recent window)
    # Group by date to get per-day counts
    daily_counts_query = (
        select(
            func.date(GdeltArticle.fetched_at).label("day"),
            func.count(GdeltArticle.id).label("cnt"),
        )
        .where(
            GdeltArticle.corridor == corridor,
            GdeltArticle.fetched_at >= baseline_cutoff,
            GdeltArticle.fetched_at < recent_cutoff,
        )
        .group_by(text("day"))
    )
    result = await session.execute(daily_counts_query)
    daily_counts = [row.cnt for row in result.all()]

    if not daily_counts:
        # No baseline data yet — return a normalized indicator based on recent count alone.
        # Cap at 1.0 to keep the signal bounded before baseline is established.
        logger.info(
            "GDELT volume z-score for %s: no baseline data, using raw count %d (capped at 1.0)",
            corridor, recent_count,
        )
        return min(float(recent_count) / max(1.0, 10.0), 1.0)

    mean_daily = sum(daily_counts) / len(daily_counts)
    variance = sum((c - mean_daily) ** 2 for c in daily_counts) / len(daily_counts)
    std_daily = variance ** 0.5

    if std_daily < 1e-6:
        # Zero variance — all days had the same count. Return simple ratio.
        zscore = (recent_count - mean_daily) / max(1.0, mean_daily)
    else:
        zscore = (recent_count - mean_daily) / std_daily

    logger.info(
        "GDELT volume z-score for %s: recent=%d, mean_daily=%.1f, std=%.2f, z=%.3f",
        corridor, recent_count, mean_daily, std_daily, zscore,
    )
    return zscore
