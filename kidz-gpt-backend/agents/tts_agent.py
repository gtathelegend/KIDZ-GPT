import uuid
import pyttsx3

def generate_tts(text, language="en"):
    filename = f"audio_{uuid.uuid4()}.wav"
    engine = pyttsx3.init()

    # Find a voice for the given language
    voices = engine.getProperty('voices')
    selected_voice = None
    for voice in voices:
        if hasattr(voice, 'lang') and voice.lang == language:
            selected_voice = voice.id
            break
    
    # If no exact match, try to find a partial match
    if not selected_voice:
        for voice in voices:
            if hasattr(voice, 'lang') and voice.lang and voice.lang.startswith(language):
                selected_voice = voice.id
                break

    if selected_voice:
        engine.setProperty('voice', selected_voice)

    engine.save_to_file(text, filename)
    engine.runAndWait()
    return filename
