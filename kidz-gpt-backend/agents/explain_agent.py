from __future__ import annotations

from typing import Any, Dict, List
import json
import os
import re

import httpx

from models.schemas import ExplainerSchema


class ExplainAgent:
    def __init__(self):
        self.ollama_url = os.getenv("OLLAMA_URL", "http://localhost:11434/api/generate")
        self.model = os.getenv("OLLAMA_MODEL", "gpt-oss:20b-cloud")

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

        print(f"Cleaned JSON string for parsing: {raw}")
        return json.loads(raw)

    def _normalize_points(self, points: Any) -> List[str]:
        if isinstance(points, list):
            items = [str(x).strip() for x in points if x is not None]
        elif isinstance(points, str):
            # Sometimes the model returns a single string with bullets
            items = re.split(r"\n+|•|-\s+", points)
            items = [s.strip() for s in items if s.strip()]
        else:
            items = []

        cleaned: List[str] = []
        for item in items:
            text = re.sub(r"\s+", " ", item).strip()
            text = re.sub(r"^[•\-\s]+", "", text).strip()
            if not text:
                continue
            # Avoid questions in the explainer
            text = text.replace("?", "")
            if len(text) < 6:
                continue
            if any(text.lower() == x.lower() for x in cleaned):
                continue
            cleaned.append(text)
            if len(cleaned) >= 4:
                break

        return cleaned

    async def explain(self, topic: str, question: str, language: str = "en") -> Dict[str, Any]:
        topic = (topic or "").strip()
        question = (question or "").strip()
        lang = (language or "en").strip().lower().split("-")[0]
        lang_name = {
            "en": "English",
            "hi": "Hindi (हिंदी)",
            "bn": "Bengali (বাংলা)",
            "ta": "Tamil (தமிழ்)",
            "te": "Telugu (తెలుగు)",
        }.get(lang, language or "English")
        system = """
You are an educational explanation writer for a children's learning application.

Your role is to explain one topic clearly, factually, and simply for children aged 6–10.
You write short, easy-to-understand explanations using concrete ideas and simple language.

You must:
- Explain the topic directly and accurately
- Use simple cause-and-effect reasoning
- Keep language calm, neutral, and factual

You must NOT:
- Write stories, dialogue, or conversations
- Ask questions
- Address the child directly
- Use metaphors, jokes, or dramatic language
- Include opinions or extra facts beyond the topic
"""


        prompt = f"""
Write a clear educational explanation for a child (ages 6–10).

Topic:
{topic}

Child's Question:
{question}

Language:
{lang_name}

STRICT CONTENT RULES:
- ALL text MUST be written ONLY in {lang_name}.
- DO NOT include any English words if {lang_name} is not English.
- DO NOT write dialogue or conversational sentences.
- DO NOT address the child directly.
- DO NOT ask questions.
- DO NOT add unrelated facts or examples.
- Keep explanations concrete and easy to understand.
- Use short, simple sentences only.

EXAMPLE:
Topic: "The Sun"
Question: "Why is the sun so bright?"
Language: "English"
Correct JSON Output:
{{
    "title": "The Bright Sun",
    "summary": "The Sun is a star that makes its own light, making it very bright.",
    "points": [
        "The Sun is a giant ball of hot gas.",
        "It produces light and heat through a process called nuclear fusion.",
        "This light travels through space to reach our eyes, making the Sun appear bright."
    ]
}}

STRUCTURE RULES:
- Title: 2–5 simple words describing the topic.
- Summary: 1–2 short sentences explaining the main idea.
- Points: exactly 3 short bullet-style points explaining facts or steps.
- Each point must explain ONE clear idea.

OUTPUT RULES:
- Return ONLY valid JSON.
- Do NOT include explanations, comments, or extra text.
- Follow the JSON structure exactly.

REQUIRED JSON FORMAT:
                {{
                    "title": "...",
                    "summary": "...",
                    "points": ["...", "...", "..."]
                }}
"""


        data = {
            "model": self.model,
            "system": system,
            "prompt": prompt,
            "stream": False,
            "format": "json",
        }

        async with httpx.AsyncClient(timeout=45.0) as client:
            response = await client.post(self.ollama_url, json=data)
            response.raise_for_status()
            payload = response.json()

        print(f"Ollama raw response: {payload.get('response')}") # Log raw response
        parsed = self._parse_ollama_json(payload.get("response", "{}"))

        title = str(parsed.get("title") or topic or "Explanation").strip()
        summary = str(parsed.get("summary") or "").strip()
        points = self._normalize_points(parsed.get("points"))

        # Language-specific fallback text
        if not summary:
            summary_by_lang = {
                "hi": f"{title} को कुछ सरल विचारों से समझा जा सकता है।",
                "bn": f"{title} কয়েকটি সহজ ধারণা দিয়ে বোঝা যায়।",
                "ta": f"{title} சில எளிய எண்ணங்களால் புரிந்து கொள்ளலாம்.",
                "te": f"{title} కొన్ని సరళమైన ఆలోచనలతో అర్థం చేసుకోవచ్చు.",
                "en": f"{title} is something we can understand with a few simple ideas.",
            }
            summary = summary_by_lang.get(lang, summary_by_lang["en"])

        if len(points) < 3:
            # Language-specific deterministic fallback
            fallback_points = {
                "hi": [
                    "इसका एक सरल अर्थ है।",
                    "इसके महत्वपूर्ण भाग या चरण हैं।",
                    "यह हमें समझने में मदद करता है।",
                ],
                "bn": [
                    "এর একটি সহজ অর্থ আছে।",
                    "এর গুরুত্বপূর্ণ অংশ বা ধাপ আছে।",
                    "এটা আমাদের বুঝতে সাহায্য করে।",
                ],
                "ta": [
                    "இதற்கு ஒரு எளிய பொருள் உள்ளது.",
                    "இதில் முக்கியமான பகுதிகள் அல்லது படிகள் உள்ளன.",
                    "இது நமக்கு புரிந்து கொள்ள உதவுகிறது.",
                ],
                "te": [
                    "దీనికి ఒక సరళమైన అర్థం ఉంది.",
                    "దీనికి ముఖ్యమైన భాగాలు లేదా దశలు ఉన్నాయి.",
                    "ఇది మనకు అర్థం చేసుకోవడానికి సహాయపడుతుంది.",
                ],
                "en": [
                    "It has a simple meaning.",
                    "It has important parts or steps.",
                    "It helps us understand how something works.",
                ],
            }
            points = (points + fallback_points.get(lang, fallback_points["en"]))[:3]

        schema_obj = ExplainerSchema(title=title, summary=summary, points=points)
        if hasattr(schema_obj, "model_dump"):
            return schema_obj.model_dump()
        return schema_obj.dict()


_default_agent = ExplainAgent()


async def generate_explainer(topic: str, question: str, language: str = "en") -> Dict[str, Any]:
    return await _default_agent.explain(topic, question, language)
