cd /Users/mpssj/all/code/uni/gradeloop-core/services/python/ivas && source venv/bin/activate && python -m uvicorn main:app --host 0.0.0.0 --port 8085 --reload

lsof -ti:8085 | xargs kill -9 2>/dev/null; sleep 1 && cd /Users/mpssj/all/code/uni/gradeloop-core/services/python/ivas && source venv/bin/activate && python -m uvicorn main:app --host 0.0.0.0 --port 8085 --reload


# IVAS Implementation Guide - Step by Step

> **Intelligent Viva Assessment System** for GradeLoop  
> Last Updated: January 2026

## 📂 Project Structure Overview

The GradeLoop project uses a microservices architecture with:

| Layer | Technology | Location |
|-------|------------|----------|
| **Frontend** | Next.js 16 (React 19) | `web/` |
| **API Gateway** | Kong | `infra/docker/kong.yml` |
| **IVAS Backend** | Spring Boot 4 (Java 17) | `services/java/ivas/` |
| **IVAS AI Services** | FastAPI (Python) | `services/python/ivas/` |
| **Database** | PostgreSQL 15 | `ivas-db` container |
| **Message Queue** | RabbitMQ | Shared infrastructure |

---

## 🎯 STEP 1: Setup IVAS Spring Boot Backend Structure

### What to Do:

1. **Navigate to IVAS service directory**
   ```
   services/java/ivas/src/main/java/com/gradeloop/ivas/
   ```

2. **Create standard Spring Boot package structure:**
   ```
   com/gradeloop/ivas/
   ├── IvasApplication.java (exists)
   ├── config/
   │   └── SecurityConfig.java
   │   └── WebSocketConfig.java
   ├── controller/
   │   └── VivaController.java
   │   └── HealthController.java
   ├── dto/
   │   └── request/
   │   └── response/
   ├── model/
   │   └── VivaSession.java
   │   └── ConversationTurn.java
   │   └── Assessment.java
   ├── repository/
   │   └── VivaSessionRepository.java
   ├── service/
   │   └── VivaService.java
   └── exception/
       └── IvasExceptionHandler.java
   ```

3. **Update `application.properties`:**
   ```properties
   spring.application.name=ivas
   server.port=8084
   spring.datasource.url=jdbc:postgresql://localhost:5432/ivas_db
   spring.datasource.username=postgres
   spring.datasource.password=password
   spring.jpa.hibernate.ddl-auto=update
   ```

4. **Create `HealthController.java`:**
   ```java
   @RestController
   @RequestMapping("/api/v1/viva")
   public class HealthController {
       @GetMapping("/health")
       public ResponseEntity<Map<String, String>> health() {
           return ResponseEntity.ok(Map.of("status", "healthy"));
       }
   }
   ```

5. **Start the IVAS service:**
   ```bash
   cd services/java/ivas
   ./mvnw spring-boot:run
   ```

### Success Check:
```bash
curl http://localhost:8084/api/v1/viva/health
# Expected: {"status": "healthy"}
```

### Files to Create/Modify:
- [services/java/ivas/src/main/resources/application.properties](services/java/ivas/src/main/resources/application.properties)
- [services/java/ivas/src/main/java/com/gradeloop/ivas/controller/HealthController.java](services/java/ivas/src/main/java/com/gradeloop/ivas/controller/HealthController.java)
- [services/java/ivas/src/main/java/com/gradeloop/ivas/config/SecurityConfig.java](services/java/ivas/src/main/java/com/gradeloop/ivas/config/SecurityConfig.java)

---

## 🎯 STEP 2: Create Database Models & Repositories

### What to Do:

1. **Create `VivaSession.java` entity:**
   - Fields: `id`, `studentId`, `assignmentId`, `courseId`, `status`, `startedAt`, `endedAt`, `score`, `competencyLevel`
   - Status enum: `NOT_STARTED`, `IN_PROGRESS`, `COMPLETED`, `ABANDONED`

2. **Create `ConversationTurn.java` entity:**
   - Fields: `id`, `sessionId`, `turnNumber`, `speaker` (AI/STUDENT), `transcript`, `audioUrl`, `timestamp`
   - One-to-Many relationship with VivaSession

