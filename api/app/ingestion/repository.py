from __future__ import annotations

from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import AisSnapshot, GdeltArticle, PricePoint
from app.ingestion.eia import EiaPricePoint
from app.ingestion.gdelt import GdeltArticle as FetchedGdeltArticle


async def store_gdelt_articles(
    session: AsyncSession,
    corridor: str,
    query: str,
    articles: list[FetchedGdeltArticle],
) -> int:
    if not articles:
        return 0

    rows = [
        {
            "corridor": corridor,
            "query": query,
            "title": article.title,
            "url": article.url,
            "seendate": article.seendate,
            "domain": article.domain,
            "language": article.language,
            "source_country": article.source_country,
        }
        for article in articles
        if article.url
    ]
    if not rows:
        return 0

    statement = insert(GdeltArticle).values(rows).on_conflict_do_nothing(index_elements=["url"])
    result = await session.execute(statement)
    await session.commit()
    return result.rowcount or 0


async def store_price_points(session: AsyncSession, source: str, points: list[EiaPricePoint]) -> int:
    if not points:
        return 0

    rows = [
        {
            "source": source,
            "series": point.series or "RBRTE",
            "period": point.period,
            "value": point.value,
            "units": point.units,
        }
        for point in points
        if point.period
    ]
    if not rows:
        return 0

    insert_statement = insert(PricePoint).values(rows)
    statement = insert_statement.on_conflict_do_update(
        index_elements=["series", "period"],
        set_={
            "source": source,
            "value": insert_statement.excluded.value,
            "units": insert_statement.excluded.units,
        },
    )
    result = await session.execute(statement)
    await session.commit()
    return result.rowcount or 0


async def store_ais_snapshot(
    session: AsyncSession,
    bounding_box: str,
    vessel_count: int,
    raw_payload_path: str | None,
) -> AisSnapshot:
    snapshot = AisSnapshot(
        bounding_box=bounding_box,
        vessel_count=vessel_count,
        raw_payload_path=raw_payload_path,
    )
    session.add(snapshot)
    await session.commit()
    await session.refresh(snapshot)
    return snapshot
