import pytest
import os
import json
import asyncio
from unittest.mock import AsyncMock, patch, MagicMock
from app.ingestion.ais import (
    AisAggregator,
    run_ais_stream,
    aisstream_api_key,
    AisKnownIssueFlagged,
    AisConfigurationError,
    _inside_bbox,
    _extract_mmsi,
    _extract_lat_lon
)
from app.ingestion.repository import (
    store_gdelt_articles,
    store_price_points,
    store_ais_snapshot
)
from app.ingestion.gdelt import GdeltArticle
from app.ingestion.eia import EiaPricePoint

# --- AIS.py Tests ---

@pytest.mark.anyio
async def test_aisstream_api_key_missing():
    with patch.dict("os.environ", {}, clear=True):
        with pytest.raises(AisConfigurationError):
            aisstream_api_key()

@pytest.mark.anyio
async def test_aisstream_api_key_valid():
    with patch.dict("os.environ", {"AISSTREAM_API_KEY": "test_key"}):
        assert aisstream_api_key() == "test_key"

def test_inside_bbox():
    # Hormuz bbox: [[24.5, 55.0], [27.5, 57.5]]
    bbox = [[24.5, 55.0], [27.5, 57.5]]
    assert _inside_bbox(25.0, 56.0, bbox) is True
    assert _inside_bbox(23.0, 56.0, bbox) is False
    assert _inside_bbox(25.0, 58.0, bbox) is False

def test_extract_mmsi():
    payload = {
        "MetaData": {"MMSI": 123456},
        "Message": {"PositionReport": {"UserID": 654321}}
    }
    assert _extract_mmsi(payload) == "123456"
    
    payload_no_metadata = {
        "Message": {"PositionReport": {"UserID": 654321}}
    }
    assert _extract_mmsi(payload_no_metadata) == "654321"

def test_extract_lat_lon():
    payload = {
        "MetaData": {"latitude": 25.123, "Longitude": 56.456}
    }
    lat, lon = _extract_lat_lon(payload)
    assert lat == 25.123
    assert lon == 56.456

@pytest.mark.anyio
async def test_ais_aggregator_add_message_error():
    session_factory = MagicMock()
    aggregator = AisAggregator(session_factory=session_factory)
    
    # Payload has error field (issue #174 shape)
    error_payload = {"error": "Api Key Is Not Valid"}
    with pytest.raises(AisKnownIssueFlagged):
        await aggregator.add_message(error_payload)

@pytest.mark.anyio
async def test_ais_aggregator_add_message_valid():
    session_factory = MagicMock()
    mock_session = MagicMock()
    mock_session.commit = AsyncMock()
    
    mock_context = MagicMock()
    mock_context.__aenter__ = AsyncMock(return_value=mock_session)
    mock_context.__aexit__ = AsyncMock()
    session_factory.return_value = mock_context
    
    aggregator = AisAggregator(session_factory=session_factory, snapshot_interval_seconds=0)
    
    # Vessel coordinates inside Hormuz
    payload = {
        "MetaData": {"MMSI": 999999, "latitude": 25.0, "longitude": 56.0},
        "Message": {"PositionReport": {}}
    }
    
    with patch("app.ingestion.ais.store_ais_snapshot", new_callable=AsyncMock) as mock_store:
        await aggregator.add_message(payload)
        # Flush occurs because snapshot_interval_seconds is 0
        assert mock_store.call_count == 5
        # Verify vessel count in the call args
        first_call_args = mock_store.call_args_list[0][1]
        assert first_call_args["vessel_count"] == 1
        assert first_call_args["bounding_box"] == "hormuz"

