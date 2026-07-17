import asyncio
import sys
from app.scheduler import CORRIDOR_QUERIES
from app.ingestion.gdelt import fetch_gdelt_articles, is_article_relevant

async def main():
    print("🚀 Querying live GDELT API with tightened corridor queries (15s rate-limit delay)...")
    for corridor, query in CORRIDOR_QUERIES:
        print(f"\n📂 Corridor: {corridor}")
        print(f"   Query: {query}")
        try:
            articles = await fetch_gdelt_articles(query, maxrecords=10)
            print(f"   Returned: {len(articles)} articles")
            for art in articles[:5]:
                rel = is_article_relevant(art.title, corridor)
                status = "✅ KEEP" if rel else "❌ REJECT"
                print(f"   - {status} | {art.title[:80]} ({art.domain})")
        except Exception as e:
            print(f"   ❌ Failed to query: {e}")
        # Sleep to avoid GDELT rate limit (one query per 5 seconds rule)
        print("   Sleeping 15 seconds...")
        await asyncio.sleep(15)

if __name__ == "__main__":
    asyncio.run(main())
