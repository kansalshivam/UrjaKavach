import asyncio
from unittest.mock import patch, AsyncMock
from app.ingestion.ofac import compute_sanctions_diff_for_all, OFAC_CACHE_DIR

# Mock CSV data containing:
# - 1 Iran entry: ID 1001, program "IRAN" (triggers hormuz and west_africa)
# - 2 Russia entries: ID 2001, 2002, program "RUSSIA" (triggers russia)
# - 0 Venezuela entries: (triggers americas)
MOCK_CSV_BASELINE = """1000,,,,,Individual,,,,,,IRAN
2000,,,,,Individual,,,,,,RUSSIA
3000,,,,,Individual,,,,,,VENEZUELA
"""

MOCK_CSV_NEW = """1000,,,,,Individual,,,,,,IRAN
1001,,,,,Individual,,,,,,IRAN
2000,,,,,Individual,,,,,,RUSSIA
2001,,,,,Individual,,,,,,RUSSIA
2002,,,,,Individual,,,,,,RUSSIA
3000,,,,,Individual,,,,,,VENEZUELA
"""

async def main():
    # Clear any existing cache files to start clean
    for corridor in ["hormuz", "non_hormuz_west_africa", "non_hormuz_americas", "non_hormuz_russia"]:
        cache_file = OFAC_CACHE_DIR / f"sdn_{corridor}_ids.txt"
        if cache_file.exists():
            cache_file.unlink()

    # 1. Establish baseline cache by running once with MOCK_CSV_BASELINE
    with patch("app.ingestion.ofac.fetch_ofac_sdn", new_callable=AsyncMock, return_value=MOCK_CSV_BASELINE):
        await compute_sanctions_diff_for_all()
        
    print("--- BASELINE CACHE ESTABLISHED ---")

    # 2. Run again with MOCK_CSV_NEW to compute the diffs
    with patch("app.ingestion.ofac.fetch_ofac_sdn", new_callable=AsyncMock, return_value=MOCK_CSV_NEW):
        diffs = await compute_sanctions_diff_for_all()
        
    print("--- COMPUTED CORRIDOR-SPECIFIC OFAC DIFFS ---")
    for corridor, count in diffs.items():
        print(f"[{corridor}] New Sanctions Count: {count}")

if __name__ == "__main__":
    asyncio.run(main())
