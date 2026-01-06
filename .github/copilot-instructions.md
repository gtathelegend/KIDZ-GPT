# KIDZ-GPT AI Coding Instructions

## Project Architecture

KIDZ-GPT is a **dual-service educational platform** for children (ages 6-10) combining a Python FastAPI backend with a TypeScript/React frontend to deliver multi-language AI learning experiences.

### Core Pipeline Flow
```
Browser Speech Recognition → Text Transcript → /process endpoint → 
Language Detection → Translation to English → Intent → Script → Explainer → 
Animation → Translate Back → Response (same language as detected) → Browser TTS
```

**Critical Architecture Principle**: 
1. **Browser handles audio capture & TTS** - Uses native Web Speech API (no backend audio processing)
2. **Backend processes text only** - All LLM operations happen in **English** first, then results are translated to detected language
3. **Language detected from transcript** - If user provides no language hint, backend auto-detects from transcript text
4. **Response returned in detected language** - All scenes, dialogue, and explainer text are in the language the user spoke

See [orchestrator.py](../kidz-gpt-backend/app/orchestrator.py) `_run_pipeline()` for the canonical implementation.

## Backend (`kidz-gpt-backend/`)

### Agent Pattern
All agents follow a consistent structure:
- Inherit from a base agent class (implicit pattern)
- Use Ollama for LLM calls via `httpx.AsyncClient`
- Environment variables: `OLLAMA_URL`, `OLLAMA_MODEL_<AGENT>` or `OLLAMA_MODEL` (fallback)
- Return structured data matching Pydantic schemas in [models/schemas.py](../kidz-gpt-backend/models/schemas.py)
- Parse JSON responses with error handling for markdown-wrapped JSON

**Example**: [agents/intent_agent.py](../kidz-gpt-backend/agents/intent_agent.py) - extracts `topic`, `question_type`, `difficulty`

### Multi-Language Strategy
1. **Input language detection**: Uses `langdetect` + script-based fallback (Devanagari→Hindi, etc.) in [services/language_service.py](../kidz-gpt-backend/services/language_service.py)
2. **Translation to English**: Via `deep-translator` in [services/translation_service.py](../kidz-gpt-backend/services/translation_service.py)
3. **LLM processing**: All agents work with English text
4. **Translation back**: Scenes, explainers, and dialogues translated to detected language
5. **TTS**: Frontend Web Speech API uses detected language code

**Supported languages**: `en`, `hi`, `bn`, `ta`, `te` with fallback explainers per language in [orchestrator.py](../kidz-gpt-backend/app/orchestrator.py) `_fallback_explainer_for_language()`

### Caching Layer
- Simple in-memory dict cache in [services/cache_service.py](../kidz-gpt-backend/services/cache_service.py)
- Key format: `{language}:{english_text}` (MD5 hashed)
- Stores complete pipeline results including scenes, animations, explainers
- **No Redis dependency** despite README mentioning it - uses `CACHE` dict

### Animation System
Character actions are **hardcoded** in [animation_agent.py](../kidz-gpt-backend/agents/animation_agent.py):
```python
VALID_ACTIONS = ["claping", "hello", "bye", "idle", "jump", "neutral", 
                 "question", "suprised", "thinking", "walking"]
```
Note: `"claping"` and `"suprised"` are intentional spellings matching the 3D model animations. Character selection via `KIDZ_CHARACTER` env var (`boy`/`girl`).

### Agent Responsibilities
- **intent_agent**: Extracts learning topic from user query (must preserve original language in topic field)
- **script_agent**: Generates 2-4 educational scenes with background + dialogue
- **explain_agent**: Creates title/summary/points + Wikipedia keyword for images
- **animation_agent**: Maps dialogue to character actions from `VALID_ACTIONS`
- **quiz_agent**: Generates quiz questions based on topic

## Frontend (`kidz-gpt-frontend/`)

### Directory Structure
- **Actual source**: `kidz-gpt-frontend/client/src/` (not `src/` at root)
- **3D models**: `client/public/assets/models/boy/` and `girl/` (GLB format)
- **UI components**: `client/src/components/ui/` (Radix UI + shadcn/ui pattern)

### Key Technologies
- **Vite**: Dev server on port 5000 (`npm run dev:client`)
- **Three.js + React Three Fiber**: 3D character rendering in `ScenePlayer.tsx`
- **Web Speech API**: Browser-native TTS (no backend audio generation)
- **Tailwind CSS v4**: Utility-first styling

### Communication Pattern
Frontend sends to backend:
- `/process`: Audio upload + language hint + character + transcript (Whisper disabled, frontend provides transcript)
- `/process-text`: Direct text input
- `/generate-quiz`: Request quiz for topic

