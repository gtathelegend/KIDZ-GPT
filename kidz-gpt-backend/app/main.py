from fastapi import FastAPI, UploadFile, File
from app.orchestrator import process_audio
import traceback

app = FastAPI(title="KIDZ GPT Backend")

@app.post("/process")
async def process(audio: UploadFile = File(...)):
    try:
        return await process_audio(audio)
    except Exception as e:
        print("❌ ERROR OCCURRED")
        traceback.print_exc()
        return {"error": str(e)}
