# IVAS Implementation - Complete Step-by-Step Guide

> **Last Updated:** January 6, 2026  
> **Current Status:** Self-Contained MVP Approach - Phase 2 In Progress

---

## 📊 Overall Progress

| Phase | Status | Priority | Notes |
|-------|--------|----------|-------|
| **Phase 1: Foundation** | ✅ Complete | - | Database, models, basic controllers |
| **Phase 2: Question Management** | 🟡 In Progress | Critical | Hardcoded questions, session flow |
| **Phase 3: WebSocket** | 🔴 Pending | Critical | Real-time communication |
| **Phase 4: Audio Processing** | 🔴 Pending | Critical | Speech-to-text, text-to-speech |
| **Phase 5: Python AI Service** | 🟠 Optional | Medium | AI grading (can mock initially) |
| **Phase 6: Complete Integration** | ⏳ Pending | High | End-to-end viva flow |
| **Phase 7: Testing & Polish** | ⏳ Pending | High | Production ready |

---

## 🎯 Architecture Decision: Self-Contained IVAS

**Key Change:** IVAS is now **100% independent** - no external service dependencies.

### Why This Approach?
- ✅ User/Institute services not ready → hardcode demo data
- ✅ Focus on core viva functionality first
- ✅ Can integrate with real services later
- ✅ Faster development and testing

---

## 🎯 What Works Now

### ✅ Backend (Java/Spring Boot)
- ✅ IVAS service running on port 8084
- ✅ 9 database models (VivaSession, VivaConfiguration, etc.)
- ✅ All JPA repositories with custom queries
- ✅ 4 REST controllers with 10+ endpoints
- ✅ QuestionManagementService with 5 hardcoded questions ⭐ NEW
- ✅ Session scoring and grading logic ⭐ NEW
- ✅ Security configuration with JWT
- ✅ PostgreSQL database schema

### ✅ Frontend (Next.js/React)
- ✅ Student pages (landing, session, results)
- ✅ Instructor pages (dashboard, configure, rubric, analytics)
- ✅ All React components (VoiceInterface, QuestionDisplay, etc.)
- ✅ UI working with mock data
- ✅ Timer, state management, question display

### 🟡 Partially Complete
- 🟡 Session flow - has start/end, **needs question fetching & answer submission**
- 🟡 Frontend integration - UI ready, **needs API connection**

### 🔴 Critical Missing Components
- 🔴 WebSocket handler (empty directory) - **MUST HAVE for voice**
- 🔴 Audio processing (speech recognition, TTS)
- 🔴 Frontend API integration (connect to backend endpoints)
- 🔴 Real-time question delivery
- 🔴 Results page backend integration

---

## 🔥 Current Implementation Status

### ✅ Just Completed (Phase 2 - Question Management)

**New Files Created:**
1. `QuestionManagementService.java` - Manages hardcoded questions, tracks responses
2. `QuestionResponse.java` - DTO for question data
3. Updated `VivaSessionController.java` - Added 3 new endpoints:
   - GET `/sessions/{id}/questions/next` - Fetch next question
   - POST `/sessions/{id}/questions/{qid}/answer` - Submit answer
   - GET `/sessions/{id}/questions` - Get all session questions

**New Features:**
- ✅ 5 demo questions with code snippets
- ✅ Sequential question delivery
- ✅ Demo scoring algorithm (length + keywords)
- ✅ Final score calculation on session end
- ✅ Pass/Fail determination based on threshold
- ✅ Mock student/assignment data

**Backend Endpoints Now Working:**

Create FastAPI service for AI/ML operations:

```bash
services/python/ivas-ai/
├── app/
│   ├── main.py                    # FastAPI app
│   ├── api/
│   │   ├── stt.py                # Speech-to-Text (Whisper)
│   │   ├── tts.py                # Text-to-Speech (OpenAI)
│   │   ├── nlp.py                # Response evaluation (GPT-4)
│   │   └── irt.py                # Adaptive questions (PyIRT)
│   └── services/
```
| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/sessions/start` | POST | Start new session | ✅ Working |
| `/sessions/{id}` | GET | Get session details | ✅ Working |
| `/sessions/{id}/end` | POST | End session & calculate score | ✅ Working |
| `/sessions/{id}/questions/next` | GET | Get next question | ✅ NEW |
| `/sessions/{id}/questions/{qid}/answer` | POST | Submit answer | ✅ NEW |
| `/sessions/{id}/questions` | GET | Get all questions | ✅ NEW |
| `/sessions/{id}/flag` | POST | Flag session for review | ✅ Working |
| `/sessions/{id}/review` | POST | Instructor review | ✅ Working |
| `/configurations` | POST/GET/PUT | Manage config | ✅ Working |
| `/rubrics` | POST/GET | Manage rubrics | ✅ Working |

---

## 🚀 Next Steps (Priority Order)

### **STEP 1: Test Question Flow** 🔴 DO NOW
**Duration:** 1-2 hours | **Priority:** Immediate

Test the new question endpoints:
```bash
# 1. Start IVAS service
cd services/java/ivas
./mvnw spring-boot:run

# 2. Test endpoints
# Start session
curl -X POST "http://localhost:8084/api/v1/viva/sessions/start?assignmentId=123e4567-e89b-12d3-a456-426614174000" \
  -H "X-User-Id: 1"

# Get first question
curl http://localhost:8084/api/v1/viva/sessions/{SESSION_ID}/questions/next

# Submit answer
curl -X POST http://localhost:8084/api/v1/viva/sessions/{SESSION_ID}/questions/{QUESTION_ID}/answer \
  -H "Content-Type: application/json" \
  -d '{"responseText": "Recursion has a base case and recursive case..."}'

# Get next question (repeat 5 times)
# End session (scores calculated automatically)
curl -X POST http://localhost:8084/api/v1/viva/sessions/{SESSION_ID}/end
```

---

### **STEP 2: Frontend Integration** 🔴 CRITICAL
**Duration:** 1-2 days | **Priority:** Critical

Connect frontend session page to backend APIs:

**Files to Update:**
```typescript
// web/app/(dashboard)/student/.../viva/session/page.tsx

1. Remove mock questions array
2. Call API on mount: GET /sessions/{id}/questions/next
3. On answer submit: POST /sessions/{id}/questions/{qid}/answer
4. Fetch next question after submit
5. End session when no more questions
6. Redirect to results page

