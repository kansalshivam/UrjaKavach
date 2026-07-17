import os
import logging
import httpx

logger = logging.getLogger(__name__)

DEFAULT_GEMINI_MODELS = ["models/gemini-3.1-flash-lite"]
DEFAULT_GROQ_MODELS = ["openai/gpt-oss-120b", "openai/gpt-oss-20b"]

async def send_alert(message: str) -> None:
    webhook_url = os.getenv("ALERT_WEBHOOK_URL", "").strip()
    logger.error("ALERT: %s", message)
    if webhook_url:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                res = await client.post(webhook_url, json={"text": f"🚨 *Urja Kavach LLM Alert* 🚨\n{message}"})
                if res.status_code >= 400:
                    logger.warning("Failed to deliver alert webhook: %s %s", res.status_code, res.text)
        except Exception as e:
            logger.warning("Error delivering alert webhook: %s", e)

async def check_model_health(
    gemini_models: list[str] = DEFAULT_GEMINI_MODELS,
    groq_models: list[str] = DEFAULT_GROQ_MODELS
) -> bool:
    gemini_key = os.getenv("GEMINI_API_KEY", "").strip()
    groq_key = os.getenv("GROQ_API_KEY", "").strip()

    gemini_ok = True
    groq_ok = True
    missing_models = []

    # 1. Check Gemini Models
    if gemini_key and gemini_key != "PLACEHOLDER_PLEASE_ROTATE_KEY":
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models?key={gemini_key}"
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.get(url)
                if res.status_code == 200:
                    data = res.json()
                    available_names = {m.get("name") for m in data.get("models", [])}
                    logger.info("Live Gemini Models: %s", available_names)
                    for model in gemini_models:
                        if model not in available_names:
                            missing_models.append(f"Gemini: {model}")
                            gemini_ok = False
                else:
                    msg = f"Gemini models endpoint returned status {res.status_code}: {res.text}"
                    await send_alert(msg)
                    gemini_ok = False
        except Exception as e:
            msg = f"Gemini models health check error: {str(e)}"
            await send_alert(msg)
            gemini_ok = False
    else:
        logger.warning("Gemini API key not configured or masked. Skipping live check.")

    # 2. Check Groq Models
    if groq_key:
        try:
            url = "https://api.groq.com/openai/v1/models"
            headers = {"Authorization": f"Bearer {groq_key}"}
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.get(url, headers=headers)
                if res.status_code == 200:
                    data = res.json()
                    available_ids = {m.get("id") for m in data.get("data", [])}
                    logger.info("Live Groq Models: %s", available_ids)
                    for model in groq_models:
                        if model not in available_ids:
                            missing_models.append(f"Groq: {model}")
                            groq_ok = False
                else:
                    msg = f"Groq models endpoint returned status {res.status_code}: {res.text}"
                    await send_alert(msg)
                    groq_ok = False
        except Exception as e:
            msg = f"Groq models health check error: {str(e)}"
            await send_alert(msg)
            groq_ok = False
    else:
        logger.warning("Groq API key not configured. Skipping live check.")

    if missing_models:
        alert_msg = f"Configured LLM models are missing from live APIs:\n" + "\n".join(f"- {m}" for m in missing_models)
        await send_alert(alert_msg)
        return False

    return gemini_ok and groq_ok
