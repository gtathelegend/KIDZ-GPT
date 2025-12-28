import whisper
import asyncio
import tempfile
import os
import shutil
import torch

_model = None


def _get_whisper_device() -> str:
    # openai-whisper expects torch device strings like "cpu" or "cuda".
    return "cuda" if torch.cuda.is_available() else "cpu"


def _get_whisper_model():
    global _model
    if _model is None:
        model_name = os.getenv("WHISPER_MODEL", "small")
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
                return
    except Exception:
        pass

    raise RuntimeError(
        "ffmpeg executable not found. openai-whisper requires ffmpeg to decode audio. "
        "Fix options: (1) install FFmpeg and ensure `ffmpeg` is on PATH, "
        "or (2) add the Python package `imageio-ffmpeg` (bundled ffmpeg)."
    )

async def transcribe_audio(audio_file):
    _ensure_ffmpeg_available()
    audio_bytes = await audio_file.read()

    filename = getattr(audio_file, "filename", None) or "audio.mp3"
    _, ext = os.path.splitext(filename)
    suffix = ext if ext else ".mp3"

    path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(audio_bytes)
            path = tmp.name

        device = _get_whisper_device()
        model = _get_whisper_model()
        result = await asyncio.to_thread(model.transcribe, path, fp16=(device == "cuda"))
        return result["text"]
    finally:
        if path and os.path.exists(path):
            try:
                os.remove(path)
            except Exception:
                pass