// web/api/ (create new API route)
- Create /api/viva/sessions/... proxy routes if needed
```

**Key Changes:**
```typescript
// Replace this mock:
const questions = [hardcoded...]

// With this:
const { data: question } = useSWR(
  `/api/v1/viva/sessions/${sessionId}/questions/next`,
  fetcher
)

// On submit:
await fetch(`/api/v1/viva/sessions/${sessionId}/questions/${question.id}/answer`, {
  method: 'POST',
  body: JSON.stringify({ responseText: transcript })
})
```

---

### **STEP 3: WebSocket Implementation** 🔴 CRITICAL
**Duration:** 3-4 days | **Priority:** Critical

Enable real-time communication for voice:

**Backend Files to Create:**
```java
services/java/ivas/src/main/java/com/gradeloop/ivas/
├── websocket/
│   ├── VivaWebSocketHandler.java      // Handle WS messages
│   ├── WebSocketSessionManager.java   // Track connections
│   └── dto/
│       ├── WebSocketMessage.java      // Base message
│       ├── AudioChunkMessage.java     // Audio data
│       ├── TranscriptMessage.java     // Text data
│       └── QuestionMessage.java       // Question push
├── config/
│   └── WebSocketConfig.java           // WS configuration
```

**Frontend Files to Create:**
```typescript
web/hooks/
├── use-viva-websocket.ts   // WebSocket hook
└── use-audio-recorder.ts   // Audio recording hook
```

**WebSocket Protocol:**
```json
// Client → Server (audio chunk)
{
  "type": "AUDIO_CHUNK",
  "sessionId": "uuid",
  "data": "base64_audio_data",
  "timestamp": 1234567890
}

// Server → Client (transcription)
{
  "type": "TRANSCRIPT",
  "text": "Student said...",
  "isFinal": true
}

// Server → Client (new question)
{
  "type": "QUESTION",
  "id": "uuid",
  "text": "Explain recursion...",
  "codeSnippet": "def factorial..."
}
```

**Endpoint:** `ws://localhost:8084/ws/viva/sessions/{sessionId}`

---

### **STEP 4: Audio Processing** 🔴 CRITICAL
**Duration:** 3-4 days | **Priority:** Critical

**Option 1: Browser-based (Simple, Works Now)**
```typescript
// Use Web Speech API (Chrome/Edge only)
const recognition = new webkitSpeechRecognition()
recognition.onresult = (event) => {
  const transcript = event.results[0][0].transcript
  // Send to backend
}
```

**Option 2: Python Service (Production Quality)**
```python
# services/python/ivas-ai/
services/

**Status:** Frontend fully designed and ready for backend integration

---

## 🔴 PHASE 2: Service Integration (START HERE)

### Priority: CRITICAL | Duration: 2-3 days

**Goal:** Connect IVAS with User and Institute services

### Files to Create:

```
services/java/ivas/src/main/java/com/gradeloop/ivas/
├── client/
│   ├── user/
│   │   ├── UserServiceClient.java          🔴 CREATE
│   │   └── dto/
│   │       ├── StudentDTO.java             🔴 CREATE
│   │       └── InstructorDTO.java          🔴 CREATE
│   └── institute/
│       ├── InstituteServiceClient.java     🔴 CREATE
│       └── dto/
│           ├── AssignmentDTO.java          🔴 CREATE
│           └── CourseDTO.java              🔴 CREATE
└── config/
    └── RestClientConfig.java               🔴 CREATE
```

### Implementation Steps:

#### Step 1: Create REST Client Configuration
```java
// RestClientConfig.java
@Configuration
public class RestClientConfig {
    @Value("${user.service.url}")
    private String userServiceUrl;
    
    @Value("${institute.service.url}")
    private String instituteServiceUrl;
    
    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}
```

#### Step 2: Create UserServiceClient
```java
// UserServiceClient.java
@Service
public class UserServiceClient {
    private final RestTemplate restTemplate;
    private final String userServiceUrl;
    
    public StudentDTO getStudent(Long studentId) {
        String url = userServiceUrl + "/api/v1/students/" + studentId;
        return restTemplate.getForObject(url, StudentDTO.class);
    }
    
    public InstructorDTO getInstructor(Long instructorId) {
        String url = userServiceUrl + "/api/v1/instructors/" + instructorId;
        return restTemplate.getForObject(url, InstructorDTO.class);
    }
}
```

#### Step 3: Create InstituteServiceClient
```java
// InstituteServiceClient.java
@Service
public class InstituteServiceClient {
    private final RestTemplate restTemplate;
    private final String instituteServiceUrl;
    
    public AssignmentDTO getAssignment(UUID assignmentId) {
        String url = instituteServiceUrl + "/api/v1/assignments/" + assignmentId;
        return restTemplate.getForObject(url, AssignmentDTO.class);
    }
    
    public CourseDTO getCourse(UUID courseId) {
        String url = instituteServiceUrl + "/api/v1/courses/" + courseId;
        return restTemplate.getForObject(url, CourseDTO.class);
    }
}
```

#### Step 4: Update VivaSessionService
```java
// Add to VivaSessionService.java
private final UserServiceClient userClient;
private final InstituteServiceClient instituteClient;

public VivaSession startSession(UUID assignmentId, Long studentId) {
    // Fetch student details
    StudentDTO student = userClient.getStudent(studentId);
    
    // Fetch assignment details
    AssignmentDTO assignment = instituteClient.getAssignment(assignmentId);
    
    // Continue with session creation...
}
```

#### Step 5: Update application.properties
```properties
user.service.url=http://localhost:8082
institute.service.url=http://localhost:8083
```

**Testing:**
1. Start User Service (port 8082)
2. Start Institute Service (port 8083)
3. Start IVAS Service (port 8084)
4. Test session creation - should fetch student/assignment data

---

## 🔴 PHASE 3: WebSocket Implementation

### Priority: CRITICAL | Duration: 4-5 days

**Goal:** Enable real-time bidirectional communication for audio streaming

### Files to Create:

```
services/java/ivas/src/main/java/com/gradeloop/ivas/
├── websocket/
│   ├── VivaWebSocketHandler.java          🔴 CREATE
│   ├── WebSocketSessionManager.java       🔴 CREATE
│   └── dto/
│       ├── WebSocketMessage.java          🔴 CREATE
│       └── MessageType.java               🔴 CREATE
└── config/
    └── WebSocketConfig.java               🔴 CREATE
