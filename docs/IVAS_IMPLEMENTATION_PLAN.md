# IVAS (Interactive Video Assessment System) - Implementation Plan

## Executive Summary
IVAS is an AI-powered viva voce (oral exam) system that conducts automated voice-based assessments of students. This document provides a complete implementation plan including UI analysis, business logic, AI/ML models, and integration steps.

---

## 1. UI Components Analysis

### 1.1 Student-Facing UI

#### **A. Landing Page** (`/student/courses/[courseId]/assignments/[assignmentId]/viva`)
**What Happens:**
- Display viva status (not_started, in_progress, completed)
- Show assignment details and concepts tested
- System check widget (microphone/camera)
- Navigation to practice mode, session, and results

**Required Backend APIs:**
- `GET /api/v1/viva/assignments/{assignmentId}/status` - Get viva configuration and student status
- `GET /api/v1/viva/assignments/{assignmentId}/concepts` - Get concepts being tested

#### **B. Practice Mode** (`/student/.../viva/practice`)
**What Happens:**
- Diagnostics for camera/microphone
- Mock interview with sample questions
- No grading, just feedback for preparation

**Required Backend APIs:**
- `POST /api/v1/viva/practice/start` - Start practice session
- `GET /api/v1/viva/practice/questions` - Get random sample questions
- `POST /api/v1/viva/practice/feedback` - Submit practice response for feedback

#### **C. Live Session** (`/student/.../viva/session`)
**What Happens:**
- Real-time voice conversation with AI
- Timer countdown (e.g., 10-15 minutes)
- Question display with code snippets
- Voice interface showing AI speaking/student speaking states
- Real-time transcription
- Session history sidebar
- Adaptive questioning based on IRT (Item Response Theory)

**Required Backend APIs:**
- `POST /api/v1/viva/sessions/start` - Initialize session
- `WebSocket /ws/viva/sessions/{sessionId}` - Real-time bidirectional communication
- `POST /api/v1/viva/sessions/{sessionId}/audio` - Upload audio chunks
- `GET /api/v1/viva/sessions/{sessionId}/next-question` - Get next adaptive question
- `POST /api/v1/viva/sessions/{sessionId}/end` - Finalize session

#### **D. Results Page** (`/student/.../viva/results`)
**What Happens:**
- Overall score and grade
- Competency level (Novice/Intermediate/Advanced/Expert)
- Concept mastery breakdown with charts
- Strengths and weaknesses
- Detected misconceptions with explanations
- Full transcript with timestamps
- Instructor feedback
- Option to contest or request retake

**Required Backend APIs:**
- `GET /api/v1/viva/sessions/{sessionId}/results` - Get detailed results
- `GET /api/v1/viva/sessions/{sessionId}/transcript` - Get full transcript
- `POST /api/v1/viva/sessions/{sessionId}/contest` - Submit contest request

---

### 1.2 Instructor-Facing UI

#### **E. Viva Dashboard** (`/instructor/courses/[id]/assignments/[assignmentId]/viva`)
**What Happens:**
- Status overview (total students, completed, in progress, not started)
- Average scores and duration
- Pass rate and competency distribution
- Common misconceptions across all students
- Recent activity feed
- Configuration status (rubric, question bank, triggers)

**Required Backend APIs:**
- `GET /api/v1/viva/assignments/{assignmentId}/dashboard` - Get dashboard statistics
- `GET /api/v1/viva/assignments/{assignmentId}/activity` - Get recent activity

#### **F. Configuration Page** (`/instructor/.../viva/configure`)
**What Happens:**
- Enable/disable viva assessment
- Set weight in grade, passing threshold, max attempts, time limit
- Configure trigger settings (automatic via CIPAS, manual)
- Set question adaptation strategy (IRT, fixed difficulty, hybrid)
- Voice settings (TTS voice, speech speed, ASR sensitivity)
- Competency estimation parameters
- Student experience settings (practice mode, transcription visibility, pausing)
- Review and grading settings

**Required Backend APIs:**
- `GET /api/v1/viva/assignments/{assignmentId}/config` - Get current configuration
- `PUT /api/v1/viva/assignments/{assignmentId}/config` - Update configuration