3. **Create `Assessment.java` entity:**
   - Fields: `id`, `sessionId`, `overallScore`, `competencyLevel`, `misconceptions` (JSON), `strengths`, `weaknesses`, `fullAnalysis`
   - One-to-One relationship with VivaSession

4. **Create JPA repositories:**
   - `VivaSessionRepository extends JpaRepository<VivaSession, UUID>`
   - `ConversationTurnRepository extends JpaRepository<ConversationTurn, UUID>`
   - `AssessmentRepository extends JpaRepository<Assessment, UUID>`

5. **Run the service to auto-create tables:**
   ```bash
   # Start ivas-db container first
   docker compose -f infra/docker/docker-compose.yml up ivas-db -d
   
   # Then run the service
   cd services/java/ivas && ./mvnw spring-boot:run
   ```

### Success Check:
```bash
# Connect to database and verify tables exist
docker exec -it gradeloop-ivas-db-1 psql -U postgres -d ivas_db -c "\dt"
# Expected: viva_sessions, conversation_turns, assessments tables listed
```

### Files to Create:
- [services/java/ivas/src/main/java/com/gradeloop/ivas/model/VivaSession.java](services/java/ivas/src/main/java/com/gradeloop/ivas/model/VivaSession.java)
- [services/java/ivas/src/main/java/com/gradeloop/ivas/model/ConversationTurn.java](services/java/ivas/src/main/java/com/gradeloop/ivas/model/ConversationTurn.java)
- [services/java/ivas/src/main/java/com/gradeloop/ivas/model/Assessment.java](services/java/ivas/src/main/java/com/gradeloop/ivas/model/Assessment.java)
- [services/java/ivas/src/main/java/com/gradeloop/ivas/repository/](services/java/ivas/src/main/java/com/gradeloop/ivas/repository/) (3 repository files)

---

## 🎯 STEP 3: Implement Core REST APIs in Spring Boot

### What to Do:

1. **Create Request/Response DTOs:**
   ```
   dto/
   ├── request/
   │   ├── StartVivaRequest.java
   │   ├── SubmitResponseRequest.java
   │   └── EndVivaRequest.java
   └── response/
       ├── VivaSessionResponse.java
       ├── VivaConfigResponse.java
       └── DashboardResponse.java
   ```

2. **Implement `VivaService.java`:**
   - `startSession(StartVivaRequest)` → Creates session, returns initial question
   - `getSession(sessionId)` → Returns session details with conversation
   - `listSessions(assignmentId, filters)` → Returns paginated list
   - `endSession(sessionId)` → Marks session complete

3. **Implement `VivaController.java` endpoints:**

   | Method | Endpoint | Description |
   |--------|----------|-------------|
   | POST | `/api/v1/viva/sessions` | Start a new viva session |
   | GET | `/api/v1/viva/sessions/{sessionId}` | Get session details |
   | GET | `/api/v1/viva/assignments/{assignmentId}/sessions` | List sessions for assignment |
   | GET | `/api/v1/viva/assignments/{assignmentId}/config` | Get viva configuration |
   | GET | `/api/v1/viva/assignments/{assignmentId}/dashboard` | Get instructor dashboard data |
   | PUT | `/api/v1/viva/sessions/{sessionId}/end` | End a viva session |

4. **Add validation using `@Valid` annotations**

### Success Check:
```bash
# Test create session
curl -X POST http://localhost:8084/api/v1/viva/sessions \
  -H "Content-Type: application/json" \
  -d '{"studentId": "student123", "assignmentId": "assign456", "courseId": "course789"}'
# Expected: 201 Created with session ID

# Test get session
curl http://localhost:8084/api/v1/viva/sessions/{sessionId}
# Expected: 200 OK with session details
```

### Files to Create:
- [services/java/ivas/src/main/java/com/gradeloop/ivas/controller/VivaController.java](services/java/ivas/src/main/java/com/gradeloop/ivas/controller/VivaController.java)
- [services/java/ivas/src/main/java/com/gradeloop/ivas/service/VivaService.java](services/java/ivas/src/main/java/com/gradeloop/ivas/service/VivaService.java)
- [services/java/ivas/src/main/java/com/gradeloop/ivas/dto/](services/java/ivas/src/main/java/com/gradeloop/ivas/dto/) (all DTOs)