```

### Implementation Steps:

#### Step 1: Create WebSocket Configuration
```java
// WebSocketConfig.java
@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {
    
    @Autowired
    private VivaWebSocketHandler vivaWebSocketHandler;
    
    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(vivaWebSocketHandler, "/ws/viva/sessions/{sessionId}")
                .setAllowedOrigins("*");
    }
}
    protected void handleTextMessage(WebSocketSession session, TextMessage message);
    
    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception);
    
    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status);
    
    // Custom methods:
    public void sendQuestion(WebSocketSession session, QuestionResponse question);
    public void sendTranscription(WebSocketSession session, String text);
    public void sendAudioData(WebSocketSession session, byte[] audioData);
    public void broadcastToInstructor(Long sessionId, String message);
}
```

#### Implementation Steps:
1. **Set up WebSocket configuration**
   ```java
   @Configuration
   @EnableWebSocket
   public class WebSocketConfig implements WebSocketConfigurer {
       @Override
       public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
           registry.addHandler(vivaWebSocketHandler, "/ws/viva/sessions/{sessionId}")
                   .setAllowedOrigins("*");
       }
   }
   ```

2. **Implement message handlers**
   - Audio chunk reception
   - Question request handling
   - Transcription forwarding
   - Session control messages

3. **Add session management**
   - Track active WebSocket sessions
   - Handle reconnection logic
   - Implement heartbeat/ping-pong

4. **Frontend WebSocket client**
   ```typescript
   // web/hooks/use-viva-websocket.ts
   export function useVivaWebSocket(sessionId: string) {
       const [socket, setSocket] = useState<WebSocket | null>(null);
       const [isConnected, setIsConnected] = useState(false);
       
       const connect = () => {
           const ws = new WebSocket(`ws://localhost:8080/ws/viva/sessions/${sessionId}`);
           ws.onopen = () => setIsConnected(true);
           ws.onmessage = handleMessage;
           ws.onerror = handleError;
           ws.onclose = handleClose;
           setSocket(ws);
       };
       
       const sendAudio = (audioChunk: Blob) => {
           socket?.send(audioChunk);
       };
       
       return { connect, sendAudio, isConnected };
   }
   ```

#### Message Protocol:
```typescript
// Message Types
interface WebSocketMessage {
    type: 'AUDIO_CHUNK' | 'QUESTION_REQUEST' | 'TRANSCRIPTION' | 'QUESTION' | 'CONTROL';
    sessionId: string;
    timestamp: number;
    payload: any;
}

// Examples:
// Client -> Server (Audio)
{ type: 'AUDIO_CHUNK', sessionId: '123', timestamp: 1234567890, payload: <blob> }

// Server -> Client (Question)
{ type: 'QUESTION', sessionId: '123', timestamp: 1234567890, payload: { id: 1, text: '...', code: '...' } }

// Server -> Client (Transcription)
{ type: 'TRANSCRIPTION', sessionId: '123', timestamp: 1234567890, payload: { text: '...', isFinal: true } }
```

---

### 2.3 Audio Processing Service [HIGH PRIORITY]
**Priority:** CRITICAL | **Estimated Time:** 3-4 days

#### What to Build:
```java
// services/java/ivas/src/main/java/com/gradeloop/ivas/service/AudioProcessingService.java

@Service
public class AudioProcessingService {
    
    public void receiveAudioChunk(Long sessionId, byte[] audioData, int sequence);
    public void assembleAudioChunks(Long sessionId);
    public String saveAudioRecording(Long sessionId, byte[] audioData);
    public byte[] retrieveAudioRecording(Long sessionId);
    public void queueForTranscription(Long sessionId, byte[] audioChunk);
    public void cleanupOldRecordings();
}
```

#### Implementation Steps:
1. **Audio chunk buffering**
   - Receive audio chunks from WebSocket
   - Buffer in memory with sequence numbers
   - Handle out-of-order chunks
   
2. **Audio storage**
   - Save to filesystem or S3
   - Generate unique filenames
   - Track file paths in database
   
3. **Transcription queue**
   - Send audio to Python AI service
   - Handle async responses
   - Update database with transcriptions

4. **Frontend audio capture**
   ```typescript
   // web/hooks/use-audio-recorder.ts
   export function useAudioRecorder(onAudioChunk: (chunk: Blob) => void) {
       const [isRecording, setIsRecording] = useState(false);
       const mediaRecorder = useRef<MediaRecorder | null>(null);
       
       const startRecording = async () => {
           const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
           const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
           
           recorder.ondataavailable = (event) => {
               if (event.data.size > 0) {
                   onAudioChunk(event.data);
               }
           };
           
           recorder.start(1000); // Send chunk every 1 second
           mediaRecorder.current = recorder;
           setIsRecording(true);
       };
       
       const stopRecording = () => {
           mediaRecorder.current?.stop();
           setIsRecording(false);
       };
       
       return { startRecording, stopRecording, isRecording };
   }
   ```

---

## 🤖 PHASE 3: AI/ML Services (Python) [HIGH PRIORITY]

### 3.1 Python FastAPI Setup
**Priority:** CRITICAL | **Estimated Time:** 2-3 days

#### Directory Structure to Create:
```
services/python/ivas-ai/
├── main.py
├── requirements.txt
├── Dockerfile
├── .env
├── app/
│   ├── __init__.py
│   ├── api/
│   │   ├── __init__.py
│   │   ├── stt.py          # Speech-to-Text endpoints
│   │   ├── tts.py          # Text-to-Speech endpoints
│   │   ├── nlp.py          # NLP evaluation endpoints
│   │   └── irt.py          # IRT algorithm endpoints
│   ├── services/
│   │   ├── __init__.py
│   │   ├── whisper_service.py
│   │   ├── openai_service.py
│   │   ├── nlp_service.py
│   │   └── irt_service.py
│   ├── models/
│   │   ├── __init__.py
│   │   └── schemas.py
│   └── config.py
└── tests/
```

#### Implementation Steps:
1. **Create FastAPI application**
   ```python
   # services/python/ivas-ai/main.py
   from fastapi import FastAPI
   from fastapi.middleware.cors import CORSMiddleware
   from app.api import stt, tts, nlp, irt
   
   app = FastAPI(title="IVAS AI Service", version="1.0.0")
   
   app.add_middleware(
       CORSMiddleware,
       allow_origins=["*"],
       allow_credentials=True,
       allow_methods=["*"],
       allow_headers=["*"],
   )
   
   app.include_router(stt.router, prefix="/api/stt", tags=["Speech-to-Text"])
   app.include_router(tts.router, prefix="/api/tts", tags=["Text-to-Speech"])
   app.include_router(nlp.router, prefix="/api/nlp", tags=["NLP"])
   app.include_router(irt.router, prefix="/api/irt", tags=["IRT"])
   ```

2. **Install dependencies**
   ```txt
   # requirements.txt
   fastapi==0.104.1
   uvicorn==0.24.0
   openai==1.3.5
   openai-whisper==20231117
   torch==2.1.0
   transformers==4.35.2
   langchain==0.0.340
   pyirt==0.4.0
   nltk==3.8.1
   spacy==3.7.2
   numpy==1.24.3
   pandas==2.0.3
   pydantic==2.5.0
   python-multipart==0.0.6
   aiohttp==3.9.1
   ```

---

### 3.2 Speech-to-Text Service
**Priority:** CRITICAL | **Estimated Time:** 3-4 days

#### Implementation:
```python
# services/python/ivas-ai/app/services/whisper_service.py

