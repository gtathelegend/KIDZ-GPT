from typing import Any, Dict

from models.schemas import StoryboardSchema


class ScriptAgent:
    def __init__(self):
        # LLM providers intentionally removed (no Google/Gemini dependency).
        pass

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

        # Heuristic-only implementation (LLM disabled).
        result = self._heuristic_storyboard(intent, language)
        try:
            schema_obj = StoryboardSchema(**result)
            if hasattr(schema_obj, "model_dump"):
                return schema_obj.model_dump()
            return schema_obj.dict()  # type: ignore[attr-defined]
        except Exception:
            return result


# Expose a module-level function for: `from agents.script_agent import generate_storyboard`
_default_agent = ScriptAgent()


def generate_storyboard(intent: Dict[str, Any], language: str = "en") -> Dict[str, Any]:
    return _default_agent.generate_storyboard(intent, language)

        
