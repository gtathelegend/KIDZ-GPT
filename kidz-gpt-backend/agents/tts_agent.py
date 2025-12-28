import uuid
import pyttsx3

def generate_tts(text):
    filename = f"audio_{uuid.uuid4()}.wav"
    engine = pyttsx3.init()
    engine.save_to_file(text, filename)
    engine.runAndWait()
    return filename