---

## 🎯 STEP 4: Setup AI Services (FastAPI Python Backend)

### What to Do:

1. **Create IVAS AI services directory structure:**
   ```
   services/python/ivas/
   ├── __init__.py
   ├── main.py
   ├── config.py
   ├── router.py
   ├── schemas.py
   ├── services.py
   ├── prompts.py
   ├── requirements.txt
   ├── Dockerfile
   ├── .env.example
   └── models/
       ├── whisper/
       └── tts/
   ```

2. **Create `requirements.txt`:**
   ```
   fastapi==0.109.0
   uvicorn==0.27.0
   pydantic==2.5.3
   python-multipart==0.0.6
   websockets==12.0
   ```

3. **Create `main.py`:**
   ```python
   from fastapi import FastAPI
   from fastapi.middleware.cors import CORSMiddleware
   from router import router as ivas_router
   from config import settings

   app = FastAPI(title="IVAS AI Services", version="1.0.0")
   
   app.add_middleware(CORSMiddleware, allow_origins=settings.CORS_ORIGINS, ...)
   app.include_router(ivas_router, prefix="/ivas", tags=["IVAS"])
   
   @app.get("/health")
   def health(): return {"status": "healthy", "service": "ivas-ai-services"}
   ```

4. **Create basic `router.py` with health endpoint**

5. **Run the service:**
   ```bash
   cd services/python/ivas
   python -m venv venv && source venv/bin/activate
   pip install -r requirements.txt
   uvicorn main:app --reload --port 8085
   ```

### Success Check:
```bash
curl http://localhost:8085/health
# Expected: {"status": "healthy"}

curl http://localhost:8085/ivas/health
# Expected: {"status": "healthy", "services": {...}}
```

### Files to Create:
- [services/python/ivas/main.py](services/python/ivas/main.py)
- [services/python/ivas/config.py](services/python/ivas/config.py)
- [services/python/ivas/router.py](services/python/ivas/router.py)
- [services/python/ivas/schemas.py](services/python/ivas/schemas.py)
- [services/python/ivas/services.py](services/python/ivas/services.py)
- [services/python/ivas/prompts.py](services/python/ivas/prompts.py)
- [services/python/ivas/requirements.txt](services/python/ivas/requirements.txt)
- [services/python/ivas/Dockerfile](services/python/ivas/Dockerfile)

---

## 🎯 STEP 5: Implement Local ASR (Faster-Whisper)

### What to Do:

1. **Add to `requirements.txt`:**
   ```
   faster-whisper==0.10.0
   numpy>=1.24.0
   ```

2. **Create `ASRService` class in `services.py`:**
   ```python
   from faster_whisper import WhisperModel
   
   class ASRService:
       def __init__(self, model_size="base"):
           self.model = WhisperModel(model_size, device="cpu", compute_type="int8")
       
       def transcribe(self, audio_bytes: bytes) -> str:
           # Save to temp file, transcribe, return text
           pass
   ```

3. **Create test script `test_asr.py`:**
   ```python
   from services import ASRService
   
   asr = ASRService()
   with open("test_audio.wav", "rb") as f:
       text = asr.transcribe(f.read())
   print(f"Transcription: {text}")
   ```

4. **Add endpoint for testing:**
   ```python
   @router.post("/transcribe")
   async def transcribe_audio(file: UploadFile):
       text = asr_service.transcribe(await file.read())
       return {"transcript": text}
   ```

### Success Check:
```bash
# Create a test audio file (or use existing)
python test_asr.py
# Expected: Accurate transcription in <2 seconds

# Test via API
curl -X POST http://localhost:8085/ivas/transcribe \
  -F "file=@test_audio.wav"
# Expected: {"transcript": "..."}
```

### Files to Modify:
- [services/python/ivas/requirements.txt](services/python/ivas/requirements.txt)
- [services/python/ivas/services.py](services/python/ivas/services.py)

---

## 🎯 STEP 6: Implement Local TTS (Coqui XTTS v2)

### What to Do:

1. **Add to `requirements.txt`:**
   ```
   TTS==0.22.0
   ```

