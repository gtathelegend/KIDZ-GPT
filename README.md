# 🎓 KIDZ-GPT: AI Learning Companion for Kids

A vibrant, interactive learning platform that uses AI and 3D character animation to teach children aged 6-10 in multiple languages. KIDZ-GPT combines voice recognition, intelligent tutoring, animated explanations, and interactive quizzes to create an engaging educational experience.

## ✨ Features

### 🎤 **Multi-Language Voice Input**
- Speech-to-text using OpenAI Whisper (supports 99+ languages)
- Automatic language detection from audio
- Live transcription with visual feedback
- Supports: English, Hindi, Bengali, Tamil, Telugu, and more

### 🤖 **AI-Powered Responses**
- LLM-driven explanations using Ollama (gpt-oss:120b-cloud)
- Context-aware learning with intent extraction
- Child-friendly explanations with key points
- Automatic Wikipedia image fetching for topics

### 🎨 **3D Character Animation**
- Animated characters (Boy & Girl avatars) with expressions
- Real-time animation synchronized with speech
- Multiple animation actions (hello, thinking, jumping, etc.)
- Scene-based storytelling approach

### 📚 **Interactive Learning**
- **Topic Explanations**: Title, summary, key points + Wikipedia images
- **Quiz Generation**: AI-generated quizzes based on explained topics
- **Scoring System**: Real-time quiz feedback with scoring
- **Colorful Chat Interface**: Vibrant gradient bubbles for user/AI messages

### 🎧 **Web Speech API TTS**
- Browser-native text-to-speech
- Multiple voice options per language
- Natural speaking rate and pitch control
- Playback controls (stop, replay)

### 🌍 **Multi-Language Support**
- **Full Pipeline**: STT → Intent Extraction → Storyboard → Animation → TTS
- All components respond in the detected/selected language
- Fallback explainers for all supported languages

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     KIDZ-GPT System                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌────────────────────────────────────────────────────┐   │
│  │        Frontend (React + TypeScript + Vite)       │   │
│  │  ├─ Chat Interface (Colorful Bubbles)             │   │
│  │  ├─ 3D Scene Player (Three.js + React Three)      │   │
│  │  ├─ Explainer Section (Images + Content)          │   │
│  │  ├─ Quiz Interface                                │   │
│  │  └─ Web Speech API (TTS & STT)                    │   │
│  └────────────────────────────────────────────────────┘   │
│                          ↕ (HTTP)                          │
│  ┌────────────────────────────────────────────────────┐   │
│  │        Backend (Python FastAPI)                   │   │
│  │  ├─ /process (Audio Upload)                       │   │
│  │  ├─ /process-text (Text Input)                    │   │
│  │  ├─ /generate-quiz (Quiz Creation)                │   │
│  │  └─ /transcribe (Whisper Server)                  │   │
│  └────────────────────────────────────────────────────┘   │
│                          ↕                                  │
│  ┌────────────────────────────────────────────────────┐   │
│  │   External Services & Local Services              │   │
│  │  ├─ Ollama (LLM: gpt-oss:120b-cloud)             │   │
│  │  ├─ OpenAI Whisper (Speech Recognition)          │   │
│  │  ├─ Wikipedia API (Image Fetching)               │   │
│  │  ├─ langdetect (Text Language Detection)         │   │
│  │  └─ Redis Cache (Response Caching)               │   │
│  └────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 🔄 Internal System Flow

### 1. **Audio Input Processing**
```
User speaks (audio) 
  ↓
Frontend captures via Web Audio API
  ↓
Sends to /process endpoint with language hint
  ↓
Backend STT Service (Whisper)
  ↓
Whisper detects language & transcribes
  ↓
Returns: {text, detected_language}
```

### 2. **Intent Extraction**
```
Transcribed text + language
  ↓
Intent Agent (LLM via Ollama)
  ↓
Extracts: {topic, question_type, difficulty}
  ↓
Result used for storyboard generation
```

