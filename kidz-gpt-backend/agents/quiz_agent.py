from __future__ import annotations

from typing import Any, Dict, List
import json
import os
import re

import httpx

from models.schemas import QuizQuestion

class QuizAgent:
    def __init__(self):
        self.ollama_url = os.getenv("OLLAMA_URL", "http://localhost:11434/api/generate")
        self.model = os.getenv("OLLAMA_MODEL", "deepseek-v3.1:671b-cloud")

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

    async def generate_quiz(
        self,
        topic: str,
        explainer: Dict[str, Any],
        language: str = "en",
        selected_class: str | None = None,
    ) -> Dict[str, List[Dict[str, Any]]]:
        topic = (topic or "").strip()
        lang = (language or "en").strip().lower().split("-")[0]
        lang_name = {
            "en": "English",
            "hi": "Hindi (हिंदी)",
            "bn": "Bengali (বাংলা)",
            "ta": "Tamil (தமிழ்)",
            "te": "Telugu (తెలుగు)",
        }.get(lang, language or "English")

        grade_hint = (selected_class or "").strip()
        if grade_hint:
            grade_line = f"The child is in class/grade: {grade_hint}. Make the questions and options suitable for this grade level."
        else:
            grade_line = "The child is in primary school (roughly classes 1–5). Keep all questions simple and age-appropriate."

        system = f"""
You are a quiz creator for a children's learning app. Your role is to create a fun, simple, and educational quiz based on a given topic and explanation.

- The quiz must be in {lang_name}.
    - Questions should be simple and directly related to the provided explanation.
    - {grade_line}
- Each question must have exactly two options: one correct, one incorrect.
- The incorrect option should be plausible but clearly wrong.
- Return a JSON object with a "questions" array.
"""

        prompt = f"""
Create a 2-question quiz for a child (ages 6-10).

Topic: {topic}
Explanation:
- Summary: {explainer.get("summary", "")}
- Key Points: {"; ".join(explainer.get("points", []))}

Language: {lang_name}

RULES:
- Generate exactly 3 questions.
- Each question must have 2 options: one correct, one incorrect.
- The 'correctAnswer' field must be the 0-indexed integer of the correct option.
- All text MUST be in {lang_name}.

EXAMPLE:
Topic: "The Sun"
Explanation:
- Summary: The Sun is a star that makes its own light.
- Key Points: The Sun is a giant ball of hot gas; It gives us light and heat.
Correct JSON Output:
{{
    "questions": [
        {{
            "question": "What is the Sun?",
            "options": ["A star", "A planet"],
            "correctAnswer": 0
        }},
        {{
            "question": "What does the Sun give us?",
            "options": ["Light and heat", "Moon and stars"],
            "correctAnswer": 0
        }}
    ]
}}

REQUIRED JSON FORMAT:
{{
    "questions": [
        {{
            "question": "...",
            "options": ["...", "..."],
            "correctAnswer": 0 or 1
        }},
        {{
            "question": "...",
            "options": ["...", "..."],
            "correctAnswer": 0 or 1
        }}
    ]
}}
"""

        data = {
            "model": self.model,
            "system": system,
            "prompt": prompt,
            "stream": False,
            "format": "json",
        }

        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(self.ollama_url, json=data)
            response.raise_for_status()
            payload = response.json()

        parsed = self._parse_ollama_json(payload.get("response", "{}"))
        
        questions = []
        if isinstance(parsed.get("questions"), list):
            for q in parsed["questions"]:
                if isinstance(q, dict) and q.get("question") and isinstance(q.get("options"), list) and len(q["options"]) == 2:
                    questions.append(QuizQuestion(**q).dict())

        return {"questions": questions}


_default_agent = QuizAgent()


async def generate_quiz(
    topic: str,
    explainer: Dict[str, Any],
    language: str = "en",
    selected_class: str | None = None,
) -> Dict[str, List[Dict[str, Any]]]:
    return await _default_agent.generate_quiz(topic, explainer, language, selected_class=selected_class)