2. **Create `TTSService` class in `services.py`:**
   ```python
   from TTS.api import TTS
   
   class TTSService:
       def __init__(self):
           self.tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2")
       
       def synthesize(self, text: str, emotion: str = "neutral") -> bytes:
           # Generate audio, return WAV bytes
           pass
   ```

3. **Create test script `test_tts.py`:**
   ```python
   from services import TTSService
   
   tts = TTSService()
   audio = tts.synthesize("Hello, let's begin the viva assessment.")
   with open("test_output.wav", "wb") as f:
       f.write(audio)
   ```

4. **Add endpoint for testing:**
   ```python
   @router.post("/synthesize")
   async def synthesize_speech(request: TTSRequest):
       audio = tts_service.synthesize(request.text, request.emotion)
       return Response(content=audio, media_type="audio/wav")
   ```

### Success Check:
```bash
python test_tts.py
# Play test_output.wav - should sound natural and clear

curl -X POST http://localhost:8085/ivas/synthesize \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello", "emotion": "neutral"}' \
  --output test.wav
# Expected: Valid WAV file generated
```

### Files to Modify:
- [services/python/ivas/requirements.txt](services/python/ivas/requirements.txt)
- [services/python/ivas/services.py](services/python/ivas/services.py)

---

## 🎯 STEP 7: Implement Local LLM (Ollama + Llama 3.1)

### What to Do:

1. **Install Ollama locally:**
   ```bash
   # macOS
   brew install ollama
   
   # Or download from https://ollama.com/download
   ```

2. **Download and test Llama model:**
   ```bash
   ollama pull llama3.1:8b
   ollama run llama3.1:8b "Hello"
   ```

3. **Add to `requirements.txt`:**
   ```
   ollama==0.1.6
   ```

4. **Create `LLMService` class in `services.py`:**
   ```python
   import ollama
   
   class LLMService:
       def __init__(self, model="llama3.1:8b"):
           self.model = model
           self.client = ollama.Client()
       
       def generate_question(self, context: dict, history: list) -> str:
           # Use Socratic prompt to generate question
           pass
       
       def assess_response(self, question: str, response: str) -> dict:
           # Analyze student response, return assessment
           pass
   ```

5. **Create `prompts.py` with templates:**
   ```python
   SYSTEM_PROMPT = """You are a Socratic viva examiner..."""
   QUESTION_PROMPT = """Based on the student's code and previous responses..."""
   ASSESSMENT_PROMPT = """Evaluate the student's response..."""
   ```

### Success Check:
```bash
python test_llm.py
# Expected: Relevant programming question generated in <3 seconds

curl -X POST http://localhost:8085/ivas/generate-question \
  -H "Content-Type: application/json" \
  -d '{"code": "def add(a, b): return a + b", "topic": "Python functions"}'
# Expected: {"question": "Can you explain..."}
```

### Files to Modify/Create:
- [services/python/ivas/requirements.txt](services/python/ivas/requirements.txt)
- [services/python/ivas/services.py](services/python/ivas/services.py)
- [services/python/ivas/prompts.py](services/python/ivas/prompts.py)

---

## 🎯 STEP 8: Create WebSocket for Real-Time Voice Streaming

### What to Do:

1. **Add WebSocket support in FastAPI (`router.py`):**
   ```python
   from fastapi import WebSocket, WebSocketDisconnect
   
   @router.websocket("/ws/{session_id}")
   async def websocket_endpoint(websocket: WebSocket, session_id: str):
       await websocket.accept()
       try:
           while True:
               data = await websocket.receive_bytes()
               # Process: Audio → ASR → LLM → TTS → Send back
       except WebSocketDisconnect:
           pass
   ```

2. **Create `SessionManager` class:**
   ```python
   class SessionManager:
       def __init__(self):
           self.active_connections: dict[str, WebSocket] = {}
           self.conversation_history: dict[str, list] = {}
       
       async def connect(self, session_id: str, websocket: WebSocket):
           ...
       
       def disconnect(self, session_id: str):
           ...
   ```

3. **Implement message protocol:**
   ```json
   // Client → Server
   {"type": "audio_chunk", "data": "<base64>"}
   {"type": "end_turn", "data": null}
   
   // Server → Client
   {"type": "transcript", "data": "Student said..."}
   {"type": "ai_response", "data": "Can you explain..."}
   {"type": "ai_audio", "data": "<base64 wav>"}
   {"type": "session_end", "data": {"score": 85}}
   ```

