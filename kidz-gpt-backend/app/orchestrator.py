import asyncio
import os

from services.stt_service import transcribe_audio
from services.language_service import detect_language
from services.safety_service import is_safe
from services.cache_service import get, set, key as cache_key
from services.animation_script_service import build_animation_scenes
from services.wikipedia_service import fetch_wikipedia_image
from agents.intent_agent import extract_intent
from agents.animation_agent import generate_animation_scenes
from agents.script_agent import generate_storyboard_with_question
# Non-dialogue explanation + key points for the topic section
from agents.explain_agent import generate_explainer
# TTS is handled by frontend browser TTS - no need to import generate_tts


def _fallback_explainer_for_language(*, topic_title: str, language: str) -> dict:
    lang_code = (language or "en").lower().split("-")[0]

    fallback_by_lang = {
        "hi": {
            "title": topic_title,
            "summary": "यहाँ मुख्य विचार सरल तरीके से हैं।",
            "points": [
                "इसका एक सरल अर्थ है।",
                "इसके महत्वपूर्ण भाग या चरण हैं।",
                "यह हमें समझने में मदद करता है।",
            ],
            "wikipedia_keyword": topic_title,
            "image_url": None,
        },
        "bn": {
            "title": topic_title,
            "summary": "এখানে মূল ধারণাগুলি সহজ উপায়ে রয়েছে।",
            "points": [
                "এর একটি সহজ অর্থ আছে।",
                "এর গুরুত্বপূর্ণ অংশ বা ধাপ আছে।",
                "এটা আমাদের বুঝতে সাহায্য করে।",
            ],
            "wikipedia_keyword": topic_title,
            "image_url": None,
        },
        "ta": {
            "title": topic_title,
            "summary": "இங்கே முக்கிய எண்ணங்கள் எளிய வழியில் உள்ளன.",
            "points": [
                "இதற்கு ஒரு எளிய பொருள் உள்ளது.",
                "இதில் முக்கியமான பகுதிகள் அல்லது படிகள் உள்ளன.",
                "இது நமக்கு புரிந்து கொள்ள உதவுகிறது.",
            ],            "wikipedia_keyword": topic_title,
            "image_url": None,        },
        "te": {
            "title": topic_title,
            "summary": "ఇక్కడ ప్రధాన ఆలోచనలు సరళమైన విధంగా ఉన్నాయి.",
            "points": [
                "దీనికి ఒక సరళమైన అర్థం ఉంది.",
                "దీనికి ముఖ్యమైన భాగాలు లేదా దశలు ఉన్నాయి.",
                "ఇది మనకు అర్థం చేసుకోవడానికి సహాయపడుతుంది.",
            ],            "wikipedia_keyword": topic_title,
            "image_url": None,        },
        "en": {
            "title": topic_title,
            "summary": "Here are the main ideas in a simple way.",
            "points": [
                "It has a simple meaning.",
                "It has important parts or steps.",
                "It helps us understand how something works.",
            ],
            "wikipedia_keyword": topic_title,
            "image_url": None,
        },
    }

    return fallback_by_lang.get(lang_code, fallback_by_lang["en"])


async def _compute_explainer_and_update_cache(*, cache_id: str, topic: str, question: str, language: str):
    try:
        explainer = await generate_explainer(topic=topic, question=question, language=language)
        payload = get(question) or {}
        if isinstance(payload, dict):
            payload["explainer"] = explainer
            payload["explainer_status"] = "ready"
            payload["explainer_error"] = None
            set(question, payload)
    except Exception as e:
        print(f"⚠️ Explainer generation failed (deferred): {e}")
        topic_title = topic or "Explanation"
        fallback = _fallback_explainer_for_language(topic_title=topic_title, language=language)
        payload = get(question) or {}
        if isinstance(payload, dict):
            payload["explainer"] = fallback
            payload["explainer_status"] = "fallback"
            payload["explainer_error"] = str(e)
            set(question, payload)