#### **G. Rubric Editor** (`/instructor/.../viva/rubric`)
**What Happens:**
- Define concepts with weights
- Add sub-concepts and related code references
- Create questions for each concept with difficulty levels
- Define misconceptions with detection keywords
- Set grading criteria (novice/intermediate/advanced/expert)
- Import/export rubrics

**Required Backend APIs:**
- `GET /api/v1/viva/assignments/{assignmentId}/rubric` - Get rubric
- `PUT /api/v1/viva/assignments/{assignmentId}/rubric` - Update rubric
- `POST /api/v1/viva/rubrics/import` - Import rubric from file
- `GET /api/v1/viva/rubrics/{rubricId}/export` - Export rubric

#### **H. Session Review** (`/instructor/.../viva/sessions/[sessionId]`)
**What Happens:**
- View student information and previous attempts
- Overall assessment scores and IRT ability
- Concept mastery breakdown
- Full transcript with playback controls
- Detected misconceptions and confidence levels
- AI analysis of responses
- Manual override options
- Flag for review, grant retake
- Add additional feedback

**Required Backend APIs:**
- `GET /api/v1/viva/sessions/{sessionId}/details` - Get complete session data
- `GET /api/v1/viva/sessions/{sessionId}/audio` - Get audio recording
- `PUT /api/v1/viva/sessions/{sessionId}/override` - Manual score override
- `POST /api/v1/viva/sessions/{sessionId}/flag` - Flag for review
- `POST /api/v1/viva/sessions/{sessionId}/retake` - Grant retake permission
- `POST /api/v1/viva/sessions/{sessionId}/feedback` - Add manual feedback

#### **I. Analytics Page** (`/instructor/.../viva/analytics`)
**What Happens:**
- Question difficulty analysis
- Concept mastery trends
- Misconception patterns
- Time spent per concept
- Student performance comparisons

**Required Backend APIs:**
- `GET /api/v1/viva/assignments/{assignmentId}/analytics` - Get analytics data

---

## 2. Business Logic (Spring Boot Services)

### 2.1 Core Services

#### **VivaSessionService**
- Create and manage viva sessions
- Session state management (not_started, in_progress, completed, submitted)
- Timer management and early termination logic
- Session recording and logging

#### **QuestionAdaptationService**
- Implement IRT (Item Response Theory) algorithm
- Select next question based on current ability estimate
- Adjust question difficulty dynamically
- Early termination when confidence threshold reached

#### **AudioProcessingService**
- Receive audio chunks from WebSocket
- Queue audio for transcription
- Handle audio storage and retrieval
- Integrate with STT (Speech-to-Text) service

#### **TranscriptionService**
- Send audio to Python ML service for STT
- Receive transcriptions with timestamps
- Store transcript segments
- Real-time transcript updates via WebSocket

#### **ResponseEvaluationService**
- Send student response to Python ML service for NLP analysis
- Receive scores, detected concepts, misconceptions
- Update IRT ability estimate
- Calculate concept mastery scores

#### **GradingService**
- Aggregate scores across all questions
- Calculate final competency level
- Determine pass/fail based on threshold
- Generate strengths/weaknesses summary
- Apply rubric grading criteria

#### **RubricService**
- CRUD operations for rubrics
- Validate rubric structure
- Import/export functionality
- Version control for rubrics

#### **ConfigurationService**
- Manage assignment-level viva configuration
- Validate configuration parameters
- Apply default settings
- Configuration history tracking

#### **TriggerService**
- Monitor CIPAS scores for automatic triggering
- Handle manual instructor triggers
- Check eligibility for viva (submission status, attempts)
- Send notifications to students

#### **NotificationService**
- Send email/in-app notifications
- Viva availability alerts
- Results ready notifications
- Retake permission notifications

---

### 2.2 Data Models (Spring Boot Entities)

