import asyncio
import json
from app.routes.dashboard import dashboard_summary
from app.db.session import SessionLocal

async def main():
    async with SessionLocal() as session:
        res = await dashboard_summary(session)
        print(json.dumps(res["risk_scores"], indent=2))

if __name__ == "__main__":
    asyncio.run(main())