import whisper
from typing import Optional
import torch

class WhisperService:
    def __init__(self, model_size: str = "base"):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model = whisper.load_model(model_size).to(self.device)
    
    async def transcribe_audio(
        self, 
        audio_path: str,
        language: str = "en"
    ) -> dict:
        """Transcribe audio file to text"""
        result = self.model.transcribe(
            audio_path,
            language=language,
            task="transcribe",
            fp16=False if self.device == "cpu" else True
        )
        
        return {
            "text": result["text"],
            "segments": [
                {
                    "text": seg["text"],
                    "start": seg["start"],
                    "end": seg["end"]
                }
                for seg in result["segments"]
            ],
            "language": result["language"]
        }
    
    async def transcribe_realtime(self, audio_chunk: bytes) -> dict:
        """Transcribe audio chunk in real-time"""
        # Save temp file
        temp_path = f"/tmp/audio_chunk_{id(audio_chunk)}.webm"
        with open(temp_path, "wb") as f:
            f.write(audio_chunk)
        
        result = await self.transcribe_audio(temp_path)
        
        # Cleanup
        import os
        os.remove(temp_path)
        
        return result
```

```python
# services/python/ivas-ai/app/api/stt.py

from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.whisper_service import WhisperService

router = APIRouter()
whisper_service = WhisperService(model_size="base")

@router.post("/transcribe")
async def transcribe_audio(audio: UploadFile = File(...)):
    """Transcribe uploaded audio file"""
    try:
        content = await audio.read()
        result = await whisper_service.transcribe_realtime(content)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/transcribe-chunk")
async def transcribe_chunk(audio_chunk: bytes):
    """Transcribe real-time audio chunk"""
    try:
        result = await whisper_service.transcribe_realtime(audio_chunk)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

---

### 3.3 Text-to-Speech Service
**Priority:** HIGH | **Estimated Time:** 2-3 days

#### Implementation:
```python
# services/python/ivas-ai/app/services/openai_service.py

from openai import OpenAI
from typing import Literal
import os

class OpenAIService:
    def __init__(self):
        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    
    async def text_to_speech(
        self,
        text: str,
        voice: Literal["alloy", "echo", "fable", "onyx", "nova", "shimmer"] = "alloy",
        speed: float = 1.0
    ) -> bytes:
        """Convert text to speech using OpenAI TTS"""
        response = self.client.audio.speech.create(
            model="tts-1",
            voice=voice,
            input=text,
            speed=speed
        )
        
        return response.content
```

```python
# services/python/ivas-ai/app/api/tts.py

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from app.services.openai_service import OpenAIService
import io

router = APIRouter()
openai_service = OpenAIService()

class TTSRequest(BaseModel):
    text: str
    voice: str = "alloy"
    speed: float = 1.0

@router.post("/synthesize")
async def synthesize_speech(request: TTSRequest):
    """Convert text to speech"""
    try:
        audio_bytes = await openai_service.text_to_speech(
            text=request.text,
            voice=request.voice,
            speed=request.speed
        )
        
        return StreamingResponse(
            io.BytesIO(audio_bytes),
            media_type="audio/mpeg"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

---

### 3.4 NLP Response Evaluation Service
**Priority:** CRITICAL | **Estimated Time:** 5-6 days

#### Implementation:
```python
# services/python/ivas-ai/app/services/nlp_service.py

from transformers import pipeline
from openai import OpenAI
import spacy
from typing import List, Dict
import os

class NLPEvaluationService:
    def __init__(self):
        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.nlp = spacy.load("en_core_web_sm")
    
    async def evaluate_response(
        self,
        question: str,
        student_response: str,
        expected_concepts: List[str],
        misconceptions: List[Dict[str, str]],
        rubric_criteria: Dict[str, any]
    ) -> Dict:
        """
        Evaluate student response using GPT-4 and NLP
        """
        
        # Create evaluation prompt
        prompt = self._create_evaluation_prompt(
            question, 
            student_response, 
            expected_concepts,
            misconceptions,
            rubric_criteria
        )
        
        # Use GPT-4 for evaluation
        response = self.client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are an expert programming instructor evaluating student responses."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            response_format={"type": "json_object"}
        )
        
        evaluation = response.choices[0].message.content
        
        # Parse and enhance evaluation
        result = self._parse_evaluation(evaluation)
        
        # Detect concepts mentioned
        concepts_detected = self._detect_concepts(student_response, expected_concepts)
        
        # Detect misconceptions
        misconceptions_detected = self._detect_misconceptions(
            student_response, 
            misconceptions
        )
        
        return {
            "score": result["score"],
            "feedback": result["feedback"],
            "concepts_demonstrated": concepts_detected,
            "misconceptions_detected": misconceptions_detected,
            "competency_level": result["competency_level"],
            "strengths": result["strengths"],
            "weaknesses": result["weaknesses"]
        }
    
    def _create_evaluation_prompt(self, question, response, concepts, misconceptions, rubric):
        return f"""
        Evaluate the following student response to a programming question.
        
        **Question:** {question}
        
        **Student Response:** {response}
        
        **Expected Concepts:** {', '.join(concepts)}
        
        **Known Misconceptions to Check:**
        {self._format_misconceptions(misconceptions)}
        
        **Rubric Criteria:**
        {self._format_rubric(rubric)}
        
        Provide evaluation in JSON format:
        {{
            "score": <0-100>,
            "feedback": "<detailed feedback>",
            "competency_level": "<novice|intermediate|advanced|expert>",
            "strengths": ["<strength1>", "<strength2>"],
            "weaknesses": ["<weakness1>", "<weakness2>"]
        }}
        """
    
    def _detect_concepts(self, response: str, expected_concepts: List[str]) -> List[str]:
        """Detect which concepts were demonstrated"""
        doc = self.nlp(response.lower())
        detected = []
        
        for concept in expected_concepts:
            concept_lower = concept.lower()
            if concept_lower in response.lower():
                detected.append(concept)
        
        return detected
    
    def _detect_misconceptions(
        self, 
        response: str, 
        misconceptions: List[Dict[str, str]]
    ) -> List[Dict[str, any]]:
        """Detect misconceptions in response"""
        detected = []
        
        for misconception in misconceptions:
            keywords = misconception.get("detection_keywords", [])
            confidence = 0.0
            
            for keyword in keywords:
                if keyword.lower() in response.lower():
                    confidence += 1.0 / len(keywords)
            
            if confidence > 0.3:
                detected.append({
                    "name": misconception["name"],
                    "description": misconception["description"],
                    "confidence": round(confidence, 2)
                })
        
        return detected
