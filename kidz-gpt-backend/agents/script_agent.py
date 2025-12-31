from typing import Any, Dict
import httpx
import json

from models.schemas import StoryboardSchema


class ScriptAgent:
    def __init__(self):
        self.ollama_url = "http://localhost:11434/api/generate"
        self.model = "gemma3:1b"

    async def _generate_storyboard_from_ollama(self, intent: Dict[str, Any], language: str) -> Dict[str, Any]:
        topic = (intent or {}).get("topic") or "a random topic"

        prompt = f"""
        Generate a short, simple storyboard for a child about "{topic}".
        The number of scenes can vary, but should be appropriate for the topic's complexity.
        The language should be {language}.
        Return a JSON object with a "scenes" key, which is a list of scenes.
        Each scene object should have "scene" (number), "background" (a simple description), and "dialogue" (one sentence).
        """

        data = {
            "model": self.model,
            "prompt": prompt,
            "stream": False,
            "format": "json"
        }

        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                response = await client.post(self.ollama_url, json=data)
                response.raise_for_status()
                response_json = response.json()
                response_content = response_json.get("response", "{}")
                
                if response_content.startswith("```json"):
                    response_content = response_content[7:-3].strip()

                storyboard_data = json.loads(response_content)

                # Basic validation
                if "scenes" not in storyboard_data or not isinstance(storyboard_data["scenes"], list):
                    raise ValueError("Invalid storyboard format from LLM")

                return storyboard_data

            except (httpx.RequestError, json.JSONDecodeError, ValueError) as e:
                print(f"An error occurred while generating storyboard: {e}")
                # Fallback to heuristic
                return self._heuristic_storyboard(intent, language)

    def _heuristic_storyboard(self, intent: Dict[str, Any], language: str) -> Dict[str, Any]:
        topic = (intent or {}).get("topic") or "that topic"
        if (language or "").lower().startswith("hi"):
            return {"scenes": [{"scene": 1, "background": "day_sky", "dialogue": f"Tumne kabhi socha hai {topic}?"}, {"scene": 2, "background": "explanation", "dialogue": "Chalo isse simple tarike se samajhte hain."}]}
        return {"scenes": [{"scene": 1, "background": "day_sky", "dialogue": f"Have you ever wondered about {topic}?"}, {"scene": 2, "background": "explanation", "dialogue": "Let’s understand it in a simple way."}]}

    async def generate_storyboard(self, intent: Dict[str, Any], language: str = "en") -> Dict[str, Any]:
        if not intent:
            return self._heuristic_storyboard({"topic": ""}, language)

        result = await self._generate_storyboard_from_ollama(intent, language)
        try:
            schema_obj = StoryboardSchema(**result)
            if hasattr(schema_obj, "model_dump"):
                return schema_obj.model_dump()
            return schema_obj.dict()
        except Exception:
            return result


_default_agent = ScriptAgent()


async def generate_storyboard(intent: Dict[str, Any], language: str = "en") -> Dict[str, Any]:
    return await _default_agent.generate_storyboard(intent, language)