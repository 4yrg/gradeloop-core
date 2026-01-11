# IVAS - Interactive Voice Assessment System

A voice-based viva (oral examination) assessment system that conducts automated programming vivas using AI. Students answer questions verbally, and the system provides comprehensive assessment reports.

## 🎯 Features

- **Voice-Based Assessment**: Students answer questions using their voice
- **Adaptive Questioning**: Questions adapt based on student's understanding
- **Real-time Transcription**: Automatic speech-to-text using Whisper
- **Natural Voice Responses**: Questions spoken using Coqui TTS
- **AI-Powered Evaluation**: Assessment using Ollama (Llama 3.1)
- **Comprehensive Reports**: Detailed feedback with strengths, weaknesses, and recommendations

## 🏗️ Architecture

- **FastAPI**: REST API backend
- **Whisper (faster-whisper)**: Speech-to-text transcription
- **Coqui TTS**: Text-to-speech synthesis
- **Ollama (Llama 3.1)**: Question generation and assessment

## 📋 Prerequisites

### System Requirements
- Python 3.10 or higher
- 4GB+ RAM (8GB recommended)
- 5GB+ disk space (for models)
- macOS, Linux, or Windows

### Install Ollama

**macOS:**
```bash
brew install ollama
```

**Linux:**
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

**Windows:**
Download from [ollama.com](https://ollama.com)

### Download the LLM Model
```bash
# Start Ollama service
ollama serve

# In another terminal, pull the model
ollama pull llama3.1:8b
```

Verify installation:
```bash
ollama list
# Should show llama3.1:8b in the list
```

## 🚀 Installation

### 1. Navigate to Project Directory
```bash
cd /Users/mpssj/all/code/uni/gradeloop-core/services/python/ivas
```

### 2. Create Virtual Environment
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

This will install:
- FastAPI & Uvicorn (web framework)
- Faster Whisper (speech recognition)
- Coqui TTS (text-to-speech)
- Ollama Python client
- Other utilities

**Note:** First installation may take 5-10 minutes as it downloads ML models.

## 🎮 Usage

### Start the Server

**Terminal 1: Start Ollama (if not already running)**
```bash
ollama serve
```

**Terminal 2: Start IVAS**
```bash
cd /Users/mpssj/all/code/uni/gradeloop-core/services/python/ivas
source venv/bin/activate
python main.py
```

The server will start on `http://localhost:8085`

Access the interactive API docs at: `http://localhost:8085/docs`

### API Endpoints

#### 1. Health Check
```bash
curl http://localhost:8085/health
```

#### 2. Start Viva Session
```bash
curl -X POST http://localhost:8085/viva/start \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "student123",
    "assignment_title": "Recursion Assignment",
    "assignment_description": "Implement recursive algorithms",
    "student_code": "def factorial(n):\n    if n <= 1:\n        return 1\n    return n * factorial(n-1)"
  }'
```

Response includes:
- `session_id`: Use for subsequent requests
- `question`: First question (text)
- `question_audio`: Audio of question (hex-encoded)

#### 3. Submit Answer
```bash
curl -X POST "http://localhost:8085/viva/answer?session_id=SESSION_ID&question_number=1" \
  -F "audio=@answer.wav"
```

Response includes:
- `transcript`: What the student said
- `assessment`: Score and understanding level
- `next_question`: Next question (or null if complete)
- `question_audio`: Audio for next question
- `final_report`: Comprehensive report (after 5 questions)

#### 4. Get Session Details
```bash
curl http://localhost:8085/viva/session/SESSION_ID
```

## 🔄 Complete Flow Example

```python
import requests
import json

# 1. Start viva
response = requests.post('http://localhost:8085/viva/start', json={
    'student_id': 'john_doe',
    'assignment_title': 'Binary Search Implementation',
    'assignment_description': 'Implement binary search algorithm',
    'student_code': 'def binary_search(arr, target): ...'
})
data = response.json()
session_id = data['session_id']
print(f"Question 1: {data['question']['question_text']}")

# Decode and play audio
audio_bytes = bytes.fromhex(data['question_audio'])
# Play audio_bytes to student...

# 2. Student records answer, submit it
files = {'audio': open('student_answer.wav', 'rb')}
params = {'session_id': session_id, 'question_number': 1}
response = requests.post('http://localhost:8085/viva/answer', 
                        params=params, files=files)
data = response.json()

print(f"Transcript: {data['transcript']}")
print(f"Score: {data['assessment']['score']}/100")

if data['is_complete']:
    report = data['final_report']
    print(f"\nFinal Score: {report['total_score']}/100")
    print(f"Level: {report['competency_level']}")
    print(f"Strengths: {report['strengths']}")
else:
    print(f"\nNext Question: {data['next_question']['question_text']}")
    # Continue for questions 2-5...
```

## 📁 Project Structure

```
ivas/
├── main.py                 # FastAPI application & endpoints
├── models.py              # Pydantic data models
├── requirements.txt       # Python dependencies
├── .env                   # Configuration (optional)
├── services/
│   ├── __init__.py
│   ├── llm_service.py    # Ollama integration
│   ├── asr_service.py    # Whisper speech-to-text
│   └── tts_service.py    # Coqui text-to-speech
└── venv/                  # Virtual environment
```

## ⚙️ Configuration

Edit `.env` file to customize:

```env
# API Settings
API_HOST=0.0.0.0
API_PORT=8085

# Ollama Settings
OLLAMA_MODEL=llama3.1:8b

# Whisper Settings (tiny, base, small, medium, large)
WHISPER_MODEL_SIZE=base

# TTS Settings
TTS_MODEL=tts_models/en/ljspeech/tacotron2-DDC

# CORS Settings
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

## 🧪 Testing

### Using Swagger UI
1. Open `http://localhost:8085/docs`
2. Try the `/viva/start` endpoint with sample data
3. Upload a WAV audio file to `/viva/answer`
4. Repeat 5 times to get final report

### Using curl + Audio Recording

**Record audio on macOS:**
```bash
# Install sox if needed: brew install sox
rec -r 16000 -c 1 answer.wav
# Press Ctrl+C to stop recording
```

**Submit answer:**
```bash
curl -X POST "http://localhost:8085/viva/answer?session_id=YOUR_SESSION_ID&question_number=1" \
  -F "audio=@answer.wav"
```

## 🔧 Troubleshooting

### Ollama Connection Error
```
Error: Could not connect to Ollama
```
**Solution:**
- Ensure Ollama is running: `ollama serve`
- Check if model is installed: `ollama list`
- Verify port 11434 is available: `lsof -i :11434`

### Whisper Model Loading Slow
**Solution:**
- First load always takes time (downloading model)
- Use smaller model: Set `WHISPER_MODEL_SIZE=tiny` in `.env`
- Models are cached after first download

### TTS Synthesis Slow
**Solution:**
- First synthesis loads the model (takes ~10-30 seconds)
- Subsequent syntheses are much faster
- Consider caching audio for repeated questions

### Poor Transcription Accuracy
**Solution:**
- Ensure clear audio (no background noise)
- Use WAV format, 16kHz sample rate
- Try larger Whisper model: `WHISPER_MODEL_SIZE=small`
- Check microphone quality

### Memory Issues
**Solution:**
- Whisper base model uses ~1GB RAM
- TTS model uses ~500MB RAM
- Use `tiny` Whisper model to reduce memory: `WHISPER_MODEL_SIZE=tiny`

## 📊 Assessment Rubric

### Understanding Levels
- **Excellent (90-100)**: Comprehensive, insightful, demonstrates mastery
- **Good (70-89)**: Solid understanding with minor gaps
- **Partial (50-69)**: Some understanding but significant gaps
- **Minimal (25-49)**: Very limited understanding
- **None (0-24)**: Off-topic or no meaningful content

### Competency Levels
- **EXPERT (90-100)**: Exceptional understanding, ready for advanced topics
- **ADVANCED (75-89)**: Strong grasp, minor improvements needed
- **INTERMEDIATE (50-74)**: Moderate understanding, needs practice
- **BEGINNER (0-49)**: Fundamental gaps, significant study required

## 🚦 API Response Times

- **Start Viva**: 5-15 seconds (LLM + TTS)
- **Submit Answer**: 8-20 seconds (ASR + LLM + TTS)
- **Final Report**: 10-25 seconds (LLM processing)

Times vary based on:
- Hardware (CPU/RAM)
- Model sizes (tiny vs large)
- Audio length
- LLM prompt complexity

## 🔐 Security Considerations

For production deployment:
- [ ] Add authentication (API keys, JWT)
- [ ] Rate limiting (prevent abuse)
- [ ] Input validation (audio file size limits)
- [ ] HTTPS/TLS encryption
- [ ] Session expiration/cleanup
- [ ] Persistent storage (database instead of in-memory)

## 🎯 Future Enhancements

- [ ] Multi-language support
- [ ] Video recording (face + voice)
- [ ] Emotion/confidence analysis
- [ ] Live session monitoring dashboard
- [ ] Export reports as PDF
- [ ] Integration with LMS systems
- [ ] Student analytics dashboard
- [ ] Cheating detection

## 📝 License

Internal use for GradeLoop project.

## 🤝 Contributing

This is part of the GradeLoop ecosystem. For issues or improvements, contact the development team.

## 📞 Support

For issues:
1. Check troubleshooting section
2. Review logs in terminal
3. Test with `/health` endpoint
4. Contact: [your-email@domain.com]

---

**Built with ❤️ for automated programming education**
