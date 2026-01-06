import whisper
import asyncio
import tempfile
import os
import shutil
import torch
from fastapi import FastAPI, UploadFile, File, Form
import uvicorn

app = FastAPI()

_model = None

def _get_whisper_device() -> str:
    # openai-whisper expects torch device strings like "cpu" or "cuda".
    return "cuda" if torch.cuda.is_available() else "cpu"

def _get_whisper_model():
    global _model
    if _model is None:
        # Use 'base' model for better multilingual support
        # 'tiny' = weak on non-English, 'small' = good, 'base' = better, 'medium/large' = best but slower
        model_name = os.getenv("WHISPER_MODEL", "small")
        print(f"Loading whisper model: {model_name}")
        _model = whisper.load_model(model_name, device=_get_whisper_device())
    return _model

def _ensure_ffmpeg_available() -> None:
    # openai-whisper shells out to the `ffmpeg` executable.
    if shutil.which("ffmpeg") is not None:
        return

    # Fallback: use a bundled ffmpeg binary if available.
    try:
        import imageio_ffmpeg  # type: ignore

        ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
        ffmpeg_dir = os.path.dirname(ffmpeg_exe)
        if ffmpeg_dir and os.path.exists(ffmpeg_exe):
            os.environ["PATH"] = ffmpeg_dir + os.pathsep + os.environ.get("PATH", "")
            if shutil.which("ffmpeg") is not None:
                print("ffmpeg found via imageio_ffmpeg.")
                return
    except Exception:
        pass

    raise RuntimeError(
        "ffmpeg executable not found. openai-whisper requires ffmpeg to decode audio. "
        "Fix options: (1) install FFmpeg and ensure `ffmpeg` is on PATH, "
        "or (2) add the Python package `imageio-ffmpeg` (bundled ffmpeg)."
    )

@app.on_event("startup")
async def startup_event():
    """Load model on startup."""
    _ensure_ffmpeg_available()
    _get_whisper_model()

@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...), language: str = Form("auto")):
    audio_bytes = await file.read()

    filename = getattr(file, "filename", None) or "audio.mp3"
    _, ext = os.path.splitext(filename)
    suffix = ext if ext else ".mp3"

    path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(audio_bytes)
            path = tmp.name

        device = _get_whisper_device()
        model = _get_whisper_model()
        
        # Normalize language input
        normalized_language = (language or "").strip().lower()
        # Normalize region tags to primary ISO-639 (hi-IN -> hi) for Whisper compatibility
        if "-" in normalized_language:
            normalized_language = normalized_language.split("-")[0] or normalized_language

        # Map common language codes to Whisper's language codes
        # Whisper supports: en, hi, bn, ta, te, etc.
        language_map = {
            "hi": "hi",      # Hindi
            "hindi": "hi",
            "bn": "bn",      # Bengali
            "bengali": "bn",
            "ta": "ta",      # Tamil
            "tamil": "ta",
            "te": "te",      # Telugu
            "telugu": "te",
            "en": "en",      # English
            "english": "en",
        }
        
        # Decide transcription language
        # If language is "auto", "detect", or empty, let Whisper auto-detect
        if normalized_language in ["auto", "detect", "unknown", ""]:
            transcribe_language = None  # Auto-detect
            print(f"🔍 Auto-detecting language from audio...")
        else:
            # Use mapped language code or fallback to normalized input
            transcribe_language = language_map.get(normalized_language, normalized_language)
            print(f"🎤 Transcribing with explicit language: {transcribe_language}")
        
        # Transcribe with language hint
        result = await asyncio.to_thread(
            model.transcribe, 
            path, 
            fp16=(device == "cuda"), 
            language=transcribe_language,
            verbose=False  # Suppress verbose output
        )
        
        # Extract detected language from result
        detected_lang = result.get("language", language or "en")
        transcribed_text = result.get("text", "").strip()
        
        # Log detection results
        if detected_lang:
            print(f"✅ Whisper detected: {detected_lang} | Transcribed: {transcribed_text[:60]}...")
        else:
            print(f"⚠️ Could not detect language, using: {language}")
            detected_lang = normalized_language or "en"
        
        return {
            "text": transcribed_text,
            "language": detected_lang
        }
    finally:
        if path and os.path.exists(path):
            try:
                os.remove(path)
            except Exception:
                pass

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)