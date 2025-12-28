import whisper
import tempfile

model = whisper.load_model("small")

async def transcribe_audio(audio_file):
    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
        content = await audio_file.read()
        tmp.write(content)
        tmp_path = tmp.name

    result = model.transcribe(tmp_path)
    return result["text"]