```java
@Entity
public class VivaConfiguration {
    private Long id;
    private Long assignmentId;
    private Boolean enabled;
    private Integer weight;
    private Integer passingThreshold;
    private Integer maxAttempts;
    private Integer timeLimit;
    private String triggerType; // "automatic", "manual"
    private Boolean cipasEnabled;
    private Integer cipasThreshold;
    private String adaptationStrategy; // "irt", "fixed", "hybrid"
    private String ttsVoice;
    private Double speechSpeed;
    private Double asrSensitivity;
    // ... more fields
}

@Entity
public class VivaSession {
    private Long id;
    private Long studentId;
    private Long assignmentId;
    private String status; // "in_progress", "completed", "submitted"
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private Integer timeSpent;
    private Double overallScore;
    private String competencyLevel;
    private Double irtAbility;
    private String passFail;
    private Boolean flagged;
    private String audioRecordingPath;
    // ... more fields
}

@Entity
public class VivaQuestion {
    private Long id;
    private Long sessionId;
    private Long conceptId;
    private String questionText;
    private String codeSnippet;
    private String difficulty; // "beginner", "intermediate", "advanced", "expert"
    private Integer sequence;
    private LocalDateTime askedAt;
    private String studentResponse;
    private Double responseScore;
    private Double irtDifficulty;
    private Integer timeSpent;
    // ... more fields
}

@Entity
public class VivaConcept {
    private Long id;
    private Long rubricId;
    private String name;
    private String description;
    private Integer weight;
    private List<String> subConcepts;
    private String relatedCode;
    // ... more fields
}

@Entity
public class VivaRubric {
    private Long id;
    private Long assignmentId;
    private String version;
    private LocalDateTime createdAt;
    private List<VivaConcept> concepts;
    private List<VivaQuestionTemplate> questionTemplates;
    private List<VivaMisconception> misconceptions;
    // ... more fields
}

@Entity
public class VivaQuestionTemplate {
    private Long id;
    private Long conceptId;
    private String questionText;
    private String difficulty;
    private Double irtDifficulty;
    private List<String> keywords;
    private String codeTemplate;
    // ... more fields
}

@Entity
public class VivaMisconception {
    private Long id;
    private Long conceptId;
    private String misconceptionText;
    private List<String> detectionKeywords;
    private String correction;
    private String resource;
    // ... more fields
}

@Entity
public class VivaTranscript {
    private Long id;
    private Long sessionId;
    private String speaker; // "AI", "Student"
    private String message;
    private String timestamp;
    private Double confidence;
    // ... more fields
}

@Entity
public class VivaConceptMastery {
    private Long id;
    private Long sessionId;
    private Long conceptId;
    private Double score;
    private Double mastery;
    private List<String> detectedMisconceptions;
    // ... more fields
}
```

---

### 2.3 REST Controllers

```java
@RestController
@RequestMapping("/api/v1/viva")
public class VivaController {
    // Session management
    POST   /sessions/start
    GET    /sessions/{sessionId}
    POST   /sessions/{sessionId}/end
    GET    /sessions/{sessionId}/results
    GET    /sessions/{sessionId}/transcript
    
    // Configuration
    GET    /assignments/{assignmentId}/config
    PUT    /assignments/{assignmentId}/config
    GET    /assignments/{assignmentId}/status
    
    // Rubric
    GET    /assignments/{assignmentId}/rubric
    PUT    /assignments/{assignmentId}/rubric
    POST   /rubrics/import
    GET    /rubrics/{rubricId}/export
    
    // Dashboard & Analytics
    GET    /assignments/{assignmentId}/dashboard
    GET    /assignments/{assignmentId}/analytics
    GET    /assignments/{assignmentId}/activity
    
    // Practice mode
    POST   /practice/start
    GET    /practice/questions
    POST   /practice/feedback
    
    // Instructor actions
    PUT    /sessions/{sessionId}/override
    POST   /sessions/{sessionId}/flag
    POST   /sessions/{sessionId}/retake
    POST   /sessions/{sessionId}/feedback
    
    // Student actions
    POST   /sessions/{sessionId}/contest
}
```

---

### 2.4 WebSocket Handler

```java
@Component
public class VivaWebSocketHandler extends TextWebSocketHandler {
    // Real-time bidirectional communication
    // - Receive audio chunks from client
    // - Send transcriptions to client
    // - Send AI responses (TTS audio or text)
    // - Send next questions
    // - Send status updates
}
```

---

## 3. Python AI/ML Services

### 3.1 Required Python Services

#### **Speech-to-Text Service (STT)**
**Technology:** OpenAI Whisper or Google Cloud Speech-to-Text
**Responsibilities:**
- Receive audio chunks from Spring Boot
- Transcribe audio to text with timestamps
- Return transcription with confidence scores
- Support real-time streaming transcription

