from __future__ import annotations

from dataclasses import dataclass

import httpx

GDELT_DOC_URL = "https://api.gdeltproject.org/api/v2/doc/doc"
USER_AGENT = "UrjaKavach-Hackathon-Prototype/1.0 (contact: team@example.com)"


@dataclass(frozen=True)
class GdeltArticle:
    title: str
    url: str
    seendate: str | None
    domain: str | None
    language: str | None
    source_country: str | None


async def fetch_gdelt_articles(
    query: str,
    timespan: str = "24h",
    maxrecords: int = 250,
) -> list[GdeltArticle]:
    params = {
        "query": query,
        "mode": "artlist",
        "format": "json",
        "timespan": timespan,
        "maxrecords": str(maxrecords),
        "sort": "datedesc",
    }
    headers = {"User-Agent": USER_AGENT}
    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.get(GDELT_DOC_URL, params=params, headers=headers)
        response.raise_for_status()
        payload = response.json()

    return [
        GdeltArticle(
            title=item.get("title", ""),
            url=item.get("url", ""),
            seendate=item.get("seendate"),
            domain=item.get("domain"),
            language=item.get("language"),
            source_country=item.get("sourcecountry"),
        )
        for item in payload.get("articles", [])
    ]