```

```python
# services/python/ivas-ai/app/api/nlp.py

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict
from app.services.nlp_service import NLPEvaluationService

router = APIRouter()
nlp_service = NLPEvaluationService()

class EvaluationRequest(BaseModel):
    question: str
    student_response: str
    expected_concepts: List[str]
    misconceptions: List[Dict[str, any]]
    rubric_criteria: Dict[str, any]

@router.post("/evaluate")
async def evaluate_response(request: EvaluationRequest):
    """Evaluate student response"""
    try:
        result = await nlp_service.evaluate_response(
            question=request.question,
            student_response=request.student_response,
            expected_concepts=request.expected_concepts,
            misconceptions=request.misconceptions,
            rubric_criteria=request.rubric_criteria
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

---

### 3.5 IRT (Item Response Theory) Service
**Priority:** MEDIUM | **Estimated Time:** 4-5 days

#### Implementation:
```python
# services/python/ivas-ai/app/services/irt_service.py

import numpy as np
from pyirt import irt
from typing import List, Dict, Tuple

class IRTService:
    def __init__(self):
        self.min_questions = 3
        self.max_questions = 10
        self.confidence_threshold = 0.85
    
    def estimate_ability(
        self,
        responses: List[Dict[str, any]]
    ) -> Tuple[float, float]:
        """
        Estimate student ability using IRT
        
        Returns: (ability_estimate, standard_error)
        """
        if len(responses) == 0:
            return (0.0, 1.0)  # Neutral ability, high uncertainty
        
        # Extract response data
        correct = [r["score"] > 0.7 for r in responses]
        difficulties = [r["difficulty"] for r in responses]
        
        # Simple ability estimation (can be enhanced with pyirt)
        ability = self._calculate_ability(correct, difficulties)
        se = self._calculate_standard_error(len(responses))
        
        return (ability, se)
    
    def select_next_question(
        self,
        ability_estimate: float,
        available_questions: List[Dict[str, any]],
        asked_questions: List[int]
    ) -> Dict[str, any]:
        """
        Select next question based on current ability estimate
        """
        # Filter out already asked questions
        available = [
            q for q in available_questions 
            if q["id"] not in asked_questions
        ]
        
        if not available:
            return None
        
        # Find question with difficulty closest to ability
        best_question = min(
            available,
            key=lambda q: abs(q["difficulty"] - ability_estimate)
        )
        
        return best_question
    
    def should_terminate(
        self,
        num_questions: int,
        ability_estimate: float,
        standard_error: float
    ) -> bool:
        """
        Determine if assessment should terminate early
        """
        if num_questions < self.min_questions:
            return False
        
        if num_questions >= self.max_questions:
            return True
        
        # Terminate if confidence is high enough
        confidence = 1.0 - standard_error
        return confidence >= self.confidence_threshold
    
    def _calculate_ability(
        self, 
        correct: List[bool], 
        difficulties: List[float]
    ) -> float:
        """Simple ability calculation"""
        total_score = sum(1 if c else 0 for c in correct)
        avg_difficulty = np.mean(difficulties)
        
        # Adjust for difficulty
        ability = (total_score / len(correct)) * 2 - 1  # Scale to [-1, 1]
        ability += (avg_difficulty * 0.3)  # Bonus for harder questions
        
        return np.clip(ability, -3, 3)
    
    def _calculate_standard_error(self, num_responses: int) -> float:
        """Calculate standard error based on number of responses"""
        return 1.0 / np.sqrt(num_responses)
```

```python
# services/python/ivas-ai/app/api/irt.py

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict
from app.services.irt_service import IRTService

router = APIRouter()
irt_service = IRTService()

class AbilityEstimationRequest(BaseModel):
    responses: List[Dict[str, any]]

class NextQuestionRequest(BaseModel):
    ability_estimate: float
    available_questions: List[Dict[str, any]]
    asked_questions: List[int]

@router.post("/estimate-ability")
async def estimate_ability(request: AbilityEstimationRequest):
    """Estimate student ability"""
    try:
        ability, se = irt_service.estimate_ability(request.responses)
        return {
            "ability_estimate": ability,
            "standard_error": se,
            "confidence": 1.0 - se
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/next-question")
async def select_next_question(request: NextQuestionRequest):
    """Select next adaptive question"""
    try:
        question = irt_service.select_next_question(
            ability_estimate=request.ability_estimate,
            available_questions=request.available_questions,
            asked_questions=request.asked_questions
        )
        return {"question": question}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

---

## 🔗 PHASE 4: Integration & API Connections [HIGH PRIORITY]

### 4.1 Connect Spring Boot to Python AI Service
**Priority:** CRITICAL | **Estimated Time:** 2-3 days

#### Implementation:
```java
// services/java/ivas/src/main/java/com/gradeloop/ivas/client/IvasAIClient.java

@Service
public class IvasAIClient {
    
    private final RestTemplate restTemplate;
    private final String aiServiceUrl;
    
    public IvasAIClient(
        RestTemplateBuilder restTemplateBuilder,
        @Value("${ivas.ai.service.url}") String aiServiceUrl
    ) {
        this.restTemplate = restTemplateBuilder.build();
        this.aiServiceUrl = aiServiceUrl;
    }
    
    // Speech-to-Text
    public TranscriptionResponse transcribeAudio(byte[] audioData) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
        
        HttpEntity<byte[]> request = new HttpEntity<>(audioData, headers);
        
        return restTemplate.postForObject(
            aiServiceUrl + "/api/stt/transcribe-chunk",
            request,
            TranscriptionResponse.class
        );
    }
    
    // Text-to-Speech
    public byte[] synthesizeSpeech(String text, String voice, double speed) {
        TTSRequest request = new TTSRequest(text, voice, speed);
        
        ResponseEntity<byte[]> response = restTemplate.postForEntity(
            aiServiceUrl + "/api/tts/synthesize",
            request,
            byte[].class
        );
        
        return response.getBody();
    }
    
    // NLP Evaluation
    public EvaluationResponse evaluateResponse(
        String question,
        String studentResponse,
        List<String> concepts,
        List<MisconceptionDTO> misconceptions,
        Map<String, Object> rubric
    ) {
        EvaluationRequest request = new EvaluationRequest(
            question, studentResponse, concepts, misconceptions, rubric
        );
        
        return restTemplate.postForObject(
            aiServiceUrl + "/api/nlp/evaluate",
            request,
            EvaluationResponse.class
        );
    }
    
    // IRT
    public AbilityEstimate estimateAbility(List<QuestionResponse> responses) {
        AbilityEstimationRequest request = new AbilityEstimationRequest(responses);
        
        return restTemplate.postForObject(
            aiServiceUrl + "/api/irt/estimate-ability",
            request,
            AbilityEstimate.class
        );
    }
    
    public QuestionResponse selectNextQuestion(
        double abilityEstimate,
        List<QuestionTemplate> available,
        List<Long> asked
    ) {
        NextQuestionRequest request = new NextQuestionRequest(
            abilityEstimate, available, asked
        );
        
        return restTemplate.postForObject(
            aiServiceUrl + "/api/irt/next-question",
            request,
            QuestionResponse.class
        );
    }
}
```

#### Configuration:
```properties
# services/java/ivas/src/main/resources/application.properties