**API Endpoints:**
```
POST /api/v1/stt/transcribe
POST /api/v1/stt/transcribe-stream (WebSocket)
```

#### **Natural Language Processing Service (NLP)**
**Technology:** HuggingFace Transformers, OpenAI GPT, or fine-tuned BERT
**Responsibilities:**
- Analyze student responses for correctness
- Detect concepts mentioned
- Identify misconceptions based on keywords and semantic analysis
- Score responses based on rubric criteria
- Evaluate communication clarity
- Extract key technical terms

**API Endpoints:**
```
POST /api/v1/nlp/evaluate-response
POST /api/v1/nlp/detect-concepts
POST /api/v1/nlp/detect-misconceptions
POST /api/v1/nlp/score-clarity
```

**Request/Response Models:**
```python
class ResponseEvaluationRequest:
    question_text: str
    student_response: str
    concept_id: str
    expected_keywords: List[str]
    misconception_patterns: List[Dict]
    rubric_criteria: Dict

class ResponseEvaluationResponse:
    overall_score: float
    concept_scores: Dict[str, float]
    detected_misconceptions: List[str]
    clarity_score: float
    completeness_score: float
    correctness_score: float
    key_terms_mentioned: List[str]
    confidence: float
```

#### **Question Generation Service**
**Technology:** GPT-4, Claude, or fine-tuned T5
**Responsibilities:**
- Generate new questions based on concepts
- Adapt question difficulty based on student performance
- Create follow-up questions
- Generate code snippets for questions
- Ensure question diversity

**API Endpoints:**
```
POST /api/v1/question-gen/generate
POST /api/v1/question-gen/generate-followup
POST /api/v1/question-gen/calibrate-difficulty
```

#### **IRT (Item Response Theory) Service**
**Technology:** PyIRT or custom implementation
**Responsibilities:**
- Estimate student ability (theta)
- Calculate question difficulty parameters
- Predict probability of correct response
- Select optimal next question
- Determine early termination criteria

**API Endpoints:**
```
POST /api/v1/irt/estimate-ability
POST /api/v1/irt/select-next-question
POST /api/v1/irt/should-terminate
POST /api/v1/irt/calibrate-question
```

**Models:**
```python
class IRTRequest:
    current_ability: float
    response_history: List[Dict[str, Any]]
    available_questions: List[Dict]
    target_sem: float  # Standard error of measurement

class IRTResponse:
    updated_ability: float
    ability_confidence: float
    next_question_id: str
    should_terminate: bool
    termination_reason: str
```

#### **Text-to-Speech Service (TTS)**
**Technology:** OpenAI TTS, ElevenLabs, or Google Cloud TTS
**Responsibilities:**
- Convert AI questions to natural speech
- Support multiple voices
- Adjust speech speed
- Stream audio output

**API Endpoints:**
```
POST /api/v1/tts/synthesize
POST /api/v1/tts/synthesize-stream (WebSocket)
```

#### **Conversational AI Service**
**Technology:** LangChain + GPT-4/Claude
**Responsibilities:**
- Manage conversation flow
- Generate follow-up questions based on responses
- Provide hints when student is stuck
- Clarify questions when asked
- Maintain conversation context
- Generate natural AI responses

**API Endpoints:**
```
POST /api/v1/conversation/generate-response
POST /api/v1/conversation/generate-hint
POST /api/v1/conversation/clarify-question
```

---

### 3.2 Python Service Structure

```
services/python/ivas-ai/
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── api/
│   │   ├── v1/
│   │   │   ├── stt.py
│   │   │   ├── nlp.py
│   │   │   ├── question_gen.py
│   │   │   ├── irt.py
│   │   │   ├── tts.py
│   │   │   └── conversation.py
│   ├── core/
│   │   ├── config.py
│   │   └── dependencies.py
│   ├── models/
│   │   ├── stt_models.py
│   │   ├── nlp_models.py
│   │   ├── irt_models.py
│   │   └── conversation_models.py
│   ├── services/
│   │   ├── stt_service.py
│   │   ├── nlp_service.py
│   │   ├── question_gen_service.py
│   │   ├── irt_service.py
│   │   ├── tts_service.py
│   │   └── conversation_service.py
│   └── utils/
│       ├── audio_processing.py
│       ├── text_processing.py
│       └── ml_utils.py
├── tests/
├── requirements.txt
├── Dockerfile
└── README.md
```

