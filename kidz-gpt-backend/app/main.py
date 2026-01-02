from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from app.orchestrator import process_audio
import traceback
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="KIDZ GPT Backend")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)


@app.post("/process")
async def process(
    audio: UploadFile = File(...), 
    language: str = Form("en")
):
    try:
        # Normalize language code (e.g., "en-IN" -> "en", "hi-IN" -> "hi").
        # Also accept "auto" to mean: let Whisper auto-detect.
        normalized = (language or "").strip().lower()

        if normalized in ["", "auto", "detect", "unknown"]:
            base_language = "en"  # triggers auto-detect behavior in whisper_server
        elif "-" in normalized:
            base_language = normalized.split("-")[0]
        else:
            base_language = normalized
        
        return await process_audio(audio, base_language)
    except TimeoutError as e:
        raise HTTPException(status_code=504, detail=str(e))
    except Exception as e:
        print("❌ ERROR OCCURRED")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

