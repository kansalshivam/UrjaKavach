import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from app.scheduler import run_gdelt_poll, run_eia_poll, run_ofac_poll
from app.ingestion.gdelt import GdeltArticle
from app.ingestion.eia import EiaPricePoint

@pytest.mark.anyio
async def test_run_gdelt_poll_success():
    # Mock gdelt fetcher returning live articles
    mock_articles = [
        GdeltArticle(
            title="Live Incident in Strait of Hormuz",
            url="https://reuters.com/article1",
            seendate="20260715T120000Z",
            domain="reuters.com",
            language="en",
            source_country="US",
            is_synthetic=False
        )
    ]
    
    with patch("app.scheduler.fetch_gdelt_articles", new_callable=AsyncMock, return_value=mock_articles) as mock_fetch, \
         patch("app.scheduler.store_gdelt_articles", new_callable=AsyncMock, return_value=1) as mock_store, \
         patch("asyncio.sleep", new_callable=AsyncMock) as mock_sleep:
        
        await run_gdelt_poll()
        
        # Verify fetch was called
        assert mock_fetch.call_count == 5  # for each CORRIDOR_QUERIES
        assert mock_store.call_count == 5
        # Verify is_synthetic was False
        stored_articles = mock_store.call_args[1]["articles"]
        for art in stored_articles:
            assert art.is_synthetic is False

@pytest.mark.anyio
async def test_run_gdelt_poll_fallback():
    # Mock gdelt fetcher raising error to trigger golden fallback path
    with patch("app.scheduler.fetch_gdelt_articles", new_callable=AsyncMock, side_effect=Exception("Rate Limit 429")) as mock_fetch, \
         patch("app.scheduler.store_gdelt_articles", new_callable=AsyncMock, return_value=1) as mock_store, \
         patch("asyncio.sleep", new_callable=AsyncMock) as mock_sleep:
        
        await run_gdelt_poll()
        
        assert mock_fetch.call_count == 5
        assert mock_store.call_count == 5
        
        # Verify the fallbacks were stored with is_synthetic = True
        stored_articles = mock_store.call_args[1]["articles"]
        assert len(stored_articles) > 0
        for art in stored_articles:
            assert art.is_synthetic is True
            assert art.url.startswith("https://")

@pytest.mark.anyio
async def test_run_eia_poll_success():
    mock_points = [
        EiaPricePoint(period="2026-07-15", value=80.5, series="RBRTE", units="$/BBL")
    ]
    with patch("app.scheduler.fetch_spot_prices", new_callable=AsyncMock, return_value=mock_points) as mock_fetch, \
         patch("app.scheduler.store_price_points", new_callable=AsyncMock, return_value=1) as mock_store:
        
        await run_eia_poll()
        
        mock_fetch.assert_called_once_with(days_back=7)
        mock_store.assert_called_once()


def test_is_article_relevant():
    from app.ingestion.gdelt import is_article_relevant

    # False-positive exclusions (junk)
    ihsg_junk = "IHSG ditutup menguat tipis seiring kombinasi sentimen domestik - global"
    albayan_junk = "هبوط جماعي للمؤشرات الأوروبية وقطاع السفر والترفيه يقود الخسائر"
    assert is_article_relevant(ihsg_junk, "hormuz") is False
    assert is_article_relevant(albayan_junk, "hormuz") is False

    # False-negative retentions (contain index name but also strong chokepoint/oil keywords)
    ftse_oil_good = "FTSE 100 Live: Travel stocks drag but BP climbs as oil surges to four-week high"
    assert is_article_relevant(ftse_oil_good, "hormuz") is True

    # General chokepoint keywords (no corridor name but highly on-topic)
    general_good = "Iran seizes tanker in Gulf waters, oil markets react"
    assert is_article_relevant(general_good, "hormuz") is True

    # Russia route chokepoint keyword
    russia_good = "Indian refiners increase Sokol crude imports in July"
    assert is_article_relevant(russia_good, "non_hormuz_russia") is True

    # Chinese and Korean multi-lingual military and chokepoint headlines (Option A verification)
    chinese_good = "美1日2波狂轟伊擴大打擊！革命衛隊反襲美3國基地" # US strike waves and IRGC counter-strikes
    korean_good = "트럼프, 지상군 투입 검토... 이라크 미 영사관 피격" # US ground-troop review / Iraq consulate struck
    assert is_article_relevant(chinese_good, "hormuz") is True
    assert is_article_relevant(korean_good, "hormuz") is True

