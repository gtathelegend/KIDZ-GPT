from fastapi import FastAPI, UploadFile, File, HTTPException
from app.orchestrator import process_audio
import traceback
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="KIDZ GPT Backend")

@app.post("/process")
async def process(audio: UploadFile = File(...), language: str = "en"):
    try:
        return await process_audio(audio, language)
    except TimeoutError as e:
        raise HTTPException(status_code=504, detail=str(e))
    except Exception as e:
        print("❌ ERROR OCCURRED")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

