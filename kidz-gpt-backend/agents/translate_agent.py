from __future__ import annotations

from typing import Optional
import os
import re

import httpx


class TranslateAgent:
    def __init__(self):
        self.ollama_url = os.getenv("OLLAMA_URL", "http://localhost:11434/api/generate")
        self.model = os.getenv("OLLAMA_MODEL", "gpt-oss:20b-cloud")

    def _language_name(self, language: str) -> str:
        lang = (language or "").strip().lower().split("-")[0]
        return {
            "en": "English",
            "hi": "Hindi (हिंदी)",
            "bn": "Bengali (বাংলা)",
            "ta": "Tamil (தமிழ்)",
            "te": "Telugu (తెలుగు)",
        }.get(lang, language)

    async def translate(self, text: str, target_language: str) -> str:
        if not text:
            return text

        lang = (target_language or "").strip().lower().split("-")[0]
        if lang in ["", "unknown", "auto", "en"]:
            return text

        lang_name = self._language_name(lang)

        system = """
You are a translation engine for a children's learning application.

Your only job is to translate text accurately and simply so that
children aged 6–10 can easily understand it.

You must not explain, summarize, or add information.
You must not include any formatting or extra text.
"""

        prompt = f"""
Translate the text below into {lang_name}.

STRICT RULES:
- Output ONLY the translated text.
- Do NOT use quotes, JSON, markdown, or labels.
- Preserve the original meaning exactly.
- Do NOT add new facts or explanations.
- Use simple, child-friendly words.
- Keep the tone calm and friendly.
- Keep the length similar to the original (maximum 1–2 short sentences).
- If the original text is already in {lang_name}, return it unchanged.
- Ignore grammar mistakes in the input and translate the intended meaning.

Text:
{text}
"""


        data = {
            "model": self.model,
            "system": system,
            "prompt": prompt,
            "stream": False,
        }

        async with httpx.AsyncClient(timeout=45.0) as client:
            response = await client.post(self.ollama_url, json=data)
            response.raise_for_status()
            payload = response.json()

        translated = (payload.get("response") or "").strip()

        # Strip accidental wrapping quotes / code fences.
        translated = re.sub(r"^```(?:\w+)?\s*", "", translated, flags=re.IGNORECASE).strip()
        translated = re.sub(r"\s*```$", "", translated).strip()
        translated = translated.strip().strip('"').strip()

        return translated or text


_default_agent = TranslateAgent()


async def translate_text(text: str, target_language: str) -> str:
    return await _default_agent.translate(text, target_language)
