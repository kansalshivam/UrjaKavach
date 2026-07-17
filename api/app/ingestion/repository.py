from datetime import datetime, timezone, timedelta
from sqlalchemy import select, func
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

    # 1. Batch deduplication: keep only unique titles within the batch
    seen_titles = set()
    unique_articles = []
    for article in articles:
        title_clean = article.title.strip().lower() if article.title else ""
        if title_clean and title_clean not in seen_titles:
            seen_titles.add(title_clean)
            unique_articles.append(article)

    if not unique_articles:
        return 0

    # 2. Database deduplication: check against recently fetched titles for this corridor in the last 24h
    recent_cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
    existing_rows_query = select(GdeltArticle.url, GdeltArticle.title).where(
        GdeltArticle.corridor == corridor,
        GdeltArticle.fetched_at >= recent_cutoff
    )
    existing_rows_res = await session.execute(existing_rows_query)
    existing_rows = existing_rows_res.all()

    existing_urls = {r[0] for r in existing_rows if r[0]}
    existing_titles = {r[1].strip().lower() for r in existing_rows if r[1]}

    rows = []
    for article in unique_articles:
        if not article.url:
            continue
        title_clean = article.title.strip().lower() if article.title else ""

        # If URL is already in the database, we update its fetched_at to mark it fresh
        if article.url in existing_urls:
            rows.append({
                "corridor": corridor,
                "query": query,
                "title": article.title,
                "url": article.url,
                "seendate": article.seendate,
                "domain": article.domain,
                "language": article.language,
                "source_country": article.source_country,
                "is_synthetic": article.is_synthetic,
            })
        # If it's a new URL, we only insert it if the title is not a duplicate
        elif title_clean not in existing_titles:
            rows.append({
                "corridor": corridor,
                "query": query,
                "title": article.title,
                "url": article.url,
                "seendate": article.seendate,
                "domain": article.domain,
                "language": article.language,
                "source_country": article.source_country,
                "is_synthetic": article.is_synthetic,
            })
            existing_titles.add(title_clean)

    if not rows:
        return 0

    statement = insert(GdeltArticle).values(rows)
    statement = statement.on_conflict_do_update(
        index_elements=["url"],
        set_={
            "fetched_at": func.now()
        }
    )
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
            "fetched_at": func.now(),
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
