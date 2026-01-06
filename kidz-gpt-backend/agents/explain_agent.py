from __future__ import annotations
from typing import Any, Dict, List, Optional
import json
import os
import re

import httpx

VALID_ACTIONS = {
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
}


# ---------- Utility helpers ----------

def _estimate_duration(text: str) -> int:
    """
    Estimate scene duration based on dialogue length.
    Keeps animation pacing natural.
    """
    if not text:
        return 3
    words = len(text.split())
    return min(5, max(2, round(words / 3)))


def _is_explanatory(text: str) -> bool:
    return any(
        k in text
        for k in ["because", "so", "this is why", "that is why", "means", "helps", "makes"]
    )


# ---------- Action selection ----------

def _pick_action_from_text(text: str, *, idx: int, total: int) -> str:
    t = (text or "").strip().lower()

    # Positional anchors
    if idx == 0:
        return "hello"

    if idx == total - 1:
        if any(k in t for k in ["bye", "goodbye", "see you", "we learned", "today we learned"]):
            return "bye"

    # Praise / encouragement
    if any(k in t for k in ["great", "awesome", "well done", "good job", "nice work", "yay"]):
        return "claping"

    # Question detection
    if "?" in t or re.match(r"^(do|did|can|could|why|what|how|when|where)\b", t):
        return "question"

    # Thinking / explaining
    if _is_explanatory(t) or any(k in t for k in ["think", "imagine", "remember"]):
        return "thinking"

    # Surprise / emphasis
    if any(k in t for k in ["wow", "amazing", "surprise", "oh", "whoa"]):
        return "suprised"

    # Movement intent
    if any(k in t for k in ["walk", "go", "come", "move"]):
        return "walking"

    if any(k in t for k in ["jump", "hop"]):
        return "jump"

    # Fallback alternation for natural idle motion
    return "idle" if idx % 2 else "neutral"


# ---------- Main builder ----------

def build_animation_scenes(
    *,
    storyboard_scenes: List[Dict[str, Any]],
    explainer: Optional[Dict[str, Any]] = None,
    language: str = "en",
) -> List[Dict[str, Any]]:
    """
    Builds animation-friendly scenes optimized for real-time 3D characters.
    """

    lang = (language or "en").lower().split("-")[0]
    out: List[Dict[str, Any]] = []

    # ---------- Optional opener (English only, safe) ----------
    if lang == "en":
        title = (explainer or {}).get("title") or ""
        opener = (
            f"Hi! Today we will learn about {title}."
            if title
            else "Hi! Let's learn something fun together!"
        )
        out.append(
            {
                "scene_id": 0,
                "animation": {"action": "hello", "loop": False},
                "dialogue": {"text": opener},
                "duration": 3,
            }
        )

    total = len(storyboard_scenes or [])

    for idx, s in enumerate(storyboard_scenes or []):
        dialogue = str((s or {}).get("dialogue") or "").strip()
        if not dialogue:
            continue

        action = _pick_action_from_text(dialogue, idx=idx, total=max(1, total))
        if action not in VALID_ACTIONS:
            action = "neutral"

        # Loop only calm explanatory animations
        loop = action in {"idle", "neutral", "thinking"}

        out.append(
            {
                "scene_id": int((s or {}).get("scene") or (idx + 1)),
                "animation": {"action": action, "loop": loop},
                "dialogue": {"text": dialogue},
                "duration": _estimate_duration(dialogue),
            }
        )

    # ---------- Fallback ----------
    if not out:
        out.append(
            {
                "scene_id": 1,
                "animation": {"action": "neutral", "loop": True},
                "dialogue": {
                    "text": "Let's learn something fun together!"
                    if lang == "en"
                    else ""
                },
                "duration": 3,
            }
        )

    # ---------- Optional closer (English only) ----------
    if lang == "en":
        out.append(
            {
                "scene_id": 999,
                "animation": {"action": "bye", "loop": False},
                "dialogue": {"text": "Want to learn something else next?"},
                "duration": 3,
            }
        )

    return out


# ---------- Topic explainer (LLM-backed) ----------