async def _run_pipeline(*, text: str, language: str, whisper_detected_lang: str | None = None, character: str = "girl"):
    """Shared pipeline used by both audio and text entry.

    Expects clean text + a best-effort language hint.
    """

    # 2️⃣ Safety check on raw text
    if not is_safe(text):
        return {
            "error": "Unsafe content detected",
            "message": "Please ask a different question",
        }

    # 3️⃣ Cache check (after text exists)
    cached = get(text)
    # Return cached payload even if explainer is still pending.
    # This ensures fast responses and prevents spawning multiple explainer tasks.
    if cached and isinstance(cached, dict) and cached.get("animation_scenes") and cached.get("scenes"):
        # Backfill fields for older cache entries
        if not cached.get("job_id"):
            cached["job_id"] = cache_key(text)
        if "explainer_status" not in cached:
            cached["explainer_status"] = "ready" if cached.get("explainer") else "pending"
        if "explainer_error" not in cached:
            cached["explainer_error"] = None
        set(text, cached)
        return cached

    # 4️⃣ Language detection and validation
    # Priority: Whisper detected language > Text analysis > User specified language
    original_language = language
    
    # Define supported languages for the platform
    supported_languages = {"en", "hi", "bn", "ta", "te"}
    
    # Use Whisper's detected language if available (most accurate for audio)
    if whisper_detected_lang:
        # Normalize language code (e.g., "hi" from Whisper)
        detected = str(whisper_detected_lang).strip().lower().split("-")[0]
        if detected in supported_languages:
            language = detected
            print(f"✅ Using Whisper detected language: {language} (was: {original_language})")
        else:
            # Whisper detected unsupported language, try to detect from text
            print(f"⚠️ Whisper detected unsupported language: {detected}, trying text analysis...")
            detected = detect_language(text)
            if detected and detected in supported_languages:
                language = detected
                print(f"✅ Language detected from text analysis: {detected}")
            else:
                language = "en"
                print(f"⚠️ Could not detect supported language, defaulting to English")
    elif language in ["auto", "unknown", "", "detect"]:
        # No Whisper detection and language is auto - try to detect from text
        detected = detect_language(text)
        if detected and detected in supported_languages:
            language = detected
            print(f"✅ Language auto-detected from text content: {detected}")
        else:
            # Detection failed, default to English
            language = "en"
            print(f"⚠️ Auto-detection failed, using default language: English")
    else:
        # User specified a language explicitly - use it if supported
        # Extract base language code if it's a full tag (e.g., "hi-IN" -> "hi")
        base_lang = language.split("-")[0].lower()
        if base_lang in supported_languages:
            language = base_lang
            print(f"✅ Using user specified language: {language}")
        else:
            print(f"⚠️ Requested language '{base_lang}' not supported, attempting auto-detection...")
            detected = detect_language(text)
            if detected and detected in supported_languages:
                language = detected
                print(f"✅ Detected supported language: {detected}")
            else:
                language = "en"
                print(f"ℹ️ Defaulting to English")
    
    # Final normalization: ensure language is ISO 639-1 code (e.g., "hi", "en", "bn")
    language = language.lower().split("-")[0] if language else "en"
    if language not in supported_languages:
        print(f"⚠️ Final check: language '{language}' not supported, using English")
        language = "en"
    
    print(f"🌐 Final language for pipeline: {language}")

    # 5️⃣ Intent extraction
    intent = await extract_intent(text, language)

    # 6️⃣ Storyboard generation
    storyboard = await generate_storyboard_with_question(intent, question=text, language=language)

    # NOTE: We no longer do a separate translation step.
    # The storyboard + explainer should be generated directly in the user's spoken language
    # (as detected by Whisper) to avoid translation-model drift.

    # 6.8️⃣ Generate explainer synchronously so it's included in the initial response.
    # This ensures the explanation (title, summary, points) is always available immediately.
    explainer = None
    explainer_status = "pending"
    explainer_error = None
    try:
        topic = (intent or {}).get("topic") or ""
        explainer = await generate_explainer(topic=topic, question=text, language=language)
        explainer_status = "ready"
        
        # Fetch Wikipedia image using the keyword from the explainer
        wikipedia_keyword = explainer.get("wikipedia_keyword") or topic or ""
        if wikipedia_keyword:
            print(f"🖼️ Fetching Wikipedia image for: {wikipedia_keyword}")
            try:
                image_url = await fetch_wikipedia_image(wikipedia_keyword)
                if image_url:
                    explainer["image_url"] = image_url
                    print(f"✅ Added Wikipedia image to explainer: {image_url}")
                else:
                    explainer["image_url"] = None
                    print(f"⚠️ No Wikipedia image found for: {wikipedia_keyword}")
            except Exception as img_err:
                print(f"⚠️ Wikipedia image fetch failed: {img_err}")
                explainer["image_url"] = None
        
        print(f"✅ Explainer generated immediately for topic: {topic}")
    except Exception as e:
        print(f"⚠️ Explainer generation failed: {e}")
        topic_title = (intent or {}).get("topic") or "Explanation"
        explainer = _fallback_explainer_for_language(topic_title=topic_title, language=language)
        explainer_status = "fallback"
        explainer_error = str(e)
        explainer["image_url"] = None

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
        # Set character preference via environment variable for this request
        os.environ["KIDZ_CHARACTER"] = character

        # IMPORTANT:
        # The frontend prefers `animation_scenes` over `scenes`.
        # Our LLM-based animation agent is allowed to "rewrite" dialogue for tone,
        # which can accidentally switch non-English responses back into English.
        # To keep the displayed dialogue in the child's language (e.g., Hindi),
        # we use deterministic mapping for non-English.
        lang_code = (language or "en").strip().lower().split("-")[0]
        if lang_code != "en":
            animation_scenes = build_animation_scenes(
                storyboard_scenes=storyboard.get("scenes", []),
                explainer=explainer,
                language=language,
            )
        else:
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

    cache_id = cache_key(text)

    result = {
        "job_id": cache_id,
        "language": language,
        "original_text": text,
        "intent": intent,
        "explainer": explainer,
        "explainer_status": explainer_status,
        "explainer_error": explainer_error,
        "scenes": storyboard["scenes"],
        "animation_scenes": animation_scenes,
    }

    # 9️⃣ Cache result
    set(text, result)

    return result


