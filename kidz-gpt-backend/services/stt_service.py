import asyncio
import os
import httpx


async def transcribe_audio(audio_file, language: str = "en"):
    # Read audio bytes
    audio_bytes = await audio_file.read()
    
    # Reset file pointer if possible (for potential reuse, though we don't reuse it)
    if hasattr(audio_file, 'seek'):
        try:
            audio_file.seek(0)
        except:
            pass
    
    # Get original filename or determine from content type
    original_filename = getattr(audio_file, "filename", None)
    content_type = getattr(audio_file, "content_type", None) or ""
    
    # Determine appropriate file extension based on content type or filename
    if original_filename:
        filename = original_filename
    elif "webm" in content_type.lower():
        filename = "audio.webm"
    elif "wav" in content_type.lower():
        filename = "audio.wav"
    elif "mp3" in content_type.lower() or "mpeg" in content_type.lower():
        filename = "audio.mp3"
    else:
        # Default to webm as that's what the frontend sends
        filename = "audio.webm"
    
    # Validate audio bytes
    if not audio_bytes or len(audio_bytes) == 0:
        raise ValueError("Received empty audio file")

    files = {'file': (filename, audio_bytes, content_type or 'audio/webm')}

    normalized_language = (language or "").strip().lower()
    # whisper_server auto-detects when language == "en" (it sends language=None to Whisper).
    # Accept "auto" from the frontend and map it to "en" for that behavior.
    if normalized_language in ["", "auto", "detect", "unknown"]:
        normalized_language = "en"

    data = {'language': normalized_language}
    
    async with httpx.AsyncClient(timeout=180.0) as client:
        try:
            response = await client.post("http://localhost:8001/transcribe", files=files, data=data)
            response.raise_for_status()
            result = response.json()
            transcribed_text = result.get("text", "").strip()
            detected_language = result.get("language", None)
            
            # Log detected language from Whisper
            if detected_language and detected_language != language:
                print(f"🔍 Whisper detected language: {detected_language} (requested: {language})")
            
            # Check if transcription failed
            if not transcribed_text or transcribed_text.lower() in ["error in transcription.", "error"]:
                print(f"Warning: Transcription may have failed. Result: {transcribed_text}")
            
            # Return tuple with text and detected language
            return (transcribed_text, detected_language)
        except httpx.TimeoutException as e:
            print(f"Transcription request timed out: {e}")
            raise TimeoutError("Transcription service timed out")
        except httpx.RequestError as e:
            print(f"An error occurred while requesting transcription: {e}")
            raise Exception(f"Failed to connect to transcription service: {str(e)}")
        except Exception as e:
            print(f"An unexpected error occurred during transcription: {e}")
            raise Exception(f"Transcription error: {str(e)}")