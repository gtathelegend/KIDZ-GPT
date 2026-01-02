import asyncio
import os

from services.stt_service import transcribe_audio
from services.language_service import detect_language
from services.safety_service import is_safe
from services.cache_service import get, set
from services.animation_script_service import build_animation_scenes
from agents.intent_agent import extract_intent
from agents.animation_agent import generate_animation_scenes
from agents.script_agent import generate_storyboard_with_question
# Non-dialogue explanation + key points for the topic section
from agents.explain_agent import generate_explainer
# TTS is handled by frontend browser TTS - no need to import generate_tts


async def process_audio(audio_file, language: str = "en"):

    stt_timeout_s = float(os.getenv("STT_TIMEOUT_SECONDS", "180"))
    tts_timeout_s = float(os.getenv("TTS_TIMEOUT_SECONDS", "60"))

    # 1️⃣ Speech to text (MUST come first)
    try:
        transcription_result = await asyncio.wait_for(transcribe_audio(audio_file, language), timeout=stt_timeout_s)
        
        # Handle tuple return (text, detected_language) or just text for backward compatibility
        if isinstance(transcription_result, tuple):
            text, whisper_detected_lang = transcription_result
        else:
            text = transcription_result
            whisper_detected_lang = None
        
        # Validate transcription result
        if not text or text.strip() == "":
            raise ValueError("Transcription returned empty text. Please try speaking again.")
        if text.lower() in ["error in transcription.", "error"]:
            raise ValueError("Transcription service returned an error. Please try again.")
            
    except TimeoutError as e:
        raise TimeoutError(f"STT timed out after {stt_timeout_s:.0f}s") from e
    except Exception as e:
        # Re-raise with more context
        error_msg = str(e)
        if "transcription" in error_msg.lower() or "stt" in error_msg.lower():
            raise Exception(f"Speech-to-text failed: {error_msg}")
        raise

    # 2️⃣ Safety check on raw text
    if not is_safe(text):
        return {
            "error": "Unsafe content detected",
            "message": "Please ask a different question"
        }

    # 3️⃣ Cache check (after text exists)
    cached = get(text)
    # Avoid returning old cached payloads that don't include the new fields.
    if cached and isinstance(cached, dict) and cached.get("explainer") and cached.get("animation_scenes"):
        return cached

    # 4️⃣ Language detection and validation
    # Priority: Whisper detected language > User specified language > Auto-detect
    original_language = language
    
    # Use Whisper's detected language if available (most accurate)
    if whisper_detected_lang:
        # Normalize language code (e.g., "hi" from Whisper)
        language = whisper_detected_lang
        print(f"🌐 Using Whisper detected language: {language} (was: {original_language})")
    elif language in ["en", "auto", "unknown", ""]:
        # If no Whisper detection and language is default/auto, try to detect from text
        detected = detect_language(text)
        if detected and detected != "unknown" and detected != "en":
            language = detected
            print(f"🔍 Language detected from text: {detected} (was: {original_language})")
        else:
            # Keep as English if detection fails
            language = "en"
            print(f"🌐 Using default language: English")
    else:
        # User specified a language explicitly - use it
        # Extract base language code if it's a full tag (e.g., "hi-IN" -> "hi")
        if "-" in language:
            language = language.split("-")[0]
        print(f"🌐 Using user specified language: {language}")
    
    # Ensure language is normalized to ISO 639-1 code (e.g., "hi", "en", "bn")
    # This ensures consistency across the pipeline
    language = language.lower().split("-")[0] if language else "en"

    # 5️⃣ Intent extraction
    intent = await extract_intent(text, language)

    # 6️⃣ Storyboard generation
    storyboard = await generate_storyboard_with_question(intent, question=text, language=language)

    # NOTE: We no longer do a separate translation step.
    # The storyboard + explainer should be generated directly in the user's spoken language
    # (as detected by Whisper) to avoid translation-model drift.

    # 6.8️⃣ Generate a clean explainer (not dialogue) for the topic card
    explainer = None
    try:
        topic = (intent or {}).get("topic") or ""
        explainer = await generate_explainer(topic=topic, question=text, language=language)
    except Exception as e:
        print(f"⚠️ Explainer generation failed: {e}")
        topic_title = (intent or {}).get("topic") or "Explanation"
        lang_code = (language or "en").lower().split("-")[0]
        
        # Language-specific fallback
        fallback_by_lang = {
            "hi": {
                "title": topic_title,
                "summary": "यहाँ मुख्य विचार सरल तरीके से हैं।",
                "points": [
                    "इसका एक सरल अर्थ है।",
                    "इसके महत्वपूर्ण भाग या चरण हैं।",
                    "यह हमें समझने में मदद करता है।",
                ],
            },
            "bn": {
                "title": topic_title,
                "summary": "এখানে মূল ধারণাগুলি সহজ উপায়ে রয়েছে।",
                "points": [
                    "এর একটি সহজ অর্থ আছে।",
                    "এর গুরুত্বপূর্ণ অংশ বা ধাপ আছে।",
                    "এটা আমাদের বুঝতে সাহায্য করে।",
                ],
            },
            "ta": {
                "title": topic_title,
                "summary": "இங்கே முக்கிய எண்ணங்கள் எளிய வழியில் உள்ளன.",
                "points": [
                    "இதற்கு ஒரு எளிய பொருள் உள்ளது.",
                    "இதில் முக்கியமான பகுதிகள் அல்லது படிகள் உள்ளன.",
                    "இது நமக்கு புரிந்து கொள்ள உதவுகிறது.",
                ],
            },
            "te": {
                "title": topic_title,
                "summary": "ఇక్కడ ప్రధాన ఆలోచనలు సరళమైన విధంగా ఉన్నాయి.",
                "points": [
                    "దీనికి ఒక సరళమైన అర్థం ఉంది.",
                    "దీనికి ముఖ్యమైన భాగాలు లేదా దశలు ఉన్నాయి.",
                    "ఇది మనకు అర్థం చేసుకోవడానికి సహాయపడుతుంది.",
                ],
            },
            "en": {
                "title": topic_title,
                "summary": "Here are the main ideas in a simple way.",
                "points": [
                    "It has a simple meaning.",
                    "It has important parts or steps.",
                    "It helps us understand how something works.",
                ],
            },
        }
        
        explainer = fallback_by_lang.get(lang_code, fallback_by_lang["en"])

    # 7️⃣ Safety check on generated dialogue and validate dialogue exists
    for scene in storyboard["scenes"]:
        # Validate dialogue exists and is not empty
        dialogue = scene.get("dialogue", "").strip()
        if not dialogue:
            print(f"⚠️ Warning: Empty dialogue in scene {scene.get('scene', 'unknown')}, skipping")
            scene["dialogue"] = "I'm sorry, I couldn't generate a response for this scene."
        elif not is_safe(dialogue):
            return {
                "error": "Generated content unsafe"
            }
        else:
            # Ensure dialogue is set
            scene["dialogue"] = dialogue

    # 8️⃣ TTS is handled by frontend browser TTS - skip backend TTS generation
    # Frontend uses Web Speech API for better voice quality and language matching
    for scene in storyboard["scenes"]:
        # Don't generate audio - frontend handles TTS
        scene["audio"] = ""  # Empty string indicates frontend should handle TTS
        scene["duration"] = 4
        scene["character"] = "kid_avatar"

    # 8.5️⃣ Build 3D animation script based on the response + explainer
    animation_scenes = []
    try:
        topic = (intent or {}).get("topic") or ""
        # Prefer LLM-directed animation plan using the predefined actions.
        animation_scenes = await generate_animation_scenes(
            topic=topic,
            question=text,
            storyboard_scenes=storyboard.get("scenes", []),
            language=language,
        )

        # Fallback to deterministic heuristic mapping.
        if not animation_scenes:
            animation_scenes = build_animation_scenes(
                storyboard_scenes=storyboard.get("scenes", []),
                explainer=explainer,
                language=language,
            )
    except Exception as e:
        print(f"⚠️ Animation script generation failed: {e}")
        animation_scenes = []

    result = {
        "language": language,
        "original_text": text,
        "intent": intent,
        "explainer": explainer,
        "scenes": storyboard["scenes"],
        "animation_scenes": animation_scenes,
    }

    # 9️⃣ Cache result
    set(text, result)

    return result
