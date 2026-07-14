from __future__ import annotations

import os
from dataclasses import dataclass

import httpx

EIA_BASE = "https://api.eia.gov/v2"
BRENT_SPOT_SERIES = "RBRTE"


@dataclass(frozen=True)
class EiaPricePoint:
    period: str
    value: float | None
    series: str | None
    units: str | None


class EiaConfigurationError(RuntimeError):
    pass


def eia_api_key() -> str:
    key = os.getenv("EIA_API_KEY", "").strip()
    if not key:
        raise EiaConfigurationError("EIA_API_KEY is required for EIA Open Data API v2 ingestion")
    return key


async def fetch_brent_spot_price(days_back: int = 7) -> list[EiaPricePoint]:
    url = f"{EIA_BASE}/petroleum/pri/spt/data/"
    params = {
        "api_key": eia_api_key(),
        "frequency": "daily",
        "data[0]": "value",
        "facets[series][]": BRENT_SPOT_SERIES,
        "sort[0][column]": "period",
        "sort[0][direction]": "desc",
        "length": str(days_back),
    }
    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.get(url, params=params)
        response.raise_for_status()
        payload = response.json()

    return [
        EiaPricePoint(
            period=item.get("period", ""),
            value=_parse_float(item.get("value")),
            series=item.get("series"),
            units=item.get("units"),
        )
        for item in payload.get("response", {}).get("data", [])
    ]


def _parse_float(value: object) -> float | None:
    if value is None or value == "":
        return None
    return float(value)
