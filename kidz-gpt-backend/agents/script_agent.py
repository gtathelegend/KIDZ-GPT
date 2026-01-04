from typing import Any, Dict
import httpx
import json
import re
import os

from models.schemas import StoryboardSchema


class ScriptAgent:
    def __init__(self):
        self.ollama_url = os.getenv("OLLAMA_URL", "http://localhost:11434/api/generate")
        # Allow a dedicated storyboard model; fallback to the general model.
        self.model = os.getenv("OLLAMA_MODEL_SCRIPT", os.getenv("OLLAMA_MODEL", "gpt-oss:120b-cloud"))

    async def _generate_storyboard_from_ollama(self, intent: Dict[str, Any], language: str, question: str = "") -> Dict[str, Any]:
        topic = (intent or {}).get("topic") or "a random topic"
        question = (question or "").strip()

        lang_code = (language or "en").strip().lower().split("-")[0]
        lang_name = {
            "en": "English",
            "hi": "Hindi (हिंदी)",
            "bn": "Bengali (বাংলা)",
            "ta": "Tamil (தமிழ்)",
            "te": "Telugu (తెలుగు)",
        }.get(lang_code, language or "English")

        system_prompt = """
You are an educational explanation generator for young children.

Your role is to explain a single topic clearly and visually, as if you are teaching
a curious child using simple scenes and simple language.

You must:
- Focus on explaining the topic directly
- Use cause-and-effect reasoning suitable for children
- Think visually (what the child can see or imagine)
- Keep everything simple, concrete, and reassuring

You must NOT:
- Tell stories unrelated to the explanation
- Add extra facts beyond the topic
- Use abstract concepts or technical words
- Add jokes, morals, or dramatic storytelling

Your output will be used to animate characters in real time.
Any unnecessary or unclear explanation will confuse the child.
"""


        user_prompt = f"""
Create a short storyboard that explains the topic clearly to a child.

Topic:
"{topic}"

Child's Question:
"{question}"

Language:
{lang_name}

STRICT RULES:
- The storyboard MUST directly answer the child's question.
- Stay strictly focused on the topic. Do NOT add extra information.
- Explain using simple cause-and-effect ideas a child can understand.
- Imagine what the child would see (sky, sun, objects, actions).
- Use only simple, everyday words.
- Each scene should explain ONE small idea.
- Do NOT ask new questions in the dialogue.
- Do NOT use metaphors or comparisons.
- Do NOT include personal details or assumptions.

STRUCTURE RULES:
- Number of scenes: 2 to 4 only.
- Each scene must have:
  - "scene": a number starting from 1
  - "background": a very simple visual setting (2–5 words)
  - "dialogue": one short sentence (maximum 18 words)
- Dialogue must be calm, friendly, and clear.
- If the language is not English, do NOT use English words.

OUTPUT RULES:
- Return ONLY valid JSON.
- No explanations, no markdown, no extra text.

JSON FORMAT:
{{
    "scenes": [
        {{
            "scene": 1,
            "background": "...",
            "dialogue": "..."
        }}
    ]
}}
"""


        data = { 
            "model": self.model,
            "system": system_prompt,
            "prompt": user_prompt,
            "stream": False,
            "format": "json"
        }

        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                response = await client.post(self.ollama_url, json=data)
                response.raise_for_status()
                response_json = response.json()
                response_content = response_json.get("response", "{}")

                storyboard_data = self._parse_ollama_json(response_content)
                storyboard_data = self._normalize_storyboard(storyboard_data, language, topic)

                # Validate against schema; if invalid, fallback.
                try:
                    _ = StoryboardSchema(**storyboard_data)
                except Exception as e:
                    raise ValueError("Invalid storyboard schema from LLM") from e
                
                # Log generated dialogue for language verification
                if storyboard_data.get("scenes"):
                    first_dialogue = storyboard_data["scenes"][0].get("dialogue", "")[:60]
                    print(f"✅ Generated storyboard in {language}: {first_dialogue}...")
                
                return storyboard_data

            except (httpx.RequestError, json.JSONDecodeError, ValueError) as e:
                print(f"An error occurred while generating storyboard: {e}")
                # Fallback to heuristic
                return self._heuristic_storyboard(intent, language)

    def _parse_ollama_json(self, response_content: Any) -> Dict[str, Any]:
        if isinstance(response_content, dict):
            return response_content

        text = str(response_content or "").strip()

        # Strip markdown fences if present.
        if text.startswith("```"):
            text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.IGNORECASE)
            text = re.sub(r"\s*```$", "", text)
            text = text.strip()

        # Extract the first JSON object if extra text sneaks in.
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1 and end > start:
            text = text[start : end + 1]

        # Normalize curly quotes that sometimes appear.
        text = (
            text.replace("“", '"')
            .replace("”", '"')
            .replace("’", "'")
            .replace("‘", "'")
        )

        return json.loads(text)

    def _normalize_dialogue(self, dialogue_value: Any, *, lang_code: str = "en") -> str:
        if isinstance(dialogue_value, list):
            text = " ".join(str(x) for x in dialogue_value if x is not None)
        elif isinstance(dialogue_value, dict):
            text = str(dialogue_value)
        else:
            text = str(dialogue_value or "")

        text = text.strip()

        # If the model accidentally returns something like: "A", "B", "C"
        if text.startswith('"') and '",' in text and "[" not in text and "]" not in text:
            parts = [p.strip().strip('"') for p in text.split('",')]
            text = " ".join(p for p in parts if p)

        # If dialogue is a JSON array encoded as a string, decode it.
        if text.startswith("[") and text.endswith("]"):
            try:
                arr = json.loads(text)
                if isinstance(arr, list):
                    text = " ".join(str(x) for x in arr)
            except Exception:
                pass

        # Collapse whitespace.
        text = re.sub(r"\s+", " ", text).strip()

        # Keep it to ~2 sentences max.
        sentences = re.split(r"(?<=[.!?])\s+", text)
        text = " ".join(s.strip() for s in sentences[:2] if s.strip()).strip()

        # Ensure we don't return empty string - provide language-specific fallback
        if not text or len(text) < 2:
            fallback_dialogue = {
                "hi": "चलो इसे आसान तरीके से समझते हैं।",
                "bn": "চলো এটা সহজভাবে বুঝি।",
                "ta": "இதைக் எளிமையாகப் புரிந்துகொள்வோம்।",
                "te": "దాన్ని సులభంగా అర్థం చేసుకుందాం।",
                "en": "Let me explain that in a simple way.",
            }
            base = (lang_code or "en").lower().split("-")[0]
            return fallback_dialogue.get(base, fallback_dialogue["en"])
        
        return text

    def _normalize_storyboard(self, storyboard_data: Dict[str, Any], language: str, topic: str) -> Dict[str, Any]:
        scenes = (storyboard_data or {}).get("scenes")
        if not isinstance(scenes, list) or len(scenes) == 0:
            return self._heuristic_storyboard({"topic": topic}, language)

        lang_code = (language or "en").lower().split("-")[0]

        normalized_scenes = []
        for idx, scene in enumerate(scenes[:5]):
            if not isinstance(scene, dict):
                continue

            dialogue = self._normalize_dialogue(scene.get("dialogue", ""), lang_code=lang_code)
            
            # Handle empty or invalid dialogue with language-specific fallback
            if not dialogue or len(dialogue.strip()) < 3:
                # Provide language-specific fallback dialogue
                fallback_dialogue = {
                    "hi": "चलो इसे समझते हैं।",
                    "bn": "চলো এটা বোঝা যাক।",
                    "ta": "அதை புரிந்து கொள்வோம்।",
                    "te": "దాన్ని అర్థం చేసుకుందాం।",
                }.get(lang_code, "Let me explain that.")
                dialogue = fallback_dialogue
                print(f"⚠️ Scene {idx + 1} had empty dialogue, using fallback: {dialogue}")
            
            background = scene.get("background", "scene")
            if not isinstance(background, str) or not background.strip():
                background = "scene"

            normalized_scenes.append(
                {
                    "scene": len(normalized_scenes) + 1,  # Use actual count, not idx
                    "background": background.strip(),
                    "dialogue": dialogue,
                }
            )

        # If we couldn't normalize enough scenes, fallback.
        if len(normalized_scenes) < 2:
            return self._heuristic_storyboard({"topic": topic}, language)

        # Ensure the last scene ends with a wrap-up statement (not a question).
        wrap_up_by_lang = {
            "hi": f"आज हमने {topic} के बारे में सीखा — बस इतना ही!",
            "bn": f"আজ আমরা {topic} সম্পর্কে শিখলাম — এইটাই!",
            "ta": f"இன்று நாம் {topic} பற்றி கற்றுக்கொண்டோம் — அவ்வளவுதான்!",
            "te": f"ఈరోజు మనం {topic} గురించి నేర్చుకున్నాం — అంతే!",
            "en": f"Today we learned about {topic}.",
        }

        last = normalized_scenes[-1]
        last_dialogue = str(last.get("dialogue", "")).strip()

        # If it ends with a question mark, replace with wrap-up.
        if last_dialogue.endswith("?"):
            last_dialogue = wrap_up_by_lang.get(lang_code, wrap_up_by_lang["en"])

        # Ensure it has ending punctuation.
        if not re.search(r"[.!?।！？]$", last_dialogue):
            last_dialogue = f"{last_dialogue}." if last_dialogue else wrap_up_by_lang.get(lang_code, wrap_up_by_lang["en"])

        last["dialogue"] = last_dialogue
        normalized_scenes[-1] = last

        return {"scenes": normalized_scenes}

    def _heuristic_storyboard(self, intent: Dict[str, Any], language: str) -> Dict[str, Any]:
        topic = (intent or {}).get("topic") or "that topic"
        lang_code = (language or "").lower().split("-")[0] if language else "en"

        if lang_code == "hi":
            return {"scenes": [{"scene": 1, "background": "day_sky", "dialogue": f"{topic} एक मज़ेदार चीज़ है! यह हमें दुनिया को समझने में मदद करता है।"}, {"scene": 2, "background": "wrap_up", "dialogue": f"आज याद रखो: {topic} का मतलब है मुख्य idea + कुछ आसान पॉइंट्स। बस इतना ही!"}]}
        if lang_code == "bn":
            return {"scenes": [{"scene": 1, "background": "day_sky", "dialogue": f"{topic} দারুণ একটা বিষয়! এটা আমাদের চারপাশের জিনিসগুলো বুঝতে সাহায্য করে।"}, {"scene": 2, "background": "wrap_up", "dialogue": f"মনে রেখো: {topic} মানে মূল ধারণা + কয়েকটা সহজ পয়েন্ট। এইটাই!"}]}
        if lang_code == "ta":
            return {"scenes": [{"scene": 1, "background": "day_sky", "dialogue": f"{topic} ரொம்ப சுவாரசியம்! இது நம்மை சுற்றியுள்ள உலகத்தை புரிய வைக்கிறது."}, {"scene": 2, "background": "wrap_up", "dialogue": f"நினைவில் வை: {topic} என்பது ஒரு எளிய அர்த்தம் + சில முக்கியமான புள்ளிகள். அவ்வளவுதான்!"}]}
        if lang_code == "te":
            return {"scenes": [{"scene": 1, "background": "day_sky", "dialogue": f"{topic} చాలా ఆసక్తికరం! ఇది మన చుట్టూ ఉన్న ప్రపంచాన్ని అర్థం చేసుకోవడానికి సహాయం చేస్తుంది."}, {"scene": 2, "background": "wrap_up", "dialogue": f"గుర్తుంచుకో: {topic} అంటే ఒక సరళమైన అర్థం + కొన్ని ముఖ్యమైన పాయింట్లు. అంతే!"}]}
            
        return {"scenes": [{"scene": 1, "background": "day_sky", "dialogue": f"{topic} is really cool! It helps us understand how the world works."}, {"scene": 2, "background": "wrap_up", "dialogue": f"Remember: {topic} means a simple main idea plus a few important points. That’s the key!"}]}

    async def generate_storyboard(self, intent: Dict[str, Any], language: str = "en", question: str = "") -> Dict[str, Any]:
        if not intent:
            return self._heuristic_storyboard({"topic": ""}, language)

        result = await self._generate_storyboard_from_ollama(intent, language, question)
        # Always return schema-compatible output to the frontend.
        try:
            schema_obj = StoryboardSchema(**result)
            if hasattr(schema_obj, "model_dump"):
                return schema_obj.model_dump()
            return schema_obj.dict()
        except Exception:
            return self._heuristic_storyboard(intent, language)


_default_agent = ScriptAgent()


async def generate_storyboard(intent: Dict[str, Any], language: str = "en") -> Dict[str, Any]:
    return await _default_agent.generate_storyboard(intent, language)

# Backward-compatible helper that allows passing the raw question text.
async def generate_storyboard_with_question(intent: Dict[str, Any], question: str, language: str = "en") -> Dict[str, Any]:
    return await _default_agent.generate_storyboard(intent, language, question)