4. **Add Spring Boot WebSocket endpoint (alternative):**
   - Configure `WebSocketConfig.java`
   - Create `VivaWebSocketHandler.java`
   - Proxy to Python AI service for processing

### Success Check:
```javascript
// Browser console test
const ws = new WebSocket("ws://localhost:8085/ivas/ws/test-session");
ws.onmessage = (e) => console.log(JSON.parse(e.data));
ws.send(JSON.stringify({type: "audio_chunk", data: "..."}));
// Expected: Receives transcript and ai_response messages
```

### Files to Create:
- [services/python/ivas/session_manager.py](services/python/ivas/session_manager.py)
- Update [services/python/ivas/router.py](services/python/ivas/router.py)

---

## 🎯 STEP 9: Connect Frontend to Backend APIs

### What to Do:

1. **Create API client in Next.js:**
   ```
   web/lib/api/ivas.ts
   ```
   ```typescript
   import axios from 'axios';
   
   const IVAS_API = process.env.NEXT_PUBLIC_IVAS_API_URL || 'http://localhost:8084';
   
   export const ivasApi = {
     startSession: (data: StartVivaRequest) => 
       axios.post(`${IVAS_API}/api/v1/viva/sessions`, data),
     
     getSession: (sessionId: string) =>
       axios.get(`${IVAS_API}/api/v1/viva/sessions/${sessionId}`),
     
     getDashboard: (assignmentId: string) =>
       axios.get(`${IVAS_API}/api/v1/viva/assignments/${assignmentId}/dashboard`),
   };
   ```

2. **Update existing student viva page:**
   ```
   web/app/(dashboard)/student/courses/[courseId]/assignments/[assignmentId]/viva/page.tsx
   ```
   - Replace mock data with API calls
   - Add React Query hooks for data fetching

3. **Update instructor viva dashboard:**
   ```
   web/app/(dashboard)/instructor/courses/[id]/assignments/[assignmentId]/viva/page.tsx
   ```
   - Replace mock data with API calls
   - Add real-time updates with React Query

4. **Add environment variables:**
   ```env
   # web/.env.local
   NEXT_PUBLIC_IVAS_API_URL=http://localhost:8084
   NEXT_PUBLIC_IVAS_WS_URL=ws://localhost:8085
   ```

### Success Check:
```bash
# Start all services
cd web && pnpm dev

# Navigate to viva page
# Expected: Real data from API displayed (or "no sessions" if empty)
# No console errors related to API calls
```

### Files to Create/Modify:
- [web/lib/api/ivas.ts](web/lib/api/ivas.ts)
- [web/hooks/use-ivas.ts](web/hooks/use-ivas.ts) (React Query hooks)
- Update existing viva pages

---

## 🎯 STEP 10: Build Voice Interface WebSocket Client

### What to Do:

1. **Create WebSocket service:**
   ```
   web/lib/services/ivas-websocket.ts
   ```
   ```typescript
   export class IvasWebSocket {
     private ws: WebSocket | null = null;
     
     connect(sessionId: string, callbacks: IvasCallbacks) {
       this.ws = new WebSocket(`${WS_URL}/ivas/ws/${sessionId}`);
       this.ws.onmessage = (event) => {
         const msg = JSON.parse(event.data);
         switch(msg.type) {
           case 'transcript': callbacks.onTranscript(msg.data); break;
           case 'ai_response': callbacks.onAiResponse(msg.data); break;
           case 'ai_audio': callbacks.onAiAudio(msg.data); break;
         }
       };
     }
     
     sendAudio(audioData: ArrayBuffer) {
       this.ws?.send(audioData);
     }
   }
   ```

2. **Create audio capture hook:**
   ```
   web/hooks/use-audio-capture.ts
   ```
   ```typescript
   export function useAudioCapture() {
     const [isRecording, setIsRecording] = useState(false);
     
     const startRecording = async () => {
       const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
       const mediaRecorder = new MediaRecorder(stream);
       // Capture chunks and send via WebSocket
     };
     
     return { isRecording, startRecording, stopRecording };
   }
   ```

