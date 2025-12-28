import pyttsx3
import uuid

engine = pyttsx3.init()

def generate_tts(text):
    filename = f"audio_{uuid.uuid4()}.wav"
    engine.save_to_file(text, filename)
    engine.runAndWait()
    return filename