**requirements.txt:**
```
fastapi==0.104.1
uvicorn[standard]==0.24.0
pydantic==2.5.0
openai==1.3.0
transformers==4.35.0
torch==2.1.0
whisper==1.1.10  # or openai whisper
langchain==0.0.340
pyirt==0.3.0
numpy==1.24.3
scikit-learn==1.3.2
nltk==3.8.1
spacy==3.7.2
aiohttp==3.9.1
python-multipart==0.0.6
```

---

## 4. Integration Architecture

### 4.1 Communication Flow

```
┌─────────────┐         ┌──────────────┐         ┌─────────────────┐
│   Web UI    │◄───────►│  Spring Boot │◄───────►│  Python AI/ML   │
│  (Next.js)  │         │   (IVAS)     │         │    Services     │
└─────────────┘         └──────────────┘         └─────────────────┘
      │                        │                         │
      │ WebSocket             │ REST API                │
      │                        │                         │
      │                        ▼                         │
      │                 ┌──────────────┐                │
      │                 │  PostgreSQL  │                │
      │                 │   Database   │                │
      │                 └──────────────┘                │
      │                                                  │
      └─────────────── Audio Streams ───────────────────┘
```

### 4.2 Real-time Session Flow

```
1. Student clicks "Start Viva"
   ├─► POST /api/v1/viva/sessions/start
   └─► Create session record, return sessionId

2. Establish WebSocket connection
   ├─► ws://localhost:8080/ws/viva/sessions/{sessionId}
   └─► Authenticate connection

3. Send initial question
   ├─► Spring Boot selects first question
   ├─► POST /api/v1/tts/synthesize (Python)
   ├─► Return audio to client via WebSocket
   └─► Client plays audio

4. Student responds
   ├─► Client captures audio chunks
   ├─► Send audio via WebSocket to Spring Boot
   └─► Spring Boot forwards to Python STT service

5. Transcribe audio
   ├─► POST /api/v1/stt/transcribe (Python)
   ├─► Return transcription to Spring Boot
   └─► Spring Boot sends transcription to client via WebSocket

6. Evaluate response
   ├─► POST /api/v1/nlp/evaluate-response (Python)
   ├─► Return scores and detected concepts
   └─► Spring Boot stores evaluation

7. Update IRT ability
   ├─► POST /api/v1/irt/estimate-ability (Python)
   ├─► Return updated ability and next question recommendation
   └─► Spring Boot selects next question

8. Generate AI response
   ├─► POST /api/v1/conversation/generate-response (Python)
   ├─► Generate contextual follow-up or hint
   ├─► POST /api/v1/tts/synthesize (Python)
   └─► Send audio to client

9. Repeat steps 3-8 until:
   ├─► Time limit reached
   ├─► Early termination criteria met (IRT confidence)
   └─► Student ends session

10. Finalize session
    ├─► POST /api/v1/viva/sessions/{sessionId}/end
    ├─► Calculate final scores
    ├─► Generate report
    └─► Return results
```

---

## 5. Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
**Goal:** Set up core infrastructure

#### Spring Boot Setup
- [ ] Create IVAS service structure
- [ ] Define all entity models
- [ ] Set up PostgreSQL database with tables
- [ ] Configure Spring Security
- [ ] Create base REST controllers
- [ ] Set up WebSocket configuration
- [ ] Implement basic CRUD for Configuration
- [ ] Implement basic CRUD for Rubric

#### Python AI Service Setup
- [ ] Create FastAPI project structure
- [ ] Set up virtual environment
- [ ] Install dependencies
- [ ] Create base API routers
- [ ] Set up OpenAI API integration
- [ ] Create Pydantic models
- [ ] Implement health check endpoints

#### Database Schema
- [ ] Create migration scripts
- [ ] Set up test data
- [ ] Create indexes for performance

---

### Phase 2: Core Features (Week 3-5)

#### Session Management
- [ ] Implement session creation API
- [ ] Implement WebSocket handler
- [ ] Create session state machine
- [ ] Implement timer logic
- [ ] Build session storage and retrieval