ivas.ai.service.url=http://localhost:8001
spring.http.client.connect-timeout=30000
spring.http.client.read-timeout=60000
```

---

### 4.2 Frontend API Integration
**Priority:** CRITICAL | **Estimated Time:** 3-4 days

#### Implementation:
```typescript
// web/lib/api/viva-service.ts

import { apiClient } from './axios';

export interface VivaSession {
    id: number;
    assignmentId: number;
    studentId: number;
    status: 'not_started' | 'in_progress' | 'completed';
    startedAt: string;
    completedAt?: string;
    timeSpent: number;
    overallScore?: number;
}

export interface Question {
    id: number;
    text: string;
    codeSnippet?: string;
    difficulty: string;
    conceptId: number;
}

class VivaService {
    // Session Management
    async startSession(assignmentId: number): Promise<VivaSession> {
        const response = await apiClient.post(`/api/v1/viva/sessions/start`, {
            assignmentId
        });
        return response.data;
    }
    
    async endSession(sessionId: number): Promise<void> {
        await apiClient.post(`/api/v1/viva/sessions/${sessionId}/end`);
    }
    
    async getSessionDetails(sessionId: number): Promise<VivaSession> {
        const response = await apiClient.get(`/api/v1/viva/sessions/${sessionId}`);
        return response.data;
    }
    
    // Configuration
    async getConfiguration(assignmentId: number) {
        const response = await apiClient.get(
            `/api/v1/viva/assignments/${assignmentId}/config`
        );
        return response.data;
    }
    
    async updateConfiguration(assignmentId: number, config: any) {
        const response = await apiClient.put(
            `/api/v1/viva/assignments/${assignmentId}/config`,
            config
        );
        return response.data;
    }
    
    // Rubric
    async getRubric(assignmentId: number) {
        const response = await apiClient.get(
            `/api/v1/viva/assignments/${assignmentId}/rubric`
        );
        return response.data;
    }
    
    async updateRubric(assignmentId: number, rubric: any) {
        const response = await apiClient.put(
            `/api/v1/viva/assignments/${assignmentId}/rubric`,
            rubric
        );
        return response.data;
    }
    
    // Dashboard
    async getDashboardStats(assignmentId: number) {
        const response = await apiClient.get(
            `/api/v1/viva/assignments/${assignmentId}/dashboard`
        );
        return response.data;
    }
    
    // Results
    async getSessionResults(sessionId: number) {
        const response = await apiClient.get(
            `/api/v1/viva/sessions/${sessionId}/results`
        );
        return response.data;
    }
    
    async getTranscript(sessionId: number) {
        const response = await apiClient.get(
            `/api/v1/viva/sessions/${sessionId}/transcript`
        );
        return response.data;
    }
}

export const vivaService = new VivaService();
```

---

## 🎬 PHASE 5: Live Session Flow Implementation [CRITICAL]

### 5.1 Complete Session Flow
**Priority:** CRITICAL | **Estimated Time:** 5-6 days

This is the MOST IMPORTANT part - the real-time interaction!

#### Backend Flow:
```java
// services/java/ivas/src/main/java/com/gradeloop/ivas/service/VivaSessionOrchestrator.java

@Service
public class VivaSessionOrchestrator {
    
    private final VivaSessionService sessionService;
    private final AudioProcessingService audioService;
    private final IvasAIClient aiClient;
    private final WebSocketHandler webSocketHandler;
    private final QuestionAdaptationService adaptationService;
    
    public void handleLiveSessionFlow(Long sessionId, WebSocketSession wsSession) {
        
        // 1. Initialize session
        VivaSession session = sessionService.startSession(sessionId);
        
        // 2. Get first question
        Question firstQuestion = adaptationService.getFirstQuestion(session);
        
        // 3. Generate TTS audio for question
        byte[] questionAudio = aiClient.synthesizeSpeech(
            firstQuestion.getText(),
            "alloy",
            1.0
        );
        
        // 4. Send question to student
        webSocketHandler.sendMessage(wsSession, new QuestionMessage(
            firstQuestion,
            questionAudio
        ));
        
        // 5. Wait for student response (handled in WebSocket)
        // Audio chunks received -> transcribed -> evaluated -> next question
    }
    