### 3. **Storyboard Generation**
```
Intent + question + language
  ↓
Script Agent (LLM via Ollama)
  ↓
Generates educational scenes with dialogues
  ↓
Each scene has: dialogue text, learning points
  ↓
All content in detected language
```

### 4. **Explainer Generation**
```
Topic + question + language
  ↓
Explain Agent (LLM via Ollama)
  ↓
Generates: {title, summary, points, wikipedia_keyword}
  ↓
Wikipedia Service fetches image using keyword
  ↓
Returns: explainer with image_url
```

### 5. **Animation Scene Building**
```
Storyboard scenes + Explainer
  ↓
Animation Agent selects actions based on dialogue
  ↓
Generates 3D animation scenes with:
  - action (hello, thinking, jumping, etc.)
  - dialogue text
  - duration estimate
  ↓
Frontend renders with ScenePlayer (Three.js)
```

### 6. **Response Playback**
```
Animation scenes ready
  ↓
ScenePlayer renders 3D character
  ↓
For each scene:
  - Play animation
  - Add dialogue to chat
  - Speak text via Web Speech API
  ↓
User can stop/replay at any time
```

### 7. **Caching Layer**
```
Response cached by input text
  ↓
Next identical question: instant retrieval
  ↓
Cache includes: scenes, animations, explainer
```

## 📋 System Components

### **Frontend** (`kidz-gpt-frontend/`)
- **React + TypeScript + Vite**: Modern SPA framework
- **Three.js + React Three Fiber**: 3D character rendering
- **Tailwind CSS**: Responsive styling
- **Radix UI**: Accessible component library
- **Web Speech API**: Browser TTS/STT

### **Backend** (`kidz-gpt-backend/`)

#### **Main App** (`app/`)
- `main.py`: FastAPI server with endpoints
- `orchestrator.py`: Pipeline orchestration & language handling

#### **Agents** (`agents/`)
- `intent_agent.py`: Extracts learning intent from user input
- `script_agent.py`: Generates educational storyboard
- `explain_agent.py`: Creates explanations with Wikipedia keywords
- `animation_agent.py`: Selects animations based on dialogue
- `quiz_agent.py`: Generates and scores quizzes

#### **Services** (`services/`)
- `stt_service.py`: Speech-to-text via Whisper
- `language_service.py`: Language detection with script-based fallback
- `wikipedia_service.py`: Fetches images from Wikipedia
- `cache_service.py`: Redis-based response caching
- `safety_service.py`: Content safety checking
- `animation_script_service.py`: Animation scene building
- `translation_service.py`: Text translation

#### **Whisper Server** (`whisper_server.py`)
- Dedicated FastAPI server for speech recognition
- Runs on port 8001
- Uses 'base' model for multilingual support

## 🚀 Installation & Setup

### **Prerequisites**
- Python 3.9+
- Node.js 18+
- FFmpeg (for Whisper)
- Ollama (local LLM server)
- Redis (optional, for caching)

### **Step 1: Clone & Install Python Dependencies**

```bash
cd KIDZ-GPT

# Backend setup
cd kidz-gpt-backend
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### **Step 2: Install Ollama**

1. Download from [ollama.ai](https://ollama.ai)
2. Run the installer
3. Pull the required model:
   ```bash
   ollama pull gpt-oss:120b-cloud
   ```
4. Start Ollama (runs on `http://localhost:11434` by default)

### **Step 3: Install FFmpeg**

**Windows:**
```bash
pip install imageio-ffmpeg
```

**macOS:**
```bash
brew install ffmpeg
```

**Linux:**
```bash
sudo apt-get install ffmpeg
```

### **Step 4: Set Up Environment Variables**

Create `.env` file in `kidz-gpt-backend/`:
```env
# Ollama Configuration
OLLAMA_URL=http://localhost:11434/api/generate
OLLAMA_MODEL=gpt-oss:120b-cloud
OLLAMA_MODEL_INTENT=gpt-oss:120b-cloud

# Whisper Configuration
WHISPER_MODEL=base

# Server Configuration
STT_TIMEOUT_SECONDS=180
CACHE_TTL_SECONDS=3600

# Redis (optional)
REDIS_URL=redis://localhost:6379/0

# Frontend
VITE_API_URL=http://localhost:8000
```

