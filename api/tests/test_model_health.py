import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from app.llm.model_health import check_model_health, send_alert

@pytest.mark.anyio
async def test_check_model_health_success():
    # Mocking Gemini response
    gemini_data = {
        "models": [
            {"name": "models/gemini-3.1-flash-lite"},
            {"name": "models/gemini-pro"}
        ]
    }
    # Mocking Groq response
    groq_data = {
        "data": [
            {"id": "openai/gpt-oss-120b"},
            {"id": "openai/gpt-oss-20b"},
            {"id": "llama-3.3-70b-versatile"}
        ]
    }

    mock_res_gemini = MagicMock()
    mock_res_gemini.status_code = 200
    mock_res_gemini.json.return_value = gemini_data

    mock_res_groq = MagicMock()
    mock_res_groq.status_code = 200
    mock_res_groq.json.return_value = groq_data

    # We mock the http client get calls
    async def mock_get(url, *args, **kwargs):
        if "generativelanguage" in url:
            return mock_res_gemini
        elif "groq.com" in url:
            return mock_res_groq
        raise ValueError(f"Unexpected url: {url}")

    with patch("httpx.AsyncClient.get", side_effect=mock_get), \
         patch("app.llm.model_health.send_alert", new_callable=AsyncMock) as mock_alert, \
         patch.dict("os.environ", {"GEMINI_API_KEY": "valid_key", "GROQ_API_KEY": "valid_key"}):
        
        res = await check_model_health(
            gemini_models=["models/gemini-3.1-flash-lite"],
            groq_models=["openai/gpt-oss-120b", "openai/gpt-oss-20b"]
        )
        assert res is True
        mock_alert.assert_not_called()

@pytest.mark.anyio
async def test_check_model_health_negative_failure():
    # Negative test: point check_model_health at a deliberately non-existent model ID
    gemini_data = {
        "models": [
            {"name": "models/gemini-3.1-flash-lite"}
        ]
    }
    groq_data = {
        "data": [
            {"id": "openai/gpt-oss-20b"}
        ]
    }

    mock_res_gemini = MagicMock()
    mock_res_gemini.status_code = 200
    mock_res_gemini.json.return_value = gemini_data

    mock_res_groq = MagicMock()
    mock_res_groq.status_code = 200
    mock_res_groq.json.return_value = groq_data

    async def mock_get(url, *args, **kwargs):
        if "generativelanguage" in url:
            return mock_res_gemini
        elif "groq.com" in url:
            return mock_res_groq
        raise ValueError(f"Unexpected url: {url}")

    with patch("httpx.AsyncClient.get", side_effect=mock_get), \
         patch("app.llm.model_health.send_alert", new_callable=AsyncMock) as mock_alert, \
         patch.dict("os.environ", {"GEMINI_API_KEY": "valid_key", "GROQ_API_KEY": "valid_key"}):
        
        # Pointing to a fake model ID 'openai/non-existent-model-120b'
        res = await check_model_health(
            gemini_models=["models/gemini-3.1-flash-lite"],
            groq_models=["openai/non-existent-model-120b"]
        )
        # Verify the validation fails
        assert res is False
        # Verify the webhook alert is fired
        mock_alert.assert_called_once()
        assert "openai/non-existent-model-120b" in mock_alert.call_args[0][0]