3. **Update VoiceInterface component:**
   ```
   web/components/student/viva/session/VoiceInterface.tsx
   ```
   - Integrate real WebSocket connection
   - Add audio playback for AI responses
   - Handle connection states

4. **Create session page:**
   ```
   web/app/(dashboard)/student/courses/[courseId]/assignments/[assignmentId]/viva/session/page.tsx
   ```

### Success Check:
```
1. Navigate to viva session page
2. Click "Start Recording"
3. Speak into microphone
4. See transcript appear in real-time
5. Hear AI response audio
6. Conversation flows naturally
```

### Files to Create/Modify:
- [web/lib/services/ivas-websocket.ts](web/lib/services/ivas-websocket.ts)
- [web/hooks/use-audio-capture.ts](web/hooks/use-audio-capture.ts)
- [web/hooks/use-audio-playback.ts](web/hooks/use-audio-playback.ts)
- Update [web/components/student/viva/session/](web/components/student/viva/session/)

---

## 🎯 STEP 11: Implement Adaptive Assessment Logic

### What to Do:

1. **Create assessment engine in Python:**
   ```python
   # services/python/ivas/assessment.py
   
   class AdaptiveAssessmentEngine:
       def __init__(self):
           self.difficulty_score = 0  # -5 to +5
           self.question_count = 0
       
       def assess_response(self, question: str, response: str) -> dict:
           # Use LLM to assess
           assessment = llm.assess_response(question, response)
           
           # Adjust difficulty
           if assessment['clarity'] == 'clear':
               self.difficulty_score += 1
           elif assessment['clarity'] == 'confused':
               self.difficulty_score -= 1
           
           return {
               'understanding_level': assessment['level'],
               'next_difficulty': self._get_next_difficulty(),
               'has_misconception': assessment.get('misconception'),
           }
       
       def _get_next_difficulty(self) -> str:
           if self.difficulty_score > 3: return 'harder'
           if self.difficulty_score < -2: return 'easier'
           return 'same'
   ```

2. **Update LLM prompts for difficulty levels:**
   ```python
   # prompts.py
   DIFFICULTY_PROMPTS = {
       'easier': "Ask a simpler, more fundamental question...",
       'same': "Ask a follow-up question at the same level...",
       'harder': "Ask a more challenging question that goes deeper...",
   }
   ```

3. **Implement session end logic:**
   ```python
   def should_end_session(self) -> bool:
       return self.question_count >= 7 or self.session_duration > 600  # 10 min
   
   def generate_final_assessment(self, history: list) -> dict:
       # Use LLM to analyze full conversation
       return {
           'overall_score': 85,
           'competency_level': 'INTERMEDIATE',
           'misconceptions': [...],
           'strengths': [...],
           'weaknesses': [...],
       }
   ```

4. **Save assessment to Spring Boot backend:**
   - Call IVAS REST API to persist assessment
   - Update session status to COMPLETED

### Success Check:
```
1. Start a viva session
2. Answer first question clearly → Next question should be harder
3. Give confused answer → Next question should be easier
4. Complete 5-7 questions
5. Session ends automatically
6. View assessment with score, competency level, and analysis
```

### Files to Create:
- [services/python/ivas/assessment.py](services/python/ivas/assessment.py)
- Update [services/python/ivas/prompts.py](services/python/ivas/prompts.py)

---

## 🎯 STEP 12: Build Instructor Dashboard with Real Data

### What to Do:

1. **Update instructor dashboard page:**
   ```
   web/app/(dashboard)/instructor/courses/[id]/assignments/[assignmentId]/viva/page.tsx
   ```
   - Fetch real data from `/api/v1/viva/assignments/{id}/dashboard`
   - Display actual session statistics

2. **Create sessions list page:**
   ```
   web/app/(dashboard)/instructor/courses/[id]/assignments/[assignmentId]/viva/sessions/page.tsx
   ```
   - Table with: Student, Status, Score, Duration, Date
   - Filters: Status, Date Range, Score Range
   - Sorting and pagination

3. **Create session detail page:**
   ```
   web/app/(dashboard)/instructor/courses/[id]/assignments/[assignmentId]/viva/sessions/[sessionId]/page.tsx
   ```
   - Full conversation transcript
   - Assessment breakdown
   - Audio playback (optional)