### **Step 5: Start Backend Services**

**Terminal 1 - Whisper Server:**
```bash
cd kidz-gpt-backend
python whisper_server.py
# Runs on http://localhost:8001
```

**Terminal 2 - Main Backend:**
```bash
cd kidz-gpt-backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
# Runs on http://localhost:8000
```

### **Step 6: Install & Start Frontend**

```bash
cd kidz-gpt-frontend

# Install dependencies
npm install

# Start development server
npm run dev:client
# Runs on http://localhost:5000
```

### **Step 7: Access the Application**

Open your browser and navigate to:
```
http://localhost:5000
```

## 🎯 Usage

### **Voice Input**
1. Click the microphone button
2. Speak a question (e.g., "What is a pen?")
3. System automatically detects language
4. Animated character responds with explanation
5. Watch the quiz section appear for reinforcement

### **Text Input**
1. Click the text input field
2. Type your question
3. System auto-detects language from text
4. Get animated response with explanation
5. Take an interactive quiz

### **Language Selection**
- System automatically detects from audio/text
- Manual selection available in language dropdown
- Supports: English, Hindi, Bengali, Tamil, Telugu

### **Controls**
- **⏹️ Stop**: Halt current response playback
- **🔄 Replay**: Re-play the last response
- **🎧 Quiz**: Take a quiz on the topic
- **🖼️ Background**: Toggle between two themed backgrounds

## 🧠 How Language Detection Works

### **Priority Order:**
1. **Whisper Audio Detection** (Most Accurate)
   - OpenAI Whisper analyzes audio
   - Detects language from speech patterns
   - Example: User speaks in Hindi → Whisper returns "hi"

2. **Text-Based Detection** (Fallback for text input)
   - `langdetect` library analyzes text
   - Script-based detection (Devanagari → Hindi, etc.)
   - Example: Text contains हिंदी characters → Detected as "hi"

3. **User-Specified Language**
   - Falls back if auto-detection fails
   - User can manually override

4. **Default to English**
   - Safest fallback option

### **Language Pipeline:**
```
Input (Audio/Text) 
  ↓
Detection (Whisper/langdetect)
  ↓
Normalization (hi-IN → hi)
  ↓
Validation (Check if supported)
  ↓
Pipeline Execution (All agents respond in this language)
  ↓
TTS (Web Speech API uses detected language)
```

## 🎨 UI/UX Features

### **Chat Bubbles**
- **User Messages**: Coral-to-Orange gradient (🎤 You)
- **AI Messages**: Green gradient (🤖 KidzGPT)
- **Listening**: Blue gradient (🎧 Listening)
- **Thinking**: Golden gradient (✨ Thinking)

### **Explainer Section**
- Topic title and image (from Wikipedia)
- Summary in child-friendly language
- 3 key learning points
- Topic tags

### **3D Animation**
- Two character options (Boy & Girl)
- Animated expressions (hello, thinking, surprised, etc.)
- Floating decorative elements
- Smooth transitions

## 🔧 Configuration

### **Whisper Model Sizes**
- `tiny`: Fast, lower accuracy (→ use for quick tests)
- `small`: Good balance
- `base`: Better multilingual (→ default)
- `medium`: Higher accuracy (→ slower)

### **Ollama Model Options**
```bash
# Current (recommended)
ollama pull gpt-oss:120b-cloud

# Alternatives
ollama pull mistral
ollama pull neural-chat
ollama pull dolphin-mixtral
```

### **TTS Voice Selection**
- System automatically selects best voice for language
- Prioritizes neural voices
- Falls back to other voices if needed

## 📊 Supported Languages

| Language | Code | Script Detection |
|----------|------|------------------|
| English | en | Latin |
| Hindi | hi | Devanagari (हिंदी) |
| Bengali | bn | Bengali (বাংলা) |
| Tamil | ta | Tamil (தமிழ்) |
| Telugu | te | Telugu (తెలుగు) |

