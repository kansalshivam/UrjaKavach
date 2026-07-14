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
IRAN_PROGRAM_KEYWORDS = {"IRAN", "IRAN-HR", "IRAN-TRA", "IRAN-EO13846"}


@dataclass
class OfacDiffResult:
    """Result of an OFAC SDN diff check."""
    new_iran_entries: int
    total_iran_entries: int
    diff_date: datetime
    previous_count: int | None


def _extract_iran_entry_ids(csv_text: str) -> set[str]:
    """Extract unique entry IDs (column 0) where the Programs column contains an Iran-related program."""
    ids: set[str] = set()
    reader = csv.reader(io.StringIO(csv_text))
    for row in reader:
        if len(row) < 12:
            continue
        entry_id = row[0].strip()
        programs = row[11].strip().upper() if len(row) > 11 else ""
        if any(kw in programs for kw in IRAN_PROGRAM_KEYWORDS):
            ids.add(entry_id)
    return ids


async def fetch_ofac_sdn() -> str:
    """Download the current OFAC SDN CSV."""
    headers = {"User-Agent": USER_AGENT}
    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.get(OFAC_SDN_URL, headers=headers, follow_redirects=True)
        resp.raise_for_status()
    return resp.text


async def compute_sanctions_diff() -> OfacDiffResult:
    """Fetch the current SDN list, diff against the cached previous version,
    and return the count of new Iran-linked entries in the trailing period.
    """
    OFAC_CACHE_DIR.mkdir(parents=True, exist_ok=True)
    cache_file = OFAC_CACHE_DIR / "sdn_iran_ids.txt"
    now = datetime.now(timezone.utc)

    # Load previous snapshot
    previous_ids: set[str] = set()
    previous_count: int | None = None
    if cache_file.exists():
        previous_ids = set(cache_file.read_text(encoding="utf-8").strip().splitlines())
        previous_count = len(previous_ids)

    # Fetch current
    try:
        csv_text = await fetch_ofac_sdn()
    except Exception:
        logger.exception("OFAC SDN fetch failed; returning 0 new entries")
        return OfacDiffResult(
            new_iran_entries=0,
            total_iran_entries=previous_count or 0,
            diff_date=now,
            previous_count=previous_count,
        )

    current_ids = _extract_iran_entry_ids(csv_text)

    # Compute diff
    new_entries = current_ids - previous_ids
    new_iran_count = len(new_entries)

    # Save current snapshot for next diff
    cache_file.write_text("\n".join(sorted(current_ids)), encoding="utf-8")

    logger.info(
        "OFAC SDN diff: total_iran=%d, previous=%s, new=%d",
        len(current_ids), previous_count, new_iran_count,
    )

    return OfacDiffResult(
        new_iran_entries=new_iran_count,
        total_iran_entries=len(current_ids),
        diff_date=now,
        previous_count=previous_count,
    )
