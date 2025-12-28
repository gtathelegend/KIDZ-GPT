from services.stt_service import transcribe_audio
from services.language_service import detect_language
from services.safety_service import is_safe
from services.cache_service import get, set
from agents.intent_agent import extract_intent
from agents.script_agent import generate_storyboard
from agents.tts_agent import generate_tts


async def process_audio(audio_file):

    # 1️⃣ Speech to text (MUST come first)
    text = await transcribe_audio(audio_file)

    # 2️⃣ Safety check on raw text
    if not is_safe(text):
        return {
            "error": "Unsafe content detected",
            "message": "Please ask a different question"
        }

    # 3️⃣ Cache check (after text exists)
    cached = get(text)
    if cached:
        return cached

    # 4️⃣ Language detection
    language = detect_language(text)

    # 5️⃣ Intent extraction
    intent = extract_intent(text, language)

    # 6️⃣ Storyboard generation
    storyboard = generate_storyboard(intent, language)

    # 7️⃣ Safety check on generated dialogue
    for scene in storyboard["scenes"]:
        if not is_safe(scene["dialogue"]):
            return {
                "error": "Generated content unsafe"
            }

    # 8️⃣ TTS per scene
    for scene in storyboard["scenes"]:
        scene["audio"] = generate_tts(scene["dialogue"])
        scene["duration"] = 4
        scene["character"] = "kid_avatar"

    result = {
        "language": language,
        "original_text": text,
        "intent": intent,
        "scenes": storyboard["scenes"]
    }

    # 9️⃣ Cache result
    set(text, result)

    return result
