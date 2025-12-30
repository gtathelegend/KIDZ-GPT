from typing import Any, Dict
import httpx
import json

from models.schemas import IntentSchema


class IntentAgent:
    def __init__(self):
        self.ollama_url = "http://localhost:11434/api/generate"
        self.model = "gemma3:1b"

    async def _extract_intent_from_ollama(self, text: str) -> Dict[str, Any]:
        prompt = f"""
        Extract the topic, question type, and difficulty from the following text.
        The text is: "{text}"
        Return a JSON object with the following keys: "topic", "question_type", "difficulty".
        The question_type should be one of "general", "why", "what", "how", "when", "where", "who".
        The difficulty should be "child".
        """
        
        data = {
            "model": self.model,
            "prompt": prompt,
            "stream": False,
            "format": "json"
        }
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.post(self.ollama_url, json=data)
                response.raise_for_status()
                response_json = response.json()
                # The response from ollama when not streaming is a single json object
                # with a "response" key that contains the json string.
                response_content = response_json.get("response", "{}")
                
                # Clean up the response content to be valid JSON
                # It might be wrapped in markdown json ```json ... ```
                if response_content.startswith("```json"):
                    response_content = response_content[7:-3].strip()

                intent_data = json.loads(response_content)
                
                # Ensure the schema is valid before returning
                schema_obj = IntentSchema(**intent_data)
                if hasattr(schema_obj, "model_dump"):
                    return schema_obj.model_dump()
                return schema_obj.dict()

            except (httpx.RequestError, json.JSONDecodeError) as e:
                print(f"An error occurred while communicating with Ollama: {e}")
                return {"topic": text, "question_type": "general", "difficulty": "child"}
            except Exception as e:
                print(f"An unexpected error occurred: {e}")
                return {"topic": text, "question_type": "general", "difficulty": "child"}


    async def extract_intent(self, text: str, language: str = "en") -> Dict[str, Any]:
        """
        Returns a dict like:
        { "topic": "...", "question_type": "...", "difficulty": "child" }
        """
        if not text:
            return {"topic": "", "question_type": "general", "difficulty": "child"}

        return await self._extract_intent_from_ollama(text)


_default_agent = IntentAgent()


async def extract_intent(text: str, language: str = "en") -> Dict[str, Any]:
    return await _default_agent.extract_intent(text, language)

# A non-async version for parts of the app that are not async
def extract_intent_sync(text: str, language: str = "en") -> Dict[str, Any]:
    agent = IntentAgent()
    prompt = f"""
    Extract the topic, question type, and difficulty from the following text.
    The text is: "{text}"
    Return a JSON object with the following keys: "topic", "question_type", "difficulty".
    The question_type should be one of "general", "why", "what", "how", "when", "where", "who".
    The difficulty should be "child".
    """
    data = {
        "model": agent.model,
        "prompt": prompt,
        "stream": False,
        "format": "json"
    }
    try:
        response = httpx.post(agent.ollama_url, json=data, timeout=30.0)
        response.raise_for_status()
        response_json = response.json()
        response_content = response_json.get("response", "{}")
        if response_content.startswith("```json"):
            response_content = response_content[7:-3].strip()
        intent_data = json.loads(response_content)
        schema_obj = IntentSchema(**intent_data)
        if hasattr(schema_obj, "model_dump"):
            return schema_obj.model_dump()
        return schema_obj.dict()
    except (httpx.RequestError, json.JSONDecodeError) as e:
        print(f"An error occurred while communicating with Ollama: {e}")
        return {"topic": text, "question_type": "general", "difficulty": "child"}
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        return {"topic": text, "question_type": "general", "difficulty": "child"}