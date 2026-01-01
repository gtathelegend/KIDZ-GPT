import uuid
import os
import base64
import pyttsx3

def generate_tts(text, language):
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

    # Generate audio file
    engine.save_to_file(text, filename)
    engine.runAndWait()
    
    # Read the generated audio file and convert to base64
    try:
        with open(filename, 'rb') as audio_file:
            audio_bytes = audio_file.read()
            audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
        
        # Clean up the temporary file
        if os.path.exists(filename):
            os.remove(filename)
        
        return audio_base64
    except Exception as e:
        # Clean up on error
        if os.path.exists(filename):
            try:
                os.remove(filename)
            except:
                pass
        raise Exception(f"Failed to read TTS audio file: {str(e)}")
