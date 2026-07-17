import asyncio
from app.scheduler import run_gdelt_poll, run_eia_poll, run_risk_score_compute, run_ofac_poll

async def main():
    print("Starting manual trigger script...")
    print("Running OFAC poll...")
    await run_ofac_poll()
    print("Running GDELT poll...")
    await run_gdelt_poll()
    print("Running EIA poll...")
    await run_eia_poll()
    print("Running risk score compute...")
    await run_risk_score_compute()
    print("Trigger completed successfully.")

if __name__ == "__main__":
    asyncio.run(main())
