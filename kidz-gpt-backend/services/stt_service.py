import asyncio
import os
import httpx


async def transcribe_audio(audio_file):
    audio_bytes = await audio_file.read()
    
    filename = getattr(audio_file, "filename", None) or "audio.mp3"

    files = {'file': (filename, audio_bytes)}
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post("http://localhost:8001/transcribe", files=files)
            response.raise_for_status()
            result = response.json()
            return result.get("text", "")
        except httpx.RequestError as e:
            print(f"An error occurred while requesting transcription: {e}")
            return "Error in transcription."
        except Exception as e:
            print(f"An unexpected error occurred: {e}")
            return "Error in transcription."