    public void handleAudioChunk(Long sessionId, byte[] audioChunk) {
        
        // 1. Save audio chunk
        audioService.receiveAudioChunk(sessionId, audioChunk);
        
        // 2. Send to AI for transcription
        TranscriptionResponse transcription = aiClient.transcribeAudio(audioChunk);
        
        // 3. Send transcription to frontend
        webSocketHandler.broadcastTranscription(sessionId, transcription);
        
        // 4. Check if response is complete
        if (transcription.isFinal()) {
            processCompleteResponse(sessionId, transcription.getText());
        }
    }
    
    private void processCompleteResponse(Long sessionId, String response) {
        
        VivaSession session = sessionService.getSession(sessionId);
        Question currentQuestion = session.getCurrentQuestion();
        
        // 1. Evaluate response with AI
        EvaluationResponse evaluation = aiClient.evaluateResponse(
            currentQuestion.getText(),
            response,
            currentQuestion.getExpectedConcepts(),
            session.getRubric().getMisconceptions(),
            session.getRubric().getCriteria()
        );
        
        // 2. Update session with score
        sessionService.addQuestionResponse(
            sessionId,
            currentQuestion.getId(),
            response,
            evaluation.getScore()
        );
        
        // 3. Update IRT ability estimate
        double newAbility = adaptationService.updateAbility(
            sessionId,
            evaluation.getScore(),
            currentQuestion.getDifficulty()
        );
        
        // 4. Check if should terminate
        if (adaptationService.shouldTerminate(session)) {
            finishSession(sessionId);
            return;
        }
        
        // 5. Get next question
        Question nextQuestion = adaptationService.selectNextQuestion(
            sessionId,
            newAbility
        );
        
        // 6. Generate TTS
        byte[] questionAudio = aiClient.synthesizeSpeech(
            nextQuestion.getText(),
            "alloy",
            1.0
        );
        
        // 7. Send next question
        webSocketHandler.broadcastQuestion(sessionId, nextQuestion, questionAudio);
    }
    
    private void finishSession(Long sessionId) {
        // Calculate final scores
        VivaSession session = sessionService.endSession(sessionId);
        
        // Broadcast completion
        webSocketHandler.broadcastSessionComplete(sessionId, session);
    }
}
```

#### Frontend Flow:
```typescript
// web/app/(dashboard)/student/.../viva/session/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useVivaWebSocket } from '@/hooks/use-viva-websocket';
import { useAudioRecorder } from '@/hooks/use-audio-recorder';
import { VoiceInterface } from '@/components/student/viva/session/VoiceInterface';
import { QuestionDisplay } from '@/components/student/viva/session/QuestionDisplay';

export default function SessionPage({ params }) {
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
    const [transcription, setTranscription] = useState<string>('');
    const [isAiSpeaking, setIsAiSpeaking] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState(900); // 15 minutes
    
    // WebSocket connection
    const { 
        connect, 
        sendAudio, 
        isConnected,
        messages 
    } = useVivaWebSocket(sessionId);
    
    // Audio recorder
    const { 
        startRecording, 
        stopRecording, 
        isRecording 
    } = useAudioRecorder((chunk) => {
        if (isConnected) {
            sendAudio(chunk);
        }
    });
    
    // Initialize session
    useEffect(() => {
        async function initSession() {
            // Start session via API
            const session = await vivaService.startSession(params.assignmentId);
            setSessionId(session.id.toString());
            
            // Connect WebSocket
            connect();
        }
        
        initSession();
    }, []);
    
    // Handle WebSocket messages
    useEffect(() => {
        messages.forEach((msg) => {
            switch (msg.type) {
                case 'QUESTION':
                    setCurrentQuestion(msg.payload);
                    setIsAiSpeaking(true);
                    playQuestionAudio(msg.payload.audio);
                    break;
                    
                case 'TRANSCRIPTION':
                    setTranscription(msg.payload.text);
                    break;
                    
                case 'SESSION_COMPLETE':
                    handleSessionComplete(msg.payload);
                    break;
            }
        });
    }, [messages]);
    
    function playQuestionAudio(audioData: ArrayBuffer) {
        const audio = new Audio();
        const blob = new Blob([audioData], { type: 'audio/mpeg' });
        audio.src = URL.createObjectURL(blob);
        
        audio.onended = () => {
            setIsAiSpeaking(false);
            startRecording(); // Student can now speak
        };
        
        audio.play();
    }
    
    function handleSessionComplete(data: any) {
        stopRecording();
        router.push(`/student/courses/${params.courseId}/assignments/${params.assignmentId}/viva/results`);
    }
    
    return (
        <div className="h-screen flex flex-col">
            <TopBar 
                timeRemaining={timeRemaining}
                onEnd={() => vivaService.endSession(sessionId)}
            />
            
            <div className="flex-1 flex">
                <div className="flex-1 p-6">
                    <QuestionDisplay question={currentQuestion} />
                    <VoiceInterface 
                        isAiSpeaking={isAiSpeaking}
                        isUserSpeaking={isRecording}
                        transcription={transcription}
                    />
                </div>
                
                <SessionSidebar sessionId={sessionId} />
            </div>
            
            <ControlBar 
                isRecording={isRecording}
                onStartRecording={startRecording}
                onStopRecording={stopRecording}
            />
        </div>
    );
}
```

---

## 📋 PHASE 6: Advanced Features [MEDIUM PRIORITY]

### 6.1 Practice Mode
**Priority:** MEDIUM | **Time:** 2-3 days
- ⏳ Create practice session API
- ⏳ Implement sample questions
- ⏳ Build feedback mechanism (no grading)

### 6.2 Trigger System
**Priority:** MEDIUM | **Time:** 3-4 days
- ⏳ CIPAS integration for automatic triggers
- ⏳ Manual instructor trigger
- ⏳ Eligibility checks
- ⏳ Notification system

### 6.3 Review & Override Features
**Priority:** MEDIUM | **Time:** 2-3 days
- ⏳ Manual score override
- ⏳ Flagging system
- ⏳ Retake permissions
- ⏳ Contest handling

---

## ✅ PHASE 7: Testing & Deployment [HIGH PRIORITY]

### 7.1 Testing
**Priority:** HIGH | **Time:** 5-7 days
- ⏳ Unit tests (80%+ coverage)
- ⏳ Integration tests
- ⏳ WebSocket stress tests
- ⏳ Audio pipeline tests
- ⏳ End-to-end flow tests
- ⏳ Load testing

### 7.2 Docker & Deployment
**Priority:** HIGH | **Time:** 3-4 days
- ⏳ Dockerize Spring Boot service
- ⏳ Dockerize Python AI service
- ⏳ Update docker-compose.yml
- ⏳ Environment configuration
- ⏳ Production deployment guide

---

## 🔧 Quick Setup Commands

### Start Development:
```bash
# Terminal 1: Start PostgreSQL
cd infra/docker
docker compose up -d postgres

# Terminal 2: Start Python AI Service
cd services/python/ivas-ai
pip install -r requirements.txt
uvicorn main:app --reload --port 8001

# Terminal 3: Start Spring Boot
cd services/java/ivas
./mvnw spring-boot:run

# Terminal 4: Start Frontend
cd web
pnpm dev
```

---

## 📊 Priority Matrix

### **DO FIRST (Critical Path):**
1. ✅ Session Management (basic) - DONE
2. 🚧 WebSocket Implementation - IN PROGRESS
3. 🚧 Audio Processing - IN PROGRESS
4. ⏳ Python AI Services Setup - START NOW
5. ⏳ STT Integration (Whisper) - START NOW
6. ⏳ NLP Evaluation (GPT-4) - START NOW
7. ⏳ Live Session Flow - AFTER AI SERVICES
8. ⏳ Frontend API Integration - PARALLEL WITH BACKEND

### **DO NEXT (Important):**
1. TTS Integration
2. IRT Implementation
3. Results & Grading
4. Instructor Review Features
5. Testing Suite

### **DO LATER (Enhancement):**
1. Practice Mode
2. Trigger System
3. Analytics Dashboard
4. Advanced IRT
5. Contest/Override Features

---

## 🎯 Current Focus: Next 3 Steps

### Step 1: Complete WebSocket (2-3 days) 🔥
- Implement Spring Boot WebSocket handler
- Create frontend WebSocket hook
- Test bidirectional communication
- **File:** `services/java/ivas/src/main/java/com/gradeloop/ivas/websocket/`

### Step 2: Setup Python AI Service (3-4 days) 🔥
- Create FastAPI project structure
- Implement STT with Whisper
- Implement TTS with OpenAI
- Basic NLP evaluation
- **Directory:** `services/python/ivas-ai/`

### Step 3: Connect Everything (3-4 days) 🔥
- Spring Boot -> Python AI client
- Frontend -> Backend API integration
- Test complete flow: Start → Question → Answer → Transcription → Evaluation
- **Files:** Multiple integration points

---

## 📝 Notes & Considerations

### Technical Decisions Made:
- ✅ Using Whisper for STT (open-source, accurate)
- ✅ Using OpenAI TTS (high quality)
- ✅ Using GPT-4 for NLP evaluation (best results)
- ✅ WebSocket for real-time communication
- ✅ Separate Python service for AI/ML

### Environment Variables Needed:
```bash
# Spring Boot
IVAS_AI_SERVICE_URL=http://localhost:8001
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/gradeloop
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=password

# Python AI Service
OPENAI_API_KEY=sk-...
WHISPER_MODEL_SIZE=base
HF_TOKEN=hf_...  # HuggingFace token

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_WS_URL=ws://localhost:8080
```

---

## 📚 Learning Resources

- [Spring WebSocket Docs](https://spring.io/guides/gs/messaging-stomp-websocket/)
- [OpenAI Whisper GitHub](https://github.com/openai/whisper)
- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [PyIRT Library](https://github.com/eribean/pyirt)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)

---

## Quick Reference Summary

### ✅ What's Done
1. ✅ **Database:** 9 models, all repositories
2. ✅ **Backend:** 5 services (including QuestionManagement), 4 controllers, all DTOs
3. ✅ **Frontend:** All student & instructor pages + components
4. ✅ **Security:** JWT integration with Auth service
5. ✅ **Question System:** 5 hardcoded questions with sequential delivery
6. ✅ **Scoring:** Demo scoring algorithm + pass/fail logic
7. ✅ **Session Flow:** Start, question serving, answer submission, end with scoring

### 🔴 What's Next (Priority Order)
1. **Test Question APIs** (1-2 hours) - Verify endpoints work
2. **Frontend Integration** (1-2 days) - Connect UI to backend
3. **WebSocket** (3-4 days) - Real-time communication
4. **Audio Processing** (3-4 days) - Voice recording & playback
5. **Polish** (2-3 days) - Results page, error handling

### 🚀 How to Start Development

```bash
# 1. Start PostgreSQL
cd infra/docker && docker compose up -d postgres

# 2. Start IVAS service (self-contained, no other services needed)
cd services/java/ivas && ./mvnw spring-boot:run       # Port 8084

# 3. Start frontend
cd web && pnpm dev                                     # Port 3000

# 4. Test endpoints
# Start session: POST /api/v1/viva/sessions/start?assignmentId=<UUID> -H "X-User-Id: 1"
# Get question: GET /api/v1/viva/sessions/{id}/questions/next
# Submit answer: POST /api/v1/viva/sessions/{id}/questions/{qid}/answer
# End session: POST /api/v1/viva/sessions/{id}/end
```

### 📊 MVP Success Criteria (Self-Contained)
- [x] Backend: Start/end session with mock data
- [x] Backend: Serve hardcoded questions sequentially
- [x] Backend: Accept and score answers
- [x] Backend: Calculate final score on session end
- [ ] Frontend: Connect to backend APIs (replace mocks)
- [ ] WebSocket: Real-time communication
- [ ] Audio: Record and playback (Web Speech API)
- [ ] Complete: Student can finish a full viva session

**Next Immediate Task:** Test the 3 new question endpoints manually with curl/Postman

**Timeline to Working MVP:** 1-2 weeks

---

**Last Updated:** January 6, 2026  
**Status:** Phase 2 (Question Management) Complete ✅ | Frontend Integration Next 🚀
**Approach:** Self-Contained with Mock Data - No External Dependencies