Each language has:
- ✅ Whisper STT support
- ✅ Intent/Script/Explain agents
- ✅ Web Speech API TTS
- ✅ Fallback explainers
- ✅ Quiz generation

## 🐛 Troubleshooting

### **"Whisper server not responding"**
```bash
# Check if Whisper server is running on port 8001
curl http://localhost:8001/transcribe

# Restart if needed
python whisper_server.py
```

### **"Ollama connection failed"**
```bash
# Ensure Ollama is running
ollama serve

# Check if model is installed
ollama list
```

### **"Language not detected correctly"**
- Check backend logs for language detection flow
- Verify Whisper model is 'base' or higher
- For text input, ensure text contains language script markers

### **"No audio recorded"**
- Check browser microphone permissions
- Ensure HTTPS or localhost (browser requirement)
- Test microphone in another app

### **"Animation not playing"**
- Check Three.js/React Three Fiber in browser console
- Verify character model files exist
- Clear browser cache and reload

## 📝 API Endpoints

### **Main Endpoints**

**POST** `/process`
- Audio processing with language hint
- Returns: Scenes, animation, explainer, quiz

**POST** `/process-text`
- Text input processing
- Returns: Same as /process

**POST** `/generate-quiz`
- Generate quiz for a topic
- Returns: Quiz questions with scoring

### **Whisper Endpoint**

**POST** `/transcribe` (Port 8001)
- Audio file + language hint
- Returns: {text, detected_language}

## 🚦 Performance Tips

- **First Load**: ~3-5 seconds (Whisper model loading)
- **Response Time**: ~5-15 seconds (LLM generation)
- **Animation Playback**: Real-time
- **Caching**: Identical queries return instantly

## 📱 Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Opera 76+

**Requirements:**
- Web Speech API (TTS)
- Web Audio API (microphone access)
- WebGL (3D animation)

## 🎓 Educational Design

### **For Kids:**
- ✨ Engaging 3D characters
- 🎨 Colorful, vibrant UI
- 🎤 Voice interaction
- 🧩 Interactive quizzes
- 🌍 Multilingual support

### **Learning Approach:**
1. **Explanation**: AI provides structured learning
2. **Visualization**: Wikipedia images show real examples
3. **Reinforcement**: Interactive quiz tests understanding
4. **Feedback**: Instant scoring and encouragement

## 📚 Project Structure

```
KIDZ-GPT/
├── kidz-gpt-backend/
│   ├── app/
│   │   ├── main.py (FastAPI endpoints)
│   │   └── orchestrator.py (Pipeline)
│   ├── agents/
│   │   ├── intent_agent.py
│   │   ├── script_agent.py
│   │   ├── explain_agent.py
│   │   ├── animation_agent.py
│   │   └── quiz_agent.py
│   ├── services/
│   │   ├── stt_service.py
│   │   ├── language_service.py
│   │   ├── wikipedia_service.py
│   │   └── ...
│   ├── whisper_server.py
│   └── requirements.txt
│
└── kidz-gpt-frontend/
    ├── client/
    │   ├── src/
    │   │   ├── pages/
    │   │   │   └── home.tsx (Main interface)
    │   │   ├── components/
    │   │   │   ├── ScenePlayer.tsx (3D animation)
    │   │   │   └── characters/
    │   │   └── index.css
    │   └── public/
    │       └── assets/
    │           └── models/ (3D character models)
    ├── package.json
    ├── vite.config.ts
    └── tsconfig.json
```

## 🤝 Contributing

Contributions welcome! Areas for improvement:
- Additional languages
- More 3D character models
- Enhanced quiz generation
- Performance optimization
- Mobile app version

## 📄 License

MIT License - See LICENSE file for details

## 🎉 Acknowledgments

- OpenAI Whisper for speech recognition
- Ollama for local LLM inference
- Three.js for 3D rendering
- React Three Fiber for React integration
- Radix UI for accessible components
- Tailwind CSS for styling

---

**Built with ❤️ for kids' learning**

For issues, questions, or suggestions, please open an issue on GitHub.
