"""Tests for LLM Narrative Fallback Chain."""
import pytest
from app.llm.narrative import generate_template_fallback, generate_narrative


def test_template_fallback():
    """Verify that template fallback constructs a clean markdown output containing corridor scores."""
    risk_scores = [
        {
            "corridor": "hormuz",
            "score": 45.5,
            "component_gdelt_volume": 0.5,
            "component_price_volatility": 0.1,
            "component_ais_deviation": 0.2,
        }
    ]
    recent_articles = [
        {"title": "Middle East Tension Escalates", "url": "http://example.com/1", "domain": "example.com"}
    ]
    ais_counts = {"hormuz": 38, "jamnagar_vadinar": 12}

    output = generate_template_fallback(risk_scores, recent_articles, ais_counts)

    assert "Geopolitical Risk Narrative" in output
    assert "Hormuz" in output
    assert "45.5" in output
    assert "Middle East Tension" in output
    assert "38 vessels" in output


@pytest.mark.anyio
async def test_generate_narrative_fallback_chain_without_keys(monkeypatch):
    """Verify that generate_narrative falls back to template when API keys are absent."""
    # Ensure keys are not in environment
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    monkeypatch.delenv("GROQ_API_KEY", raising=False)

    risk_scores = [{"corridor": "hormuz", "score": 25.0, "component_gdelt_volume": 0.0, "component_price_volatility": 0.0, "component_ais_deviation": 0.0}]
    recent_articles = []
    ais_counts = {}

    output = await generate_narrative(risk_scores, recent_articles, ais_counts)

    assert "Hormuz" in output
