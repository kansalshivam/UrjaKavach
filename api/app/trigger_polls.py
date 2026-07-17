import asyncio
import sys
from app.scheduler import run_gdelt_poll, run_eia_poll, run_risk_score_compute, run_ofac_poll

async def main():
    print("Starting trigger_polls script...")
    
    print("1. Running OFAC poll...")
    await run_ofac_poll()
    
    print("2. Running GDELT poll...")
    await run_gdelt_poll()
    
    print("3. Running EIA poll...")
    await run_eia_poll()
    
    print("4. Running Risk Score compute...")
    await run_risk_score_compute()
    
    print("All tasks finished successfully.")

if __name__ == "__main__":
    asyncio.run(main())