**Important**: Whisper server mentioned in README is **disabled** - frontend now uses browser's native speech recognition and sends transcripts directly.

## Development Workflows

### Starting Services
```bash
# Backend (from kidz-gpt-backend/)
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Frontend (from kidz-gpt-frontend/)
npm run dev:client  # Port 5000
```

### Testing LLM Changes
1. Modify agent prompts in `agents/*.py`
2. Test with same input text to use cache bypass (change text slightly)
3. Check terminal logs for agent responses (all agents print debug info)

### Adding Languages
1. Add to `lang_code` mappings in all agents (intent, script, explain, animation)
2. Add fallback explainer in [orchestrator.py](../kidz-gpt-backend/app/orchestrator.py) `_fallback_explainer_for_language()`
3. Ensure `langdetect` can identify it, or add script-based detection in `language_service.py`

## Common Patterns

### JSON Parsing from Ollama
All agents use `_parse_ollama_json()` pattern to handle:
- Markdown-wrapped responses (```json ... ```)
- Unicode quotes (curly quotes → straight quotes)
- Extract JSON from mixed text using regex

### Error Handling
- Agents return sensible defaults on LLM failure
- Explainer falls back to language-specific templates
- Animation falls back to `build_animation_scenes()` (rule-based) if LLM fails
- Safety checks via `is_safe()` before returning any content

### Environment Variables
```env
OLLAMA_URL=http://localhost:11434/api/generate
OLLAMA_MODEL=gpt-oss:120b-cloud
OLLAMA_MODEL_INTENT=gpt-oss:120b-cloud      # Optional per-agent override
OLLAMA_MODEL_SCRIPT=gpt-oss:120b-cloud
OLLAMA_MODEL_ANIMATION=gpt-oss:120b-cloud
KIDZ_CHARACTER=girl  # boy or girl
```

## Critical Conventions

1. **Language codes**: Always normalize to 2-letter codes (`en-IN` → `en`)
2. **Character names**: Lowercase `boy`/`girl`, not capitalized
3. **Action names**: Use exact strings from `VALID_ACTIONS` (respect typos)
4. **Scene structure**: Must have `scene` (number), `background`, `dialogue`, `audio` (empty string), `duration`, `character`
5. **Explainer structure**: Must have `title`, `summary`, `points` (list), `wikipedia_keyword`, `image_url`

## Debugging & Troubleshooting

For comprehensive troubleshooting guide with common issues and solutions, see [TROUBLESHOOTING.md](../TROUBLESHOOTING.md).

## Debugging Tips

### Speech Recognition Issues
If "We couldn't capture your speech" error appears:
1. **Open Browser Console** (Press F12 → Console tab)
2. **Check for emoji-prefixed messages**:
   - 🎤 "Initializing speech recognition with language: en-IN" = API initialized
   - 📝 "Got results event with X result(s)" = Audio captured
   - ❌ "Speech recognition error: no-speech" = No audio detected (speak louder/longer)
   - ❌ "Speech recognition error: audio-capture" = Microphone not accessible
   - ❌ "Speech recognition error: not-allowed" = Permission denied by browser
3. **Solutions**:
   - **no-speech**: Speak clearly, speak longer (>0.5 seconds), minimize background noise
   - **audio-capture**: Check microphone in Windows settings, restart browser, try different microphone
   - **not-allowed**: Click lock icon in address bar → allow microphone → refresh page
   - **Fallback**: Use text input button instead of microphone

### Backend Debugging
- Check `kidz-gpt-backend/logs.txt` for backend errors (if logging enabled)
- Terminal output shows each pipeline step with emojis (✅, ⚠️, 🖼️)
- Ensure Ollama is running on port 11434: `ollama serve`
- Test backend connectivity: `curl http://localhost:8000/health` (if endpoint exists)

### Frontend Debugging
- Frontend errors visible in browser console (React + Three.js)
- Check network tab (F12 → Network) to verify `/process` and `/process-text` requests succeed
- Cache hits logged as returning cached results
- Missing animations default to "neutral" - check `_normalize_action()` logic
- Speech synthesis (TTS) errors logged to console with voice selection details

## Complete Request Flow

### Browser → Backend Pipeline

**Frontend (home.tsx - handleMicClick/handleTextSubmit):**
1. **Speech Capture**: Browser Web Speech API (`SpeechRecognition`) captures user voice in real-time
2. **Live Transcript**: `onresult` event updates `liveTranscript` state with recognized text
3. **Language Assumption**: Frontend sends language as "auto" (or user-selected language)
4. **Backend Request**: Sends to `/process` or `/process-text` with:
   - `transcript`: The recognized speech text from Web Speech API
   - `language`: "auto" for auto-detect, or language code (e.g., "hi-IN")
   - `character`: Character choice (boy/girl/ben10)
   - `audio`: Actual audio blob (currently unused, kept for compatibility)

