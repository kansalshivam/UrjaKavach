import asyncio
from app.db.session import SessionLocal
from app.db.models import GeopoliticalAlert

async def main():
    async with SessionLocal() as session:
        alert1 = GeopoliticalAlert(
            corridor='hormuz',
            alert_type='gdelt_zscore',
            value=2.45,
            threshold=2.00,
            description='GDELT article volume z-score for Strait of Hormuz reached 2.45 (threshold: 2.0)',
            raw_payload={
                'z_score': 2.45,
                'recent_articles_count': 14,
                'articles': [
                    {'title': 'Strait of Hormuz Alert: Tensions Rise Near Maritime Chokepoint', 'url': 'https://golden-fallback.internal/news/1'}
                ]
            }
        )
        alert2 = GeopoliticalAlert(
            corridor='global',
            alert_type='price_volatility',
            value=12.40,
            threshold=10.00,
            description='Brent crude spot price 3-day volatility reached 12.4% (threshold: 10.0%)',
            raw_payload={
                'price_volatility': 12.40,
                'prices_used': [
                    {'period': '2026-07-16', 'value': 88.5},
                    {'period': '2026-07-13', 'value': 78.7}
                ]
            }
        )
        session.add(alert1)
        session.add(alert2)
        await session.commit()
        print("Mock alerts successfully seeded.")

if __name__ == "__main__":
    asyncio.run(main())
