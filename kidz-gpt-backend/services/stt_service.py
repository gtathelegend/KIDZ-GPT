import whisper
import tempfile
import os

# ✅ LOAD ONCE AT IMPORT TIME
model = whisper.load_model("base", device="cpu")

async def transcribe_audio(audio_file):
    audio_bytes = await audio_file.read()

    with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as tmp:
        tmp.write(audio_bytes)
        path = tmp.name

    result = model.transcribe(path, fp16=False)

    os.remove(path)
    return result["text"]
