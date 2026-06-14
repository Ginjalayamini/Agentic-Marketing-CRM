import json
import logging

from app.config import get_settings

logger = logging.getLogger(__name__)


class AIService:
    def __init__(self) -> None:
        self.settings = get_settings()

    def generate_campaign(self, goal: str, audience_size: int, reasons: list[str]) -> dict:
        fallback = {
            "recommended_campaign": "Personalized winback offer",
            "channel": "whatsapp",
            "message": "Hi {{name}}, we missed you. Enjoy 20% OFF on your next order this week.",
        }
        if not self.settings.gemini_api_key:
            return fallback

        try:
            import google.generativeai as genai

            genai.configure(api_key=self.settings.gemini_api_key)
            model = genai.GenerativeModel(self.settings.gemini_model)
            prompt = (
                "Return compact JSON for a retail campaign with keys recommended_campaign, channel, message. "
                f"Goal: {goal}. Audience size: {audience_size}. Reasons: {', '.join(reasons)}. "
                "Use personalization variable {{name}} and one of email, whatsapp, sms, rcs."
            )
            response = model.generate_content(prompt)
            text = (response.text or "").strip().strip("`")
            if text.startswith("json"):
                text = text[4:].strip()
            generated = json.loads(text)
            return fallback | generated
        except Exception:
            logger.exception("Gemini generation failed; using fallback campaign")
            return fallback

    def next_best_campaign(self, metrics: dict) -> dict:
        if metrics.get("inactive_count", 0) > metrics.get("vip_count", 0):
            return {
                "audience": "Inactive high-value customers",
                "offer": "20% comeback incentive valid for 7 days",
                "channel": "whatsapp",
                "expected_outcome": "Recover dormant revenue with a projected 8-12% conversion rate",
                "reasoning": "Inactive customers are the largest immediate revenue recovery pool.",
            }
        return {
            "audience": "VIP and loyal customers",
            "offer": "Early access bundle with premium rewards",
            "channel": "email",
            "expected_outcome": "Increase repeat revenue with a projected 12-16% click rate",
            "reasoning": "VIP customers show the strongest purchase intent and higher average order value.",
        }