#### Audio Processing Pipeline
- [ ] Implement audio chunk receiver (Spring Boot)
- [ ] Create audio storage service (S3 or local)
- [ ] Build STT service (Python)
- [ ] Implement transcription storage
- [ ] Test real-time audio streaming

#### Question Management
- [ ] Implement question template storage
- [ ] Create question selection service
- [ ] Build question difficulty calibration
- [ ] Implement code snippet generation
- [ ] Create question randomization

---

### Phase 3: AI/ML Integration (Week 6-8)

#### NLP Response Evaluation
- [ ] Build response evaluation service (Python)
- [ ] Implement concept detection
- [ ] Create misconception detection
- [ ] Implement rubric-based scoring
- [ ] Test evaluation accuracy

#### IRT Implementation
- [ ] Implement IRT ability estimation (Python)
- [ ] Create question difficulty parameters
- [ ] Build adaptive question selection
- [ ] Implement early termination logic
- [ ] Test IRT convergence

#### Conversational AI
- [ ] Build conversation manager (Python)
- [ ] Implement context tracking
- [ ] Create follow-up question generation
- [ ] Implement hint generation
- [ ] Test conversation flow

#### Text-to-Speech
- [ ] Integrate TTS API (Python)
- [ ] Implement voice selection
- [ ] Create speech speed adjustment
- [ ] Build audio streaming
- [ ] Test audio quality

---

### Phase 4: Grading & Analytics (Week 9-10)

#### Grading Service
- [ ] Implement score aggregation
- [ ] Create competency level calculation
- [ ] Build pass/fail determination
- [ ] Generate strengths/weaknesses
- [ ] Implement rubric application

#### Results Generation
- [ ] Create results API
- [ ] Build concept mastery calculation
- [ ] Implement transcript formatting
- [ ] Generate visual analytics data
- [ ] Create PDF report generation

#### Instructor Analytics
- [ ] Implement dashboard statistics API
- [ ] Create misconception analysis
- [ ] Build performance trends
- [ ] Implement question difficulty analysis
- [ ] Create comparative analytics

---

### Phase 5: UI Integration (Week 11-12)

#### Student UI Integration
- [ ] Connect landing page to API
- [ ] Implement practice mode
- [ ] Build live session WebSocket connection
- [ ] Integrate audio recording
- [ ] Display real-time transcriptions
- [ ] Show results page with charts

#### Instructor UI Integration
- [ ] Connect dashboard to API
- [ ] Implement configuration editor
- [ ] Build rubric editor with API
- [ ] Create session review page
- [ ] Implement analytics page

---

### Phase 6: Advanced Features (Week 13-14)

#### Trigger System
- [ ] Implement CIPAS integration
- [ ] Create automatic trigger logic
- [ ] Build manual trigger
- [ ] Implement eligibility checks
- [ ] Create notification system

#### Review & Override
- [ ] Implement manual score override
- [ ] Create flagging system
- [ ] Build retake permission
- [ ] Implement contest handling
- [ ] Add manual feedback

#### Practice Mode
- [ ] Create practice session API
- [ ] Implement sample questions
- [ ] Build practice feedback
- [ ] Add diagnostics checks

---

### Phase 7: Testing & Optimization (Week 15-16)

#### Testing
- [ ] Unit tests for all services
- [ ] Integration tests for APIs
- [ ] WebSocket connection tests
- [ ] Audio pipeline tests
- [ ] IRT algorithm validation
- [ ] Load testing
- [ ] Security testing

#### Optimization
- [ ] Optimize database queries
- [ ] Implement caching (Redis)
- [ ] Optimize audio processing
- [ ] Improve ML model inference speed
- [ ] Optimize WebSocket performance

#### Documentation
- [ ] API documentation (Swagger)
- [ ] Deployment guide
- [ ] User manual
- [ ] Admin guide

---

## 6. Technology Stack Summary

### Backend (Spring Boot)
- **Framework:** Spring Boot 4.0.1
- **Language:** Java 17
- **Database:** PostgreSQL
- **ORM:** Spring Data JPA
- **Security:** Spring Security
- **WebSocket:** Spring WebSocket
- **Build:** Maven
- **Dependencies:** Lombok, Hibernate Validator