class ExplainAgent:
    """LLM-backed explainer for the topic section.

    This generates a child-friendly explanation object:
      {"title": str, "summary": str, "points": [str, ...]}.

    If anything fails (model unreachable, bad JSON, etc.), the caller
    is expected to fall back to a simple, hard-coded explainer.
    """

    def __init__(self) -> None:
        self.ollama_url = os.getenv("OLLAMA_URL", "http://localhost:11434/api/generate")
        self.model = os.getenv("OLLAMA_MODEL", "deepseek-v3.1:671b-cloud")

    def _parse_ollama_json(self, response_content: Any) -> Dict[str, Any]:
        """Best-effort JSON extraction from Ollama-style responses."""
        if isinstance(response_content, dict):
            return response_content

        raw = str(response_content or "").strip()

        # Strip Markdown fences if present.
        if raw.startswith("```"):
            raw = re.sub(r"^```(?:json)?\s*", "", raw, flags=re.IGNORECASE)
            raw = re.sub(r"\s*```$", "", raw)
            raw = raw.strip()

        # Trim to outermost braces.
        start = raw.find("{")
        end = raw.rfind("}")
        if start != -1 and end != -1 and end > start:
            raw = raw[start : end + 1]

        # Normalise common smart quotes.
        raw = (
            raw.replace("“", '"')
            .replace("”", '"')
            .replace("’", "'")
            .replace("‘", "'")
        )

        return json.loads(raw or "{}")

    async def generate_explainer(
        self,
        *,
        topic: str,
        question: str,
        language: str = "en",
        selected_class: Optional[str] = None,
    ) -> Dict[str, Any]:
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

        grade_hint = (selected_class or "").strip()
        if grade_hint:
            grade_block = f"The child is in class/grade: {grade_hint}. Keep the concepts, vocabulary, examples, and sentence length suitable for this grade level."
        else:
            grade_block = "The child is in primary school (roughly classes 1–5). Explain at that level using very simple language."

        system = f"""
You are a kind teacher for kids aged 6–10.
Explain school topics in very simple {lang_name}.

{grade_block}

Return a short explanation with:
- A friendly title for the topic.
- 2–3 sentences that clearly explain it.
- 3 short bullet points with the most important ideas.
- A Wikipedia search keyword that can find a good image for this topic.

Answer ONLY in JSON.
"""

        prompt = f"""
Create a kid-friendly explanation.

Topic: {topic or '(unknown topic)'}
Child's question: {question or '(no question provided)'}

Language: {lang_name}

RESPONSE FORMAT (JSON ONLY):
{{
  "title": "string",
  "summary": "2-3 short sentences in {lang_name}",
  "points": ["bullet 1", "bullet 2", "bullet 3"],
  "wikipedia_keyword": "A simple English search term to find a relevant image on Wikipedia (e.g. 'Pen', 'Moon', 'Photosynthesis')"
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

        parsed = self._parse_ollama_json(payload.get("response", {}))

        title = str(parsed.get("title") or topic or question or "Fun Fact")
        summary = str(parsed.get("summary") or "")
        wikipedia_keyword = str(parsed.get("wikipedia_keyword") or topic or "").strip()
        points_raw = parsed.get("points") or []
        points: List[str] = []
        if isinstance(points_raw, list):
            for p in points_raw:
                p_str = str(p or "").strip()
                if p_str:
                    points.append(p_str)

        # Ensure we always return a minimal, well-formed object.
        if not summary:
            summary_by_lang = {
                "hi": "यह एक दिलचस्प चीज़ है जिसे हम साथ में आसान तरीके से सीख सकते हैं।",
                "bn": "এটা একটা মজার বিষয়, আমরা সহজভাবে একসাথে শিখতে পারি।",
                "ta": "இது ஒரு சுவாரசியமான விஷயம்; நாம் இதை எளிமையாக சேர்ந்து கற்றுக்கொள்ளலாம்।",
                "te": "ఇది ఆసక్తికరమైన విషయం; మనం దీన్ని సులభంగా కలిసి నేర్చుకోవచ్చు।",
                "en": "This is something interesting we can learn about together!",
            }
            summary = summary_by_lang.get(lang, summary_by_lang["en"])

        if not points:
            points_by_lang = {
                "hi": [
                    "इसमें कुछ मुख्य बातें होती हैं।",
                    "हम इसे आसान उदाहरणों से समझ सकते हैं।",
                    "इसे सीखना बहुत उपयोगी है!",
                ],
                "bn": [
                    "এতে কিছু মূল কথা আছে।",
                    "সহজ উদাহরণ দিয়ে আমরা বুঝতে পারি।",
                    "এটা শেখা খুব কাজে লাগে!",
                ],
                "ta": [
                    "இதில் சில முக்கிய கருத்துகள் உள்ளன.",
                    "எளிய உதாரணங்களால் நமக்கு புரியும்.",
                    "இதை கற்றுக்கொள்வது பயனுள்ளது!",
                ],
                "te": [
                    "దీనిలో కొన్ని ముఖ్యమైన ఆలోచనలు ఉంటాయి.",
                    "సులభమైన ఉదాహరణలతో అర్థం చేసుకోవచ్చు.",
                    "ఇది నేర్చుకోవడం చాలా ఉపయోగం!",
                ],
                "en": [
                    "It has some important ideas.",
                    "We can understand it with simple examples.",
                    "Learning this will make you smarter!",
                ],
            }
            points = points_by_lang.get(lang, points_by_lang["en"])
        if not wikipedia_keyword:
            wikipedia_keyword = topic or "learning"

        return {
            "title": title,
            "summary": summary,
            "points": points,
            "wikipedia_keyword": wikipedia_keyword,
        }


_default_agent = ExplainAgent()


async def generate_explainer(
    topic: str,
    question: str,
    language: str = "en",
    selected_class: Optional[str] = None,
) -> Dict[str, Any]:
    """Public helper used by the orchestrator.

    Wrapped this way to match the existing import:
      from agents.explain_agent import generate_explainer
    """

    return await _default_agent.generate_explainer(
        topic=topic,
        question=question,
        language=language,
        selected_class=selected_class,
    )
