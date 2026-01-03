from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from app.orchestrator import process_audio, process_text_query
import traceback
from dotenv import load_dotenv
from pydantic import BaseModel
from services.translation_service import translate_text
from services.cache_service import get_by_key
from agents.quiz_agent import generate_quiz

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


class TranslationRequest(BaseModel):
    text: str
    to_language: str = "en"

@app.post("/translate")
async def translate(request: TranslationRequest):
    try:
        translated_text = translate_text(request.text, request.to_language)
        return {"translated_text": translated_text}
    except Exception as e:
        print("❌ ERROR OCCURRED during translation")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


class TextProcessRequest(BaseModel):
    text: str
    language: str = "en"
    character: str = "girl"
@app.post("/process")
async def process(
    audio: UploadFile = File(...), 
    language: str = Form("en"),
    character: str = Form("girl")
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
        
        # Normalize character
        char_normalized = (character or "").strip().lower()
        if char_normalized not in ["boy", "girl"]:
            char_normalized = "girl"
        
        return await process_audio(audio, base_language, char_normalized)
    except TimeoutError as e:
        raise HTTPException(status_code=504, detail=str(e))
    except Exception as e:
        print("❌ ERROR OCCURRED")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/process-text")
async def process_text(request: TextProcessRequest):
    try:
        normalized = (request.language or "").strip().lower()

        if normalized in ["", "auto", "detect", "unknown"]:
            base_language = "en"
        elif "-" in normalized:
            base_language = normalized.split("-")[0]
        else:
            base_language = normalized

        # Normalize character
        char_normalized = (request.character or "").strip().lower()
        if char_normalized not in ["boy", "girl"]:
            char_normalized = "girl"

        return await process_text_query(request.text, base_language, char_normalized)
    except TimeoutError as e:
        raise HTTPException(status_code=504, detail=str(e))
    except Exception as e:
        print("❌ ERROR OCCURRED (text)")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/explainer")
async def get_explainer(job_id: str):
    """Poll for the deferred explainer generated after /process.

    Returns:
      - status: pending|ready|fallback
      - explainer: object|null
    """
    try:
        cache_key = (job_id or "").strip()
        if not cache_key:
            raise HTTPException(status_code=400, detail="Missing job_id")

        payload = get_by_key(cache_key)
        if not payload or not isinstance(payload, dict):
            raise HTTPException(status_code=404, detail="Unknown job_id")

        return {
            "job_id": cache_key,
            "status": payload.get("explainer_status") or ("ready" if payload.get("explainer") else "pending"),
            "explainer": payload.get("explainer"),
            "error": payload.get("explainer_error"),
        }
    except HTTPException:
        raise
    except Exception as e:
        print("❌ ERROR OCCURRED during explainer polling")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/generate-quiz")
async def create_quiz(request: dict):
    """Generate a quiz based on the topic and explainer content.
    
    Request body:
      - topic: string
      - explainer: object (with title, summary, points)
      - language: string (optional, default "en")
    
    Returns:
      - questions: array of quiz questions
    """
    try:
        topic = request.get("topic", "")
        explainer = request.get("explainer", {})
        language = request.get("language", "en")
        
        if not topic and not explainer:
            raise HTTPException(status_code=400, detail="Missing topic or explainer")
        
        result = await generate_quiz(
            topic=topic,
            explainer=explainer,
            language=language
        )

        # quiz_agent.generate_quiz returns: {"questions": [ ... ]}
        # Frontend expects: {"questions": [ ... ]}
        return {"questions": (result or {}).get("questions", [])}
    except Exception as e:
        print("❌ ERROR OCCURRED during quiz generation")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


