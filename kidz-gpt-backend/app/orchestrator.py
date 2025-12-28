from agents.tts_agent import generate_tts
from services.stt_service import transcribe_audio
from services.language_service import detect_language
from agents.intent_agent import IntentAgent
from agents.script_agent import ScriptAgent
from services.safety_service import is_safe
async def process_audio(audio_file):
    if not is_safe(text):
        return {
            "error": "Unsafe content detected",
            "message": "Please ask a different question"
        }
    # 1. Speech to text
    text = await transcribe_audio(audio_file)

    # 2. Language detection
    language = detect_language(text)

    # 3. Intent extraction (ADK agent)
    intent_agent = IntentAgent()
    intent = intent_agent.run(text, language)

    # 4. Script generation (ADK agent)
    script_agent = ScriptAgent()
    storyboard = script_agent.run(intent, language)

    for scene in storyboard.scenes:
        scene.audio = generate_tts(scene.dialogue)

    return {
        "language": language,
        "intent": intent,
        "storyboard": storyboard
    }