### AI/ML (Python)
- **Framework:** FastAPI
- **Language:** Python 3.10+
- **ML Libraries:** 
  - Transformers (HuggingFace)
  - OpenAI API
  - PyTorch
  - Whisper (STT)
  - LangChain
  - PyIRT
  - NLTK, spaCy
- **Server:** Uvicorn
- **Async:** aiohttp

### Frontend (Next.js)
- **Framework:** Next.js 14+
- **Language:** TypeScript
- **UI:** shadcn/ui, Tailwind CSS
- **Charts:** Recharts
- **WebSocket:** native WebSocket API or socket.io-client
- **Audio:** Web Audio API, MediaRecorder API

### Infrastructure
- **Database:** PostgreSQL 15+
- **Cache:** Redis (optional, for optimization)
- **Storage:** S3 or local file system (audio recordings)
- **Message Queue:** RabbitMQ or Kafka (optional, for async processing)
- **API Gateway:** Kong (existing in project)

---

## 7. Key Considerations

### 7.1 Real-time Performance
- Use WebSocket for low-latency communication
- Implement audio chunk streaming (not full audio upload)
- Use async processing for STT and NLP
- Consider server-side audio buffering

### 7.2 Scalability
- Horizontally scale Python ML services
- Use message queues for decoupling services
- Implement connection pooling for database
- Use CDN for static assets and audio files

### 7.3 Accuracy & Fairness
- Calibrate IRT parameters with real data
- Validate NLP evaluation against human graders
- Implement bias detection in scoring
- Allow manual review and override

### 7.4 Security & Privacy
- Encrypt audio recordings at rest
- Secure WebSocket connections (WSS)
- Implement session timeout
- GDPR compliance for recordings (retention policy)
- Secure API keys for external services

### 7.5 Reliability
- Implement session recovery (if disconnected)
- Auto-save progress periodically
- Handle network interruptions gracefully
- Provide offline fallback messages

---

## 8. Dependencies Between Components

### Critical Path:
1. **Database Setup** → All services depend on this
2. **Session Management** → Required for all features
3. **Audio Pipeline** → Required for live sessions
4. **NLP Evaluation** → Required for scoring
5. **IRT Implementation** → Required for adaptive questioning
6. **UI Integration** → Final step

### Parallel Development Opportunities:
- Configuration & Rubric management (independent)
- Practice mode (independent from real sessions)
- Analytics (can use mock data initially)
- TTS integration (can test independently)
- Instructor review features (can develop post-MVP)

---

## 9. MVP (Minimum Viable Product)

For a working demo, prioritize:
1. ✅ Basic session creation and management
2. ✅ Fixed question set (no IRT initially)
3. ✅ Audio recording and STT
4. ✅ Simple NLP evaluation (keyword matching)
5. ✅ Basic scoring and results
6. ✅ Student session UI
7. ✅ Instructor results review

Defer for later:
- ❌ Adaptive questioning (IRT)
- ❌ Advanced conversational AI
- ❌ Complex analytics
- ❌ Practice mode
- ❌ Automatic triggers
- ❌ Contest/override features

---

## 10. Next Steps

### Immediate Actions:
1. **Setup Development Environment**
   - Configure Spring Boot project
   - Create Python FastAPI project
   - Set up PostgreSQL database

2. **Create Database Schema**
   - Write migration scripts
   - Create entity relationships
   - Add test data

3. **Implement Core APIs**
   - Session management endpoints
   - Configuration endpoints
   - Rubric management endpoints

4. **Build Python Services**
   - STT service
   - Basic NLP evaluation
   - TTS integration

5. **WebSocket Implementation**
   - Spring Boot WebSocket handler
   - Client-side WebSocket connection
   - Audio streaming protocol

6. **UI Integration**
   - Connect student session page
   - Connect instructor dashboard
   - Test end-to-end flow

---

## Conclusion

This implementation plan provides a comprehensive roadmap for building the IVAS system from UI to backend to AI/ML models. The phased approach ensures steady progress while managing complexity. The key to success is:

1. **Start with MVP** - Get basic functionality working end-to-end
2. **Iterate on AI** - Improve NLP and IRT models over time
3. **Gather feedback** - Test with real students and instructors
4. **Optimize** - Focus on performance and user experience
5. **Scale** - Add advanced features incrementally

The architecture is designed to be modular, allowing parallel development and easy integration of new AI capabilities as technology evolves.
