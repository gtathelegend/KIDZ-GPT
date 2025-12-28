import json
from typing import Any, Dict, Optional

from models.schemas import IntentSchema

try:
    # If you use Google Gemini
    from google.generativeai import GenerativeModel  # type: ignore
except Exception:
    GenerativeModel = None


class IntentAgent:
    def __init__(self):
        self.model = None
        if GenerativeModel is not None:
            # If credentials aren't configured, we'll still fall back safely at runtime
            try:
                self.model = GenerativeModel("gemini-1.5-flash")
            except Exception:
                self.model = None

    def parse_intent(self, raw_text: str) -> Dict[str, Any]:
        """
        Parse model JSON output into a plain dict.
        If IntentSchema is strict, coerce via schema then dump back to dict.
        """
        data = json.loads(raw_text)
        try:
            schema_obj = IntentSchema(**data)
            # Pydantic v2: model_dump; v1: dict
            if hasattr(schema_obj, "model_dump"):
                return schema_obj.model_dump()
            return schema_obj.dict()  # type: ignore[attr-defined]
        except Exception:
            # If schema validation fails, just return raw parsed JSON
            return data

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

        if self.model is None:
            return self._heuristic_intent(text)

        prompt = f"""
You are an intent extraction agent for kids learning.

Input text:
"{text}"

Language: {language}

Rules:
- Detect topic
- Detect question type (why, what, how, when, where, who)
- Assume child age
- Output ONLY valid JSON

Output format:
{{
  "topic": "...",
  "question_type": "...",
  "difficulty": "child"
}}
""".strip()

        response = self.model.generate_content(prompt)
        raw = getattr(response, "text", "") or ""
        try:
            return self.parse_intent(raw)
        except Exception:
            # If the model returns non-JSON, fall back safely
            return self._heuristic_intent(text)


# Expose a module-level function for: `from agents.intent_agent import extract_intent`
_default_agent = IntentAgent()


def extract_intent(text: str, language: str = "en") -> Dict[str, Any]:
    return _default_agent.extract_intent(text, language)
