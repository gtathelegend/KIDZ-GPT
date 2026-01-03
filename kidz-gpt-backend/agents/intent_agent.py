from typing import Any, Dict
import httpx
import json
import re
import os

from models.schemas import IntentSchema


class IntentAgent:
    def __init__(self):
        self.ollama_url = os.getenv("OLLAMA_URL", "http://localhost:11434/api/generate")
        # Allow a dedicated intent model; fallback to the general model.
        self.model = os.getenv("OLLAMA_MODEL_INTENT", os.getenv("OLLAMA_MODEL", "gpt-oss:120b-cloud"))

    async def _extract_intent_from_ollama(self, text: str, language: str = "en") -> Dict[str, Any]:
        lang_code = (language or "en").strip().lower().split("-")[0]
        lang_name = {
            "en": "English",
            "hi": "Hindi (हिंदी)",
            "bn": "Bengali (বাংলা)",
            "ta": "Tamil (தமிழ்)",
            "te": "Telugu (తెలుగు)",
        }.get(lang_code, language or "English")

        prompt = f"""
You are an intent and learning-context extractor for a children's learning platform.

Your task is to read a child's spoken utterance and extract learning information
that will help explain the topic in a simple, visual, child-friendly way.

Extract the following fields:
- topic: a short, clear noun phrase (2-6 words) that describes the main subject.
- question_type: one of [general, what, why, how, when, where, who].
- difficulty: always "child".

Guidelines:
- The utterance is in {lang_name}. The topic MUST be written in {lang_name}.
- Do NOT translate the topic to another language.
- Choose the most specific learning topic possible
  (example: "why the Moon is visible at night" instead of "space").
- If multiple ideas appear, choose the one the explanation should focus on.
- If the utterance is not a question, use question_type "general".
- Ignore filler words, grammar mistakes, and unclear phrasing.
- Do NOT include any personal details or assumptions about the child.

Output rules:
- Output ONLY valid JSON.
- Do NOT include explanations, comments, or extra fields.
- The JSON must be suitable for generating a child-level explanation.

Utterance:
"{text}"

Return exactly this JSON structure:
{{"topic":"...","question_type":"...","difficulty":"child"}}
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
                intent_data = self._parse_ollama_json(response_content)
                
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

    def _parse_ollama_json(self, response_content: Any) -> Dict[str, Any]:
        if isinstance(response_content, dict):
            return response_content

        raw = str(response_content or "").strip()

        if raw.startswith("```"):
            raw = re.sub(r"^```(?:json)?\s*", "", raw, flags=re.IGNORECASE)
            raw = re.sub(r"\s*```$", "", raw)
            raw = raw.strip()

        start = raw.find("{")
        end = raw.rfind("}")
        if start != -1 and end != -1 and end > start:
            raw = raw[start : end + 1]

        raw = (
            raw.replace("“", '"')
            .replace("”", '"')
            .replace("’", "'")
            .replace("‘", "'")
        )

        return json.loads(raw)


    async def extract_intent(self, text: str, language: str = "en") -> Dict[str, Any]:
        """
        Returns a dict like:
        { "topic": "...", "question_type": "...", "difficulty": "child" }
        """
        if not text:
            return {"topic": "", "question_type": "general", "difficulty": "child"}

        return await self._extract_intent_from_ollama(text, language)


_default_agent = IntentAgent()


async def extract_intent(text: str, language: str = "en") -> Dict[str, Any]:
    return await _default_agent.extract_intent(text, language)

# A non-async version for parts of the app that are not async
def extract_intent_sync(text: str, language: str = "en") -> Dict[str, Any]:
    agent = IntentAgent()
    prompt = f"""You are an intent extractor for a kids learning app.

Task: Read the child's utterance and extract:
- topic: a short noun phrase (2-6 words) describing the core subject.
- question_type: one of [general, what, why, how, when, where, who].
- difficulty: always "child".

Rules:
- Prefer the most specific topic (e.g., "phases of the Moon" not "space").
- If multiple topics are mentioned, pick the one that the child is mainly asking about.
- If the sentence is a statement, use question_type "general".
- Output MUST be valid JSON only. No markdown, no extra keys.

Utterance: "{text}"

Return exactly:
{{"topic":"...","question_type":"...","difficulty":"child"}}
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
        raw = str(response_content or "").strip()
        if raw.startswith("```"):
            raw = re.sub(r"^```(?:json)?\s*", "", raw, flags=re.IGNORECASE)
            raw = re.sub(r"\s*```$", "", raw)
            raw = raw.strip()
        start = raw.find("{")
        end = raw.rfind("}")
        if start != -1 and end != -1 and end > start:
            raw = raw[start : end + 1]
        raw = (
            raw.replace("“", '"')
            .replace("”", '"')
            .replace("’", "'")
            .replace("‘", "'")
        )
        intent_data = json.loads(raw)
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