import json
from typing import Any, Dict

from models.schemas import StoryboardSchema

try:
    # If you use Google Gemini
    from google.generativeai import GenerativeModel  # type: ignore
except Exception:
    GenerativeModel = None


class ScriptAgent:
    def __init__(self):
        self.model = None
        if GenerativeModel is not None:
            # If credentials aren't configured, we'll still fall back safely at runtime
            try:
                self.model = GenerativeModel("gemini-1.5-flash")
            except Exception:
                self.model = None

    def parse_storyboard(self, raw_text: str) -> Dict[str, Any]:
        data = json.loads(raw_text)
        try:
            schema_obj = StoryboardSchema(**data)
            if hasattr(schema_obj, "model_dump"):
                return schema_obj.model_dump()
            return schema_obj.dict()  # type: ignore[attr-defined]
        except Exception:
            return data

    def _heuristic_storyboard(self, intent: Dict[str, Any], language: str) -> Dict[str, Any]:
        topic = (intent or {}).get("topic") or "yeh topic"

        # Keep it simple; orchestrator will add audio/duration/character.
        if (language or "").lower().startswith("hi"):
            return {
                "scenes": [
                    {
                        "scene": 1,
                        "background": "day_sky",
                        "dialogue": f"Tumne kabhi socha hai {topic}?",
                    },
                    {
                        "scene": 2,
                        "background": "explanation",
                        "dialogue": "Chalo isse simple tarike se samajhte hain.",
                    },
                ]
            }

        return {
            "scenes": [
                {
                    "scene": 1,
                    "background": "day_sky",
                    "dialogue": f"Have you ever wondered about {topic}?",
                },
                {
                    "scene": 2,
                    "background": "explanation",
                    "dialogue": "Let’s understand it in a simple way.",
                },
            ]
        }

    def generate_storyboard(self, intent: Dict[str, Any], language: str = "en") -> Dict[str, Any]:
        if not intent:
            return self._heuristic_storyboard({"topic": ""}, language)

        if self.model is None:
            return self._heuristic_storyboard(intent, language)

        intent_json = json.dumps(intent, ensure_ascii=False)
        prompt = f"""
You are an educational animation script generator for children.

Intent:
{intent_json}

Language: {language}

Rules:
- Max 5 scenes
- Simple sentences
- Visual explanations
- Output ONLY JSON

Output format:
{{
  "scenes": [
    {{
      "scene": 1,
      "background": "...",
      "dialogue": "..."
    }}
  ]
}}
""".strip()

        response = self.model.generate_content(prompt)
        raw = getattr(response, "text", "") or ""
        try:
            return self.parse_storyboard(raw)
        except Exception:
            return self._heuristic_storyboard(intent, language)


# Expose a module-level function for: `from agents.script_agent import generate_storyboard`
_default_agent = ScriptAgent()


def generate_storyboard(intent: Dict[str, Any], language: str = "en") -> Dict[str, Any]:
    return _default_agent.generate_storyboard(intent, language)

        