4. **Create analytics page:**
   ```
   web/app/(dashboard)/instructor/courses/[id]/assignments/[assignmentId]/viva/analytics/page.tsx
   ```
   - Score distribution chart (using Recharts)
   - Competency level distribution
   - Common misconceptions list
   - Sessions over time

### Success Check:
```
1. Navigate to instructor viva dashboard
2. See real statistics (completed, in progress, etc.)
3. Click "View All Sessions"
4. See list of sessions with correct data
5. Click on a session to view details
6. See full conversation and assessment
7. Check analytics page shows charts correctly
```

### Files to Modify:
- [web/app/(dashboard)/instructor/courses/[id]/assignments/[assignmentId]/viva/page.tsx](web/app/(dashboard)/instructor/courses/[id]/assignments/[assignmentId]/viva/page.tsx)
- [web/app/(dashboard)/instructor/courses/[id]/assignments/[assignmentId]/viva/sessions/page.tsx](web/app/(dashboard)/instructor/courses/[id]/assignments/[assignmentId]/viva/sessions/page.tsx)
- [web/app/(dashboard)/instructor/courses/[id]/assignments/[assignmentId]/viva/analytics/page.tsx](web/app/(dashboard)/instructor/courses/[id]/assignments/[assignmentId]/viva/analytics/page.tsx)

---

## 🎯 STEP 13: Add Docker Configuration

### What to Do:

1. **Create IVAS AI services Dockerfile:**
   ```dockerfile
   # services/python/ivas/Dockerfile
   FROM python:3.11-slim
   
   WORKDIR /app
   COPY requirements.txt .
   RUN pip install --no-cache-dir -r requirements.txt
   
   COPY . .
   
   EXPOSE 8085
   CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8085"]
   ```

2. **Update `docker-compose.yml`:**
   ```yaml
   ivas:
     build:
       context: ../../services/python/ivas
       dockerfile: Dockerfile
     environment:
       OLLAMA_HOST: http://ollama:11434
     ports:
       - "8085:8085"
     depends_on:
       - ollama
     networks:
       - gradeloop-net
   
   ollama:
     image: ollama/ollama:latest
     ports:
       - "11434:11434"
     volumes:
       - ollama-data:/root/.ollama
     networks:
       - gradeloop-net
   ```

3. **Add Ollama model initialization script:**
   ```bash
   # scripts/init-ollama.sh
   #!/bin/bash
   docker exec gradeloop-ollama-1 ollama pull llama3.1:8b
   ```

4. **Test full stack with Docker:**
   ```bash
   cd infra/docker
   docker compose up -d
   
   # Wait for services to start
   sleep 30
   
   # Initialize Ollama model
   ./scripts/init-ollama.sh
   ```

### Success Check:
```bash
# All services running
docker compose ps
# Expected: All services "Up" and healthy

# Test IVAS health
curl http://localhost:8084/api/v1/viva/health
curl http://localhost:8085/health

# Test through Kong gateway
curl http://localhost:8000/ivas/api/v1/viva/health
```

### Files to Create/Modify:
- [services/python/ivas/Dockerfile](services/python/ivas/Dockerfile)
- Update [infra/docker/docker-compose.yml](infra/docker/docker-compose.yml)
- Update [infra/docker/kong.yml](infra/docker/kong.yml)

---

## 🎯 STEP 14: Testing & Error Handling

### What to Do:

1. **Add Spring Boot unit tests:**
   ```
   services/java/ivas/src/test/java/com/gradeloop/ivas/
   ├── controller/VivaControllerTest.java
   ├── service/VivaServiceTest.java
   └── repository/VivaSessionRepositoryTest.java
   ```

2. **Add Python unit tests:**
   ```
   services/python/ivas/tests/
   ├── test_asr.py
   ├── test_tts.py
   ├── test_llm.py
   └── test_websocket.py
   ```

3. **Add error handling:**
   - Spring Boot: `@ControllerAdvice` for global exception handling
   - FastAPI: Custom exception handlers
   - Frontend: Error boundaries and toast notifications

