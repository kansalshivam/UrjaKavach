from __future__ import annotations

import asyncio
from dataclasses import dataclass

import httpx

GDELT_DOC_URL = "https://api.gdeltproject.org/api/v2/doc/doc"
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/126.0.0.0 Safari/537.36"
)
DEFAULT_RATE_LIMIT_COOLDOWN_SECONDS = 15 * 60


@dataclass(frozen=True)
class GdeltArticle:
    title: str
    url: str
    seendate: str | None
    domain: str | None
    language: str | None
    source_country: str | None


class GdeltRateLimitedError(RuntimeError):
    def __init__(self, retry_after_seconds: int) -> None:
        super().__init__(f"GDELT rate limited; retry after {retry_after_seconds} seconds")
        self.retry_after_seconds = retry_after_seconds


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
        if response.status_code == 429:
            retry_after = _retry_after_seconds(response)
            await asyncio.sleep(retry_after)
            raise GdeltRateLimitedError(retry_after)
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


def _retry_after_seconds(response: httpx.Response) -> int:
    raw_retry_after = response.headers.get("Retry-After", "").strip()
    if raw_retry_after.isdigit():
        return max(int(raw_retry_after), 1)
    return DEFAULT_RATE_LIMIT_COOLDOWN_SECONDS
