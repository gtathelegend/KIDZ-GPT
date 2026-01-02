from __future__ import annotations

from typing import Optional
import os
import re

import httpx


class TranslateAgent:
    def __init__(self):
        self.ollama_url = os.getenv("OLLAMA_URL", "http://localhost:11434/api/generate")
        self.model = os.getenv("OLLAMA_MODEL", "gemma3:1b")

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

        system = "You are a translation engine for a children's learning app."
        prompt = f"""Translate the following text into {lang_name}.

Rules:
- Output ONLY the translated text. No quotes, no JSON, no explanations.
- Keep it friendly for kids (ages 6–10).
- Preserve meaning; do not add new facts.
- Keep it short (1–2 sentences).

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