4. **Add logging:**
   - Spring Boot: Logback configuration
   - Python: Python logging module
   - Structured logs with correlation IDs

5. **Test edge cases:**
   - [ ] Empty audio (silence)
   - [ ] Very long audio (>30 seconds)
   - [ ] WebSocket disconnection
   - [ ] Ollama unavailable
   - [ ] Database connection lost

### Success Check:
```bash
# Run Spring Boot tests
cd services/java/ivas && ./mvnw test

# Run Python tests
cd services/python/ivas && pytest

# All tests pass
# No unhandled exceptions in logs
```

### Files to Create:
- Test files in both services
- [services/java/ivas/src/main/java/com/gradeloop/ivas/exception/](services/java/ivas/src/main/java/com/gradeloop/ivas/exception/)

---

## 🎯 STEP 15: Documentation & Cleanup

### What to Do:

1. **Create IVAS README:**
   ```
   services/java/ivas/README.md
   services/python/ivas/README.md
   ```

2. **Document API endpoints:**
   - Spring Boot: Swagger/OpenAPI at `/swagger-ui.html`
   - FastAPI: Auto-generated at `/docs`

3. **Create environment templates:**
   ```
   services/java/ivas/.env.example
   services/python/ivas/.env.example
   ```

4. **Update main architecture docs:**
   - Add IVAS to architecture diagram
   - Document service dependencies
   - Add troubleshooting section

5. **Clean up:**
   - Remove mock data from frontend
   - Remove test files from production
   - Add proper comments

### Success Check:
```
1. New developer can setup IVAS by following README
2. All APIs documented in Swagger/OpenAPI
3. No hardcoded credentials in code
4. All environment variables documented
```

---

## 📊 Summary Table

| Step | Focus Area | Backend | Frontend | Est. Time |
|------|------------|---------|----------|-----------|
| 1 | Spring Boot Setup | ✅ | - | 2h |
| 2 | Database Models | ✅ | - | 3h |
| 3 | REST APIs | ✅ | - | 4h |
| 4 | FastAPI Setup | ✅ | - | 2h |
| 5 | ASR (Whisper) | ✅ | - | 3h |
| 6 | TTS (Coqui) | ✅ | - | 3h |
| 7 | LLM (Ollama) | ✅ | - | 4h |
| 8 | WebSocket Backend | ✅ | - | 5h |
| 9 | Frontend API Client | - | ✅ | 3h |
| 10 | Voice Interface | - | ✅ | 6h |
| 11 | Adaptive Logic | ✅ | - | 5h |
| 12 | Instructor Dashboard | - | ✅ | 6h |
| 13 | Docker Config | ✅ | - | 3h |
| 14 | Testing | ✅ | ✅ | 6h |
| 15 | Documentation | ✅ | ✅ | 3h |
| **Total** | | | | **~58h** |

---

## 🚀 Quick Reference Commands

```bash
# Start all infrastructure
cd infra/docker && docker compose up -d

# Start IVAS Spring Boot
cd services/java/ivas && ./mvnw spring-boot:run

# Start IVAS AI Services
cd services/python/ivas && uvicorn main:app --reload --port 8085

# Start Frontend
cd web && pnpm dev

# Start Ollama (local)
ollama serve

# Run tests
cd services/java/ivas && ./mvnw test
cd services/python/ivas && pytest
cd web && pnpm test
```

---

## 💡 Important Notes

1. **Follow steps in order** - each builds on previous
2. **Test after each step** - don't skip success checks
3. **Commit frequently** - one commit per step
4. **Keep services isolated** - don't modify other services
5. **Use environment variables** - no hardcoded secrets
6. **Document as you go** - update README with each change

---

## 🔗 Related Files

| File | Purpose |
|------|---------|
| [infra/docker/docker-compose.yml](infra/docker/docker-compose.yml) | Docker services config |
| [infra/docker/kong.yml](infra/docker/kong.yml) | API Gateway routes |
| [api-collections/IVAS/](api-collections/IVAS/) | Bruno API collection |
| [web/components/student/viva/](web/components/student/viva/) | Student viva components |
| [web/app/(dashboard)/instructor/.../viva/](web/app/(dashboard)/instructor/courses/[id]/assignments/[assignmentId]/viva/) | Instructor viva pages |
