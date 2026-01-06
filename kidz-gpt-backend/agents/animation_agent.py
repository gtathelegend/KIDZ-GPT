from __future__ import annotations

from typing import Any, Dict, List, Optional
import hashlib
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
        self.model = os.getenv("OLLAMA_MODEL_ANIMATION", os.getenv("OLLAMA_MODEL", "deepseek-v3.1:671b-cloud"))

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

        character_pref = (os.getenv("KIDZ_CHARACTER") or "girl").strip().lower()
        if character_pref == "random":
            seed = f"{topic}|{question}|{lang_code}".encode("utf-8")
            character = "girl" if (hashlib.sha256(seed).digest()[0] % 2 == 0) else "boy"
        elif character_pref in {"boy", "girl", "ben10"}:
            character = character_pref
        else:
            character = "girl"

        # Reduce payload: pass just dialogue lines.
        dialogue_lines: List[str] = []
        for s in storyboard_scenes or []:
            d = str((s or {}).get("dialogue") or "").strip()
            if d:
                dialogue_lines.append(d)
        dialogue_lines = dialogue_lines[:6]

        system = """
You are an animation director for a children's learning application.

Your responsibility is to convert educational dialogue beats into a sequence
of animated scenes using ONE predefined 3D character.

You must choose the most appropriate predefined animation action
for each dialogue line so that the character's movement matches the meaning.

You do NOT create new animations.
You do NOT invent new actions.
You do NOT change the educational meaning of the dialogue.

Your output will directly control a real-time Three.js character.
Any incorrect action name or extra text will break the animation system.
"""


        prompt = f"""
Create an animated explanation for a child by mapping dialogue beats
to character animation actions that feel lively and friendly.

Language:
{lang_name}

Topic:
{topic}

Child's Question:
{question}

AVAILABLE CHARACTER ACTIONS (kid-friendly moves only)
(You MUST choose EXACTLY one action from this list for each scene):
{json.dumps(VALID_ACTIONS, ensure_ascii=False)}

STORYBOARD DIALOGUE BEATS
(These contain the educational content. You may slightly rewrite
each line to sound friendly and engaging, but you MUST keep the meaning):
{json.dumps(dialogue_lines, ensure_ascii=False)}

STRICT RULES:
- Output ONLY valid JSON. No markdown, no explanations.
- Use ONLY the actions listed above. Do NOT invent new actions.
- Each scene MUST include exactly one animation action.
- The animation action must match the intent of the dialogue line.
- Keep dialogue.text short and simple (maximum 18 words).
- Tone must be warm, playful, encouraging, and easy for a 7-year-old.
- Use upbeat verbs and supportive phrases; add gentle cheers on praise moments.
- Do NOT ask new questions unless the original dialogue line is a question.
- Do NOT add new facts or explanations.
- Do NOT include personal references.
- If the language is NOT English, do NOT use ANY English words.

STRUCTURE RULES:
- Number of scenes: 3 to 6.
- scene_id must start at 1 and increase by 1.
- duration must be a number between 2 and 5 (seconds).
- loop should be:
  - true for talking or thinking actions
  - false for greeting, reacting, celebrating, or ending actions

ACTION SELECTION GUIDELINES:
- Start with a friendly greeting.
- Use question actions when the dialogue expresses curiosity.
- Use thinking or neutral/idle for calm explaining beats; alternate to avoid feeling frozen.
- Use celebration (claping/hello) or upbeat motions on praise/encouragement.
- Use ending actions for the final scene.

OUTPUT FORMAT (MUST MATCH EXACTLY):
{{
    "scenes": [
        {{
            "scene_id": 1,
            "animation": {{ "action": "...", "loop": true }},
            "dialogue": {{ "text": "..." }},
            "duration": 3
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
                    "character": character,
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
