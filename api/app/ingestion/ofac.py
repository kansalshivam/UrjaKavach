"""OFAC SDN list ingestion — daily diff for sanctions signal.

Per Architecture Plan §5: pull the OFAC SDN CSV once daily, diff against
the previous snapshot, and flag new Iran-linked (Program: IRAN) entries as the
sanctions_event_flag binary signal in the risk-scoring formula.

Storage: only the diff count and program tag are needed — the full SDN list
is large and not otherwise used by the UI.
"""
from __future__ import annotations

import csv
import io
import logging
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path

import httpx

logger = logging.getLogger(__name__)

OFAC_SDN_URL = "https://sanctionslistservice.ofac.treas.gov/api/PublicationPreview/exports/SDN.CSV"
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/126.0.0.0 Safari/537.36"
)
OFAC_CACHE_DIR = Path("/tmp/urja_kavach_ofac")
CORRIDOR_PROGRAM_KEYWORDS = {
    "hormuz": {"IRAN", "IRAN-HR", "IRAN-TRA", "IRAN-EO13846"},
    "non_hormuz_west_africa": {"IRAN", "IRAN-HR", "IRAN-TRA", "IRAN-EO13846", "YEMEN", "YEMEN-HR"},
    "non_hormuz_americas": {"VENEZUELA", "VENEZUELA-EO13850", "VENEZUELA-EO13884"},
    "non_hormuz_russia": {"RUSSIA", "UKRAINE-EO13660", "UKRAINE-EO13661", "UKRAINE-EO13662"},
}


@dataclass
class OfacDiffResult:
    """Result of an OFAC SDN diff check."""
    new_iran_entries: int
    total_iran_entries: int
    diff_date: datetime
    previous_count: int | None


def _extract_corridor_entry_ids(csv_text: str, corridor: str) -> set[str]:
    """Extract unique entry IDs where the Programs column matches the corridor program keywords."""
    ids: set[str] = set()
    keywords = CORRIDOR_PROGRAM_KEYWORDS.get(corridor, set())
    reader = csv.reader(io.StringIO(csv_text))
    for row in reader:
        if len(row) < 12:
            continue
        entry_id = row[0].strip()
        programs = row[11].strip().upper() if len(row) > 11 else ""
        if any(kw in programs for kw in keywords):
            ids.add(entry_id)
    return ids


async def fetch_ofac_sdn() -> str:
    """Download the current OFAC SDN CSV."""
    headers = {"User-Agent": USER_AGENT}
    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.get(OFAC_SDN_URL, headers=headers, follow_redirects=True)
        resp.raise_for_status()
    return resp.text


async def compute_sanctions_diff_for_all() -> dict[str, int]:
    """Fetch the current SDN list once, and compute corridor-specific diffs.

    Returns:
        dict mapping corridor name to the count of new sanctions entries.
    """
    OFAC_CACHE_DIR.mkdir(parents=True, exist_ok=True)
    try:
        csv_text = await fetch_ofac_sdn()
    except Exception:
        logger.exception("OFAC SDN fetch failed; returning 0 new entries for all corridors")
        return {c: 0 for c in CORRIDOR_PROGRAM_KEYWORDS}

    now = datetime.now(timezone.utc)
    results = {}

    for corridor in CORRIDOR_PROGRAM_KEYWORDS:
        cache_file = OFAC_CACHE_DIR / f"sdn_{corridor}_ids.txt"
        previous_ids: set[str] = set()
        previous_count: int | None = None
        if cache_file.exists():
            try:
                previous_ids = set(cache_file.read_text(encoding="utf-8").strip().splitlines())
                previous_count = len(previous_ids)
            except Exception:
                logger.warning("Failed to load previous cache for %s, treating as new", corridor)

        current_ids = _extract_corridor_entry_ids(csv_text, corridor)
        new_entries = current_ids - previous_ids
        new_count = len(new_entries) if previous_count is not None else 0

        # Save cache for next run
        try:
            cache_file.write_text("\n".join(sorted(current_ids)), encoding="utf-8")
        except Exception:
            logger.exception("Failed to write OFAC cache for %s", corridor)

        results[corridor] = new_count
        logger.info(
            "OFAC SDN diff for %s: total=%d, previous=%s, new=%d",
            corridor, len(current_ids), previous_count, new_count
        )

    return results
