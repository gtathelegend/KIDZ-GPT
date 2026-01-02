from __future__ import annotations

from typing import Any, Dict, List, Optional
import json
import os
import re

import httpx


VALID_ACTIONS = [
    "claping",
    "hello",
    "bye",
    "idle",
    "jump",
    "neutral",
    "question",
    "suprised",
    "thinking",
    "Tpose",
    "walking",
]


def _safe_json_parse(raw: Any) -> Dict[str, Any]:
    if isinstance(raw, dict):
        return raw

    text = str(raw or "").strip()

    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.IGNORECASE)
        text = re.sub(r"\s*```$", "", text)
        text = text.strip()

    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        text = text[start : end + 1]

    text = (
        text.replace("“", '"')
        .replace("”", '"')
        .replace("’", "'")
        .replace("‘", "'")
    )

    return json.loads(text)


def _normalize_action(action: str) -> str:
    a = str(action or "").strip()
    if a in VALID_ACTIONS:
        return a

    lower = a.lower()

    # Fix common variants / typos while respecting the project's canonical names.
    aliases = {
        "clapping": "claping",
        "clap": "claping",
        "surprised": "suprised",
        "surprise": "suprised",
        "tpose": "Tpose",
        "t-pose": "Tpose",
    }

    if lower in aliases:
        return aliases[lower]

    # Try case-insensitive match
    for valid in VALID_ACTIONS:
        if valid.lower() == lower:
            return valid

    return "neutral"


class AnimationAgent:
    def __init__(self):
        self.ollama_url = os.getenv("OLLAMA_URL", "http://localhost:11434/api/generate")
        self.model = os.getenv("OLLAMA_MODEL_ANIMATION", os.getenv("OLLAMA_MODEL", "gemma3:1b"))

    async def generate_animation_scenes(
        self,
        *,
        topic: str,
        question: str,
        storyboard_scenes: List[Dict[str, Any]],
        language: str = "en",
    ) -> List[Dict[str, Any]]:
        lang_code = (language or "en").strip().lower().split("-")[0]
        lang_name = {
            "en": "English",
            "hi": "Hindi (हिंदी)",
            "bn": "Bengali (বাংলা)",
            "ta": "Tamil (தமிழ்)",
            "te": "Telugu (తెలుగు)",
        }.get(lang_code, language or "English")

        # Reduce payload: pass just dialogue lines.
        dialogue_lines: List[str] = []
        for s in storyboard_scenes or []:
            d = str((s or {}).get("dialogue") or "").strip()
            if d:
                dialogue_lines.append(d)
        dialogue_lines = dialogue_lines[:6]

        system = (
            "You are a creative animation director for a kids learning app. "
            "You must map dialogue beats to a single 3D character's predefined animations."
        )

        prompt = f"""Create an engaging animated explanation for a child using ONLY the predefined character actions.

Language: {lang_name}
Topic: {topic}
Child's question: {question}

Available actions (MUST use EXACTLY one of these spellings):
{json.dumps(VALID_ACTIONS, ensure_ascii=False)}

Storyboard dialogue beats (use these as the core content; you may lightly rewrite to be more interactive, but keep the meaning):
{json.dumps(dialogue_lines, ensure_ascii=False)}

Rules:
- Output ONLY valid JSON. No markdown.
- Output shape MUST be:
  {{
    "scenes": [
      {{
        "scene_id": 1,
        "animation": {{"action": "hello|question|thinking|...", "loop": true|false}},
        "dialogue": {{"text": "..."}},
        "duration": 2.5
      }}
    ]
  }}
- 3 to 6 scenes.
- Every scene MUST include an animation action from the allowed list.
- Make it interactive and fun (short encouragements, reactions), but keep it educational.
- Keep each dialogue.text short (max ~18 words).
- duration is seconds (2 to 5).
- If language is not English: DO NOT use any English words.
- Prefer action choices that match the line (e.g., hello at start, question when asking, thinking when explaining, claping to praise, bye at end).
"""

        data = {
            "model": self.model,
            "system": system,
            "prompt": prompt,
            "stream": False,
            "format": "json",
        }

        async with httpx.AsyncClient(timeout=45.0) as client:
            resp = await client.post(self.ollama_url, json=data)
            resp.raise_for_status()
            payload = resp.json()

        parsed = _safe_json_parse(payload.get("response", "{}"))
        scenes = parsed.get("scenes")
        if not isinstance(scenes, list) or len(scenes) == 0:
            return []

        normalized: List[Dict[str, Any]] = []
        for idx, s in enumerate(scenes[:8]):
            if not isinstance(s, dict):
                continue

            anim = s.get("animation") if isinstance(s.get("animation"), dict) else {}
            action = _normalize_action(anim.get("action"))
            loop = bool(anim.get("loop")) if anim.get("loop") is not None else (action in {"idle", "neutral", "thinking", "walking"})

            dialogue_obj = s.get("dialogue") if isinstance(s.get("dialogue"), dict) else {}
            text = str(dialogue_obj.get("text") or "").strip()
            if not text:
                continue

            try:
                duration = float(s.get("duration") or 4)
            except Exception:
                duration = 4.0
            duration = max(2.0, min(5.0, duration))

            normalized.append(
                {
                    "scene_id": int(s.get("scene_id") or (idx + 1)),
                    "animation": {"action": action, "loop": loop},
                    "dialogue": {"text": text},
                    "duration": duration,
                }
            )

        return normalized


_default_agent = AnimationAgent()


async def generate_animation_scenes(
    *,
    topic: str,
    question: str,
    storyboard_scenes: List[Dict[str, Any]],
    language: str = "en",
) -> List[Dict[str, Any]]:
    return await _default_agent.generate_animation_scenes(
        topic=topic,
        question=question,
        storyboard_scenes=storyboard_scenes,
        language=language,
    )