async def process_audio(audio_file, language: str = "en", character: str = "girl", client_transcript: str | None = None):

    stt_timeout_s = float(os.getenv("STT_TIMEOUT_SECONDS", "180"))

    # 1️⃣ Speech to text (MUST come first)
    try:
        transcription_result = await asyncio.wait_for(transcribe_audio(audio_file, language), timeout=stt_timeout_s)

        # Handle tuple return (text, detected_language) or just text for backward compatibility
        if isinstance(transcription_result, tuple):
            text, whisper_detected_lang = transcription_result
        else:
            text = transcription_result
            whisper_detected_lang = None

        # If the browser provided a transcript (e.g., SpeechRecognition), it may be useful,
        # but some browsers can auto-translate speech recognition into English.
        # To avoid language mismatch, only trust the client transcript when it appears
        # to be in the same language as the detected/target language.
        client_transcript_clean = (client_transcript or "").strip()
        if client_transcript_clean:
            target_lang = (whisper_detected_lang or language or "").strip().lower().split("-")[0]
            # If we don't know the target (e.g. language='auto' and Whisper didn't detect),
            # accept the client transcript.
            if not target_lang or target_lang in {"auto", "detect", "unknown"}:
                text = client_transcript_clean
                print("🎤 Using client-provided transcript (no reliable language signal)")
            else:
                try:
                    client_lang = detect_language(client_transcript_clean)
                except Exception:
                    client_lang = "unknown"

                client_lang = (client_lang or "unknown").strip().lower().split("-")[0]

                # Accept if it matches, or if detection fails.
                if client_lang in {"unknown", target_lang}:
                    text = client_transcript_clean
                    print("🎤 Using client-provided transcript override")
                else:
                    print(
                        f"🎤 Ignoring client transcript override (client={client_lang}, target={target_lang}); using Whisper transcript"
                    )

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

    return await _run_pipeline(
        text=text,
        language=language,
        whisper_detected_lang=whisper_detected_lang,
        character=character,
    )


async def process_text_query(text: str, language: str = "en", character: str = "girl"):
    """Process a plain text question (no audio)."""
    return await _run_pipeline(text=text, language=language, whisper_detected_lang=None, character=character)
