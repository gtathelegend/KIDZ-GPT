from __future__ import annotations

from typing import Any, Dict, List, Optional
import hashlib
import os
import re

# Action names MUST match what exists in the .glb.
# Based on the user's attached list.
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


def _pick_action_from_text(text: str, *, idx: int, total: int) -> str:
    t = (text or "").strip().lower()

    # Strong positional defaults
    if idx == 0:
        return "hello"
    if idx == total - 1:
        # If the final line sounds like a wrap-up, end with bye.
        if any(k in t for k in ["bye", "goodbye", "see you", "that's all", "thats all", "we learned", "today we learned"]):
            return "bye"

    # Keyword-driven picks
    if any(k in t for k in ["great job", "awesome", "yay", "well done", "good job", "you did it", "high five"]):
        return "claping"

    if "?" in (text or "") or re.match(r"^(do|did|can|could|would|have|has|why|what|how|when|where)\b", t):
        return "question"

    if any(k in t for k in ["hmm", "think", "imagine", "let's think", "lets think", "picture this"]):
        return "thinking"

    if any(k in t for k in ["wow", "surprise", "amazing", "whoa", "oh no", "oops"]):
        return "suprised"

    if any(k in t for k in ["walk", "let's go", "lets go", "come along"]):
        return "walking"

    if any(k in t for k in ["jump", "hop"]):
        return "jump"

    # Gentle alternation to avoid looking frozen
    return "neutral" if idx % 2 == 0 else "idle"


def build_animation_scenes(
    *,
    storyboard_scenes: List[Dict[str, Any]],
    explainer: Optional[Dict[str, Any]] = None,
    language: str = "en",
) -> List[Dict[str, Any]]:
    """Create a 3D-friendly scene list for the frontend renderer.

    This intentionally does NOT replace the existing storyboard scenes used for chat/TTS.
    """

    lang = (language or "en").lower().split("-")[0]

    # character_pref = (os.getenv("KIDZ_CHARACTER") or "boy").strip().lower()
    # if character_pref == "random":
    #     seed_text = "".join(
    #         [str((s or {}).get("dialogue") or "") for s in (storyboard_scenes or [])[:3]]
    #     )
    #     seed = f"{seed_text}|{lang}".encode("utf-8")
    #     character = "girl" if (hashlib.sha256(seed).digest()[0] % 2 == 0) else "boy"
    # elif character_pref in {"boy", "girl"}:
    #     character = character_pref
    # else:
    #     character = "boy"
    character = "girl"

    out: List[Dict[str, Any]] = []

    # Optional, English-only interaction scenes (safe for now; avoids mixing languages).
    if lang == "en":
        title = (explainer or {}).get("title") or ""
        opener = "Hi! I'm your learning buddy. Let's learn together!"
        if title:
            opener = f"Hi! I'm your learning buddy. Today we'll learn about {title}."
        out.append(
            {
                "scene_id": 0,
                "character": character,
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

        # Loop if it's an explanatory line; don't loop for greetings/celebrations.
        loop = action in {"idle", "neutral", "thinking", "walking"}

        out.append(
            {
                "scene_id": int((s or {}).get("scene") or (idx + 1)),
                "character": character,
                "animation": {"action": action, "loop": loop},
                "dialogue": {"text": dialogue},
                "duration": 4,
            }
        )

    if not out:
        # Minimal fallback
        out = [
            {
                "scene_id": 1,
                "character": character,
                "animation": {"action": "neutral", "loop": True},
                "dialogue": {"text": "Let's learn something fun together!" if lang == "en" else ""},
                "duration": 4,
            }
        ]

    # English-only closer to make it feel interactive.
    if lang == "en":
        out.append(
            {
                "scene_id": 999,
                "character": character,
                "animation": {"action": "bye", "loop": False},
                "dialogue": {"text": "Want to ask me another question?"},
                "duration": 3,
            }
        )

    return out




