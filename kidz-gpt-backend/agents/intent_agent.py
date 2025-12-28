from typing import Any, Dict

from models.schemas import IntentSchema


class IntentAgent:
    def __init__(self):
        # LLM providers intentionally removed (no Google/Gemini dependency).
        pass

    def _heuristic_intent(self, text: str) -> Dict[str, Any]:
        text_lower = text.lower()

        question_type = "general"
        for qt in ["why", "what", "how", "when", "where", "who"]:
            if qt in text_lower:
                question_type = qt
                break

        topic = text.strip()[:200] if text else ""

        return {
            "topic": topic,
            "question_type": question_type,
            "difficulty": "child",
        }

    def extract_intent(self, text: str, language: str = "en") -> Dict[str, Any]:
        """
        Returns a dict like:
        { "topic": "...", "question_type": "...", "difficulty": "child" }
        """
        if not text:
            return {"topic": "", "question_type": "general", "difficulty": "child"}

        # Heuristic-only implementation (LLM disabled).
        # Keep schema import available for future validation if needed.
        result = self._heuristic_intent(text)
        try:
            schema_obj = IntentSchema(**result)
            if hasattr(schema_obj, "model_dump"):
                return schema_obj.model_dump()
            return schema_obj.dict()  # type: ignore[attr-defined]
        except Exception:
            return result


# Expose a module-level function for: `from agents.intent_agent import extract_intent`
_default_agent = IntentAgent()


def extract_intent(text: str, language: str = "en") -> Dict[str, Any]:
    return _default_agent.extract_intent(text, language)
