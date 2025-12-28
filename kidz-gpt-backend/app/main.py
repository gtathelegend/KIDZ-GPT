from fastapi import FastAPI, UploadFile, File
from app.orchestrator import process_audio

app = FastAPI(title="KIDZ GPT Backend")

@app.get("/")
def health():
    return {"status": "Backend running"}

@app.post("/process")
async def process(audio: UploadFile = File(...)):
    result = await process_audio(audio)
    return result