@pytest.mark.anyio
async def test_run_ais_stream_loop():
    session_factory = MagicMock()
    
    # We mock _connect_and_stream to raise AisKnownIssueFlagged once, then CancelledError to stop the loop
    with patch("app.ingestion.ais._connect_and_stream", side_effect=[AisKnownIssueFlagged("API Key not recognized"), asyncio.CancelledError()]), \
         patch("asyncio.sleep", new_callable=AsyncMock) as mock_sleep:
        
        with pytest.raises(asyncio.CancelledError):
            await run_ais_stream(session_factory)
        
        mock_sleep.assert_called_once_with(60)

# --- Repository.py Tests ---

@pytest.mark.anyio
async def test_store_gdelt_articles():
    mock_session = AsyncMock()
    articles = [
        GdeltArticle(
            title="T1", url="https://a.com", seendate="20260715",
            domain="a.com", language="en", source_country="US", is_synthetic=True
        )
    ]
    mock_execute_res1 = MagicMock()
    mock_execute_res1.all.return_value = []
    mock_execute_res2 = MagicMock(rowcount=1)
    mock_session.execute.side_effect = [mock_execute_res1, mock_execute_res2]
    
    cnt = await store_gdelt_articles(mock_session, "hormuz", "query", articles)
    assert cnt == 1
    assert mock_session.execute.call_count == 2
    mock_session.commit.assert_called_once()

@pytest.mark.anyio
async def test_store_price_points():
    mock_session = AsyncMock()
    points = [
        EiaPricePoint(period="2026-07-15", value=80.0, series="RBRTE", units="$/BBL")
    ]
    mock_result = MagicMock(rowcount=1)
    mock_session.execute.return_value = mock_result
    
    cnt = await store_price_points(mock_session, "EIA", points)
    assert cnt == 1
    mock_session.execute.assert_called_once()
    mock_session.commit.assert_called_once()

@pytest.mark.anyio
async def test_store_ais_snapshot():
    mock_session = MagicMock()
    mock_session.commit = AsyncMock()
    mock_session.refresh = AsyncMock()
    
    res = await store_ais_snapshot(mock_session, "hormuz", 12, "/tmp/raw.json")
    assert res.bounding_box == "hormuz"
    assert res.vessel_count == 12
    assert res.raw_payload_path == "/tmp/raw.json"
    mock_session.add.assert_called_once_with(res)
    mock_session.commit.assert_called_once()


@pytest.mark.anyio
async def test_store_gdelt_articles_dedup():
    from app.ingestion.repository import store_gdelt_articles
    from app.ingestion.gdelt import GdeltArticle as FetchedGdeltArticle
    
    # 4 syndicated instances of the exact same wire story title
    title = "US airstrikes hit northern Iran as it disables ship trying to breach blockade"
    articles = [
        FetchedGdeltArticle(title=title, url="https://warringtonguardian.co.uk/1", seendate="20260716", domain="warringtonguardian.co.uk", language="en", source_country="UK"),
        FetchedGdeltArticle(title=title, url="https://braintreeandwithamtimes.co.uk/2", seendate="20260716", domain="braintreeandwithamtimes.co.uk", language="en", source_country="UK"),
        FetchedGdeltArticle(title=title, url="https://southwalesguardian.co.uk/3", seendate="20260716", domain="southwalesguardian.co.uk", language="en", source_country="UK"),
        FetchedGdeltArticle(title=title, url="https://sthelensstar.co.uk/4", seendate="20260716", domain="sthelensstar.co.uk", language="en", source_country="UK"),
    ]
    
    mock_session = MagicMock()
    mock_session.commit = AsyncMock()
    
    mock_execute_res1 = MagicMock()
    mock_execute_res1.all.return_value = []
    mock_execute_res2 = MagicMock(rowcount=1)
    mock_session.execute = AsyncMock(side_effect=[mock_execute_res1, mock_execute_res2])
    
    cnt = await store_gdelt_articles(mock_session, corridor="hormuz", query="test", articles=articles)
    
    # Verify that only a single row was inserted because the other 3 identical titles were batch-deduplicated
    assert cnt == 1
    assert mock_session.execute.call_count == 2