**Backend (orchestrator.py - _run_pipeline):**
1. **Language Detection** (Step 1):
   ```python
   detected_language = detect_language(original_text)  # Uses langdetect + script fallback
   ```
   - Returns 2-letter ISO code: "en", "hi", "bn", "ta", "te"
   - Falls back to user-provided language if detection fails

2. **Translation to English** (Step 2):
   ```python
   translated_text = translate_text_with_detection(original_text, to_language="en")
   ```
   - Uses `googletrans` to convert to English
   - **Critical**: All downstream agents work with English text ONLY
   - Detected language is preserved in `detected_language` variable

3. **Intent Extraction** (Step 4):
   - `extract_intent()` processes English text
   - Returns `{"topic": "...", "question_type": "...", "difficulty": "child"}`
   - **Note**: Topic in response is still in detected language (preserved from intent agent prompt)

4. **Storyboard Generation** (Step 5):
   - `generate_storyboard_with_question()` takes English text + intent
   - Generates 2-4 educational scenes with English dialogue
   - Returns `{"scenes": [{"scene": 1, "background": "...", "dialogue": "..."}]}`

5. **Explainer Generation** (Step 6):
   - `generate_explainer()` creates title/summary/points in English
   - Fetches Wikipedia image via keyword
   - Returns `{"title": "...", "summary": "...", "points": [...], "wikipedia_keyword": "...", "image_url": "..."}`

6. **Animation Scene Building** (Step 9):
   - `generate_animation_scenes()` maps dialogue to animation actions
   - Returns scenes with animation metadata

7. **Translation Back to Detected Language** (Step 10):
   - Translates all dialogue, explainer, and animation scenes
   - **Critical**: `_translate_scenes()` and `_translate_explainer_payload()` convert back to detected language
   - Uses `translate_text()` (googletrans)

8. **Response to Frontend**:
   - Returns JSON with `language: "detected_language_code"` (e.g., "hi")
   - All user-facing text is in detected language
   - Scenes include dialogue in target language
   - Explainer title/summary/points in target language

**Frontend (handleBackendResult):**
1. **Extract Detected Language**:
   ```typescript
   let detectedLanguage = data?.language || languageAtRequest
   ```
   - Normalizes to BCP-47 format for Web Speech API (e.g., "hi" → "hi-IN")

2. **Play Scenes**: Renders animations with native browser TTS
   ```typescript
   const ttsLanguage = detectedLanguage  // "hi-IN", "bn-IN", etc.
   await playScenesWithSpeech(scenes, ttsLanguage)
   ```
   - `speakText()` uses `SpeechSynthesisUtterance` with target language
   - Browser automatically selects best voice for language

3. **Update Explainer**: Displays Wikipedia image + translated content

## Critical Implementation Details

### Language Flow Diagram
```
User speaks in Hindi "पन क्या है?"
    ↓
Browser captures: "pan kya hai" (romanized by Web Speech API)
    ↓
POST /process {transcript: "pan kya hai", language: "auto"}
    ↓
Backend detects: "hi" (from hindi script detection or langdetect)
    ↓
Translate to EN: "What is a pan?"
    ↓
Process with agents (all English internally)
    ↓
Translate back to Hindi: "एक पैन एक बर्तन है..."
    ↓
Return {language: "hi", scenes: [...hindi dialogue...], explainer: {...hindi text...}}
    ↓
Frontend normalizes: "hi" → "hi-IN"
    ↓
Web Speech API speaks in Hindi: हिंदी में बोलता है
```

### Why "auto" Language Matters
- Frontend sends "auto" to let backend auto-detect from transcript text
- If user selects specific language in UI, frontend sends that instead
- Backend respects user selection if provided, but auto-detection is preferred for accuracy
- Translation service returns detected language, which becomes the response language

## References

- [README.md](../README.md): Comprehensive setup and architecture diagrams
- [orchestrator.py](../kidz-gpt-backend/app/orchestrator.py): Core pipeline implementation (`_run_pipeline` function shows all 10 steps)
- [main.py](../kidz-gpt-backend/app/main.py): API endpoints and CORS config
- [schemas.py](../kidz-gpt-backend/models/schemas.py): Pydantic models for validation
- [home.tsx](../kidz-gpt-frontend/client/src/pages/home.tsx): Frontend speech capture and language handling
- [language_service.py](../kidz-gpt-backend/services/language_service.py): Language detection implementation
- [translation_service.py](../kidz-gpt-backend/services/translation_service.py): Translation with language detection
