# IVAS System Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend Layer                          │
│  ┌──────────────────────┐        ┌──────────────────────┐      │
│  │   Student UI         │        │   Instructor UI      │      │
│  │  - Session Page      │        │  - Dashboard         │      │
│  │  - Results Page      │        │  - Configuration     │      │
│  │  - Practice Mode     │        │  - Rubric Editor     │      │
│  └──────────────────────┘        │  - Session Review    │      │
│           │                       └──────────────────────┘      │
│           │                                  │                  │
└───────────┼──────────────────────────────────┼──────────────────┘
            │                                  │
            │         WebSocket + REST API     │
            │                                  │
┌───────────┴──────────────────────────────────┴──────────────────┐
│                   API Gateway (Kong)                             │
└───────────┬──────────────────────────────────┬──────────────────┘
            │                                  │
┌───────────┴──────────────────────────────────┴──────────────────┐
│                    Backend Layer (Spring Boot)                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │               IVAS Service (Java/Spring Boot)           │    │
│  │                                                           │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │    │
│  │  │   Session    │  │ Question     │  │   Grading    │  │    │
│  │  │  Management  │  │ Adaptation   │  │   Service    │  │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  │    │
│  │                                                           │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │    │
│  │  │    Rubric    │  │    Config    │  │  Transcript  │  │    │
│  │  │   Service    │  │   Service    │  │   Service    │  │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  │    │
│  │                                                           │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │    │
│  │  │    Audio     │  │   Trigger    │  │ Notification │  │    │
│  │  │  Processing  │  │   Service    │  │   Service    │  │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  │    │
│  │                                                           │    │
│  │  ┌───────────────────────────────────────────────────┐  │    │
│  │  │          WebSocket Handler (Real-time)            │  │    │
│  │  └───────────────────────────────────────────────────┘  │    │
│  └─────────────────────────────────────────────────────────┘    │
└───────────┬──────────────────────────────────┬──────────────────┘
            │                                  │
            │         REST API                 │
            │                                  │
┌───────────┴──────────────────────────────────┴──────────────────┐
│                  AI/ML Layer (Python/FastAPI)                    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              IVAS AI Service (Python/FastAPI)           │    │
│  │                                                           │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │    │
│  │  │ Speech-to-   │  │   Natural    │  │  Question    │  │    │
│  │  │     Text     │  │   Language   │  │  Generation  │  │    │
│  │  │   (Whisper)  │  │  Processing  │  │  (GPT-4)     │  │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  │    │
│  │                                                           │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │    │
│  │  │     IRT      │  │  Text-to-    │  │ Conversation │  │    │
│  │  │   Engine     │  │   Speech     │  │      AI      │  │    │
│  │  │   (PyIRT)    │  │  (OpenAI)    │  │  (LangChain) │  │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  │    │
│  └─────────────────────────────────────────────────────────┘    │
└───────────┬──────────────────────────────────┬──────────────────┘
            │                                  │
┌───────────┴──────────────────────────────────┴──────────────────┐
│                      Data Layer                                  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │   PostgreSQL     │  │    Redis Cache   │  │   S3/Storage │  │
│  │   (Structured    │  │   (Session Data) │  │    (Audio    │  │
│  │      Data)       │  │                  │  │   Recordings) │  │
│  └──────────────────┘  └──────────────────┘  └──────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

## Component Interaction - Live Session Flow

```
┌────────┐                ┌───────────┐              ┌──────────┐           ┌──────────┐
│ Client │                │  Spring   │              │  Python  │           │   DB     │
│   UI   │                │   Boot    │              │ AI/ML    │           │          │
└───┬────┘                └─────┬─────┘              └────┬─────┘           └────┬─────┘
    │                           │                         │                      │
    │  1. Start Session         │                         │                      │
    │─────────────────────────► │                         │                      │
    │                           │  Create Session Record  │                      │
    │                           │──────────────────────────────────────────────► │
    │                           │ ◄────────────────────────────────────────────  │
    │  WebSocket Connect        │                         │                      │
    │ ◄─────────────────────────│                         │                      │
    │                           │                         │                      │
    │                           │  2. Get First Question  │                      │
    │                           │─────────────────────────────────────────────►  │
    │                           │ ◄─────────────────────────────────────────────│
    │                           │                         │                      │
    │                           │  3. Generate TTS Audio  │                      │
    │                           │─────────────────────────►                      │
    │                           │ ◄─────────────────────── │                      │
    │  Send Question + Audio    │                         │                      │
    │ ◄─────────────────────────│                         │                      │
    │                           │                         │                      │
    │  4. Student Speaks        │                         │                      │
    │  (Audio Chunks)           │                         │                      │
    │─────────────────────────► │                         │                      │
    │                           │  5. STT Transcription   │                      │
    │                           │─────────────────────────►                      │
    │                           │ ◄───────────────────────│                      │
    │  Real-time Transcript     │                         │                      │
    │ ◄─────────────────────────│                         │                      │
    │                           │                         │                      │
    │                           │  6. Evaluate Response   │                      │
    │                           │─────────────────────────►                      │
    │                           │  (NLP Analysis)         │                      │
    │                           │ ◄───────────────────────│                      │
    │                           │  Store Evaluation       │                      │
    │                           │─────────────────────────────────────────────►  │
    │                           │                         │                      │
    │                           │  7. Update IRT Ability  │                      │
    │                           │─────────────────────────►                      │
    │                           │ ◄───────────────────────│                      │
    │                           │                         │                      │
    │                           │  8. Select Next Question│                      │
    │                           │─────────────────────────►                      │
    │                           │ ◄───────────────────────│                      │
    │                           │                         │                      │
    │  Next Question            │                         │                      │
    │ ◄─────────────────────────│                         │                      │
    │                           │                         │                      │
    │  [Repeat 4-8]             │                         │                      │
    │                           │                         │                      │
    │  9. End Session           │                         │                      │
    │─────────────────────────► │                         │                      │
    │                           │  Calculate Final Scores │                      │
    │                           │─────────────────────────────────────────────►  │
    │                           │  Generate Report        │                      │
    │                           │─────────────────────────────────────────────►  │
    │  Results                  │                         │                      │
    │ ◄─────────────────────────│                         │                      │
```

## Database Schema

```
┌─────────────────────────┐
│  viva_configuration     │
├─────────────────────────┤
│ id (PK)                 │
│ assignment_id (FK)      │
│ enabled                 │
│ weight                  │
│ passing_threshold       │
│ max_attempts            │
│ time_limit              │
│ trigger_type            │
│ cipas_enabled           │
│ cipas_threshold         │
│ adaptation_strategy     │
│ tts_voice               │
│ speech_speed            │
│ asr_sensitivity         │
│ ...                     │
└─────────────────────────┘
             │
             │ 1:N
             ▼
┌─────────────────────────┐       ┌─────────────────────────┐
│  viva_rubric            │       │  viva_session           │
├─────────────────────────┤       ├─────────────────────────┤
│ id (PK)                 │       │ id (PK)                 │
│ assignment_id (FK)      │       │ student_id (FK)         │
│ version                 │       │ assignment_id (FK)      │
│ created_at              │       │ status                  │
│ ...                     │       │ started_at              │
└─────────────────────────┘       │ completed_at            │
             │                    │ time_spent              │
             │ 1:N                │ overall_score           │
             ▼                    │ competency_level        │
┌─────────────────────────┐       │ irt_ability             │
│  viva_concept           │       │ pass_fail               │
├─────────────────────────┤       │ audio_recording_path    │
│ id (PK)                 │       │ ...                     │
│ rubric_id (FK)          │       └─────────────────────────┘
│ name                    │                   │
│ description             │                   │ 1:N
│ weight                  │                   ▼
│ sub_concepts (JSON)     │       ┌─────────────────────────┐
│ related_code            │       │  viva_question          │
│ ...                     │       ├─────────────────────────┤
└─────────────────────────┘       │ id (PK)                 │
             │                    │ session_id (FK)         │
             │ 1:N                │ concept_id (FK)         │
             ▼                    │ question_text           │
┌─────────────────────────┐       │ code_snippet            │
│  viva_question_template │       │ difficulty              │
├─────────────────────────┤       │ sequence                │
│ id (PK)                 │       │ asked_at                │
│ concept_id (FK)         │       │ student_response        │
│ question_text           │       │ response_score          │
│ difficulty              │       │ irt_difficulty          │
│ irt_difficulty          │       │ time_spent              │
│ keywords (JSON)         │       │ ...                     │
│ code_template           │       └─────────────────────────┘
│ ...                     │                   │
└─────────────────────────┘                   │ 1:1
             │                                │
             │ 1:N                            ▼
             ▼                    ┌─────────────────────────┐
┌─────────────────────────┐       │  viva_transcript        │
│  viva_misconception     │       ├─────────────────────────┤
├─────────────────────────┤       │ id (PK)                 │
│ id (PK)                 │       │ session_id (FK)         │
│ concept_id (FK)         │       │ speaker                 │
│ misconception_text      │       │ message                 │
│ detection_keywords(JSON)│       │ timestamp               │
│ correction              │       │ confidence              │
│ resource                │       │ ...                     │
│ ...                     │       └─────────────────────────┘
└─────────────────────────┘                   
                                              │ N:1
                                              ▼
                                  ┌─────────────────────────┐
                                  │  viva_concept_mastery   │
                                  ├─────────────────────────┤
                                  │ id (PK)                 │
                                  │ session_id (FK)         │
                                  │ concept_id (FK)         │
                                  │ score                   │
                                  │ mastery                 │
                                  │ detected_misconceptions │
                                  │ ...                     │
                                  └─────────────────────────┘
```

## API Architecture

### Spring Boot REST Endpoints

```
Base URL: /api/v1/viva

┌─────────────────────────────────────────────────────────────┐
│                      Session Management                     │
├─────────────────────────────────────────────────────────────┤
│ POST   /sessions/start                                      │
│ GET    /sessions/{sessionId}                                │
│ POST   /sessions/{sessionId}/end                            │
│ GET    /sessions/{sessionId}/results                        │
│ GET    /sessions/{sessionId}/transcript                     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                     Configuration                           │
├─────────────────────────────────────────────────────────────┤
│ GET    /assignments/{assignmentId}/config                   │
│ PUT    /assignments/{assignmentId}/config                   │
│ GET    /assignments/{assignmentId}/status                   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                        Rubric                               │
├─────────────────────────────────────────────────────────────┤
│ GET    /assignments/{assignmentId}/rubric                   │
│ PUT    /assignments/{assignmentId}/rubric                   │
│ POST   /rubrics/import                                      │
│ GET    /rubrics/{rubricId}/export                           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   Dashboard & Analytics                     │
├─────────────────────────────────────────────────────────────┤
│ GET    /assignments/{assignmentId}/dashboard                │
│ GET    /assignments/{assignmentId}/analytics                │
│ GET    /assignments/{assignmentId}/activity                 │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                     Practice Mode                           │
├─────────────────────────────────────────────────────────────┤
│ POST   /practice/start                                      │
│ GET    /practice/questions                                  │
│ POST   /practice/feedback                                   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   Instructor Actions                        │
├─────────────────────────────────────────────────────────────┤
│ PUT    /sessions/{sessionId}/override                       │
│ POST   /sessions/{sessionId}/flag                           │
│ POST   /sessions/{sessionId}/retake                         │
│ POST   /sessions/{sessionId}/feedback                       │
└─────────────────────────────────────────────────────────────┘
```

### Python AI/ML Endpoints

```
Base URL: /api/v1

┌─────────────────────────────────────────────────────────────┐
│                   Speech-to-Text                            │
├─────────────────────────────────────────────────────────────┤
│ POST   /stt/transcribe                                      │
│ WS     /stt/transcribe-stream                               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              Natural Language Processing                    │
├─────────────────────────────────────────────────────────────┤
│ POST   /nlp/evaluate-response                               │
│ POST   /nlp/detect-concepts                                 │
│ POST   /nlp/detect-misconceptions                           │
│ POST   /nlp/score-clarity                                   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  Question Generation                        │
├─────────────────────────────────────────────────────────────┤
│ POST   /question-gen/generate                               │
│ POST   /question-gen/generate-followup                      │
│ POST   /question-gen/calibrate-difficulty                   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                 IRT (Item Response Theory)                  │
├─────────────────────────────────────────────────────────────┤
│ POST   /irt/estimate-ability                                │
│ POST   /irt/select-next-question                            │
│ POST   /irt/should-terminate                                │
│ POST   /irt/calibrate-question                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                     Text-to-Speech                          │
├─────────────────────────────────────────────────────────────┤
│ POST   /tts/synthesize                                      │
│ WS     /tts/synthesize-stream                               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   Conversational AI                         │
├─────────────────────────────────────────────────────────────┤
│ POST   /conversation/generate-response                      │
│ POST   /conversation/generate-hint                          │
│ POST   /conversation/clarify-question                       │
└─────────────────────────────────────────────────────────────┘
```

## WebSocket Protocol

```
WebSocket URL: ws://localhost:8080/ws/viva/sessions/{sessionId}

┌─────────────────────────────────────────────────────────────┐
│                   Client → Server Messages                  │
├─────────────────────────────────────────────────────────────┤
│ {                                                           │
│   "type": "AUDIO_CHUNK",                                    │
│   "data": "base64_encoded_audio",                           │
│   "sequence": 1,                                            │
│   "timestamp": "2026-01-05T10:30:00Z"                       │
│ }                                                           │
│                                                             │
│ {                                                           │
│   "type": "REQUEST_NEXT_QUESTION"                           │
│ }                                                           │
│                                                             │
│ {                                                           │
│   "type": "END_SESSION"                                     │
│ }                                                           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   Server → Client Messages                  │
├─────────────────────────────────────────────────────────────┤
│ {                                                           │
│   "type": "QUESTION",                                       │
│   "questionId": "123",                                      │
│   "questionText": "Explain AVL tree rotations...",          │
│   "codeSnippet": "...",                                     │
│   "concepts": ["AVL Trees", "Rotations"],                   │
│   "audioUrl": "https://..."                                 │
│ }                                                           │
│                                                             │
│ {                                                           │
│   "type": "TRANSCRIPTION",                                  │
│   "text": "A single right rotation...",                     │
│   "confidence": 0.95,                                       │
│   "timestamp": "00:32"                                      │
│ }                                                           │
│                                                             │
│ {                                                           │
│   "type": "AI_RESPONSE",                                    │
│   "text": "Good! Now, what about...",                       │
│   "audioUrl": "https://...",                                │
│   "isSpeaking": true                                        │
│ }                                                           │
│                                                             │
│ {                                                           │
│   "type": "SESSION_UPDATE",                                 │
│   "timeLeft": 540,                                          │
│   "questionsAsked": 3,                                      │
│   "currentAbility": 0.5                                     │
│ }                                                           │
│                                                             │
│ {                                                           │
│   "type": "SESSION_END",                                    │
│   "reason": "TIME_UP",                                      │
│   "resultsUrl": "/viva/sessions/123/results"                │
│ }                                                           │
└─────────────────────────────────────────────────────────────┘
```

## Deployment Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                      Production Environment                  │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────┐         ┌────────────────┐              │
│  │  Load Balancer │────────►│  Kong Gateway  │              │
│  │    (Nginx)     │         │   (API Proxy)  │              │
│  └────────────────┘         └────────────────┘              │
│                                     │                        │
│            ┌────────────────────────┼────────────────┐       │
│            │                        │                │       │
│            ▼                        ▼                ▼       │
│  ┌──────────────────┐   ┌──────────────────┐  ┌─────────┐  │
│  │  Next.js (Web)   │   │ Spring Boot IVAS │  │ Python  │  │
│  │  - Container 1   │   │  - Instance 1    │  │ AI/ML   │  │
│  │  - Container 2   │   │  - Instance 2    │  │ Service │  │
│  └──────────────────┘   └──────────────────┘  └─────────┘  │
│                                     │                │       │
│                                     └────────┬───────┘       │
│                                              │               │
│                                              ▼               │
│                                   ┌──────────────────┐       │
│                                   │   PostgreSQL     │       │
│                                   │   (Primary +     │       │
│                                   │    Replica)      │       │
│                                   └──────────────────┘       │
│                                              │               │
│                                              ▼               │
│                                   ┌──────────────────┐       │
│                                   │   Redis Cache    │       │
│                                   └──────────────────┘       │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              S3 / Object Storage                       │ │
│  │              (Audio Recordings)                        │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

## Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Authentication Flow                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  User Login                                                 │
│      │                                                      │
│      ▼                                                      │
│  ┌───────────────┐                                          │
│  │  Auth Service │                                          │
│  └───────────────┘                                          │
│      │                                                      │
│      ▼                                                      │
│  Generate JWT Token                                         │
│      │                                                      │
│      ▼                                                      │
│  Client stores token                                        │
│      │                                                      │
│      ▼                                                      │
│  ┌─────────────────────────────────────────┐               │
│  │  All API requests include:              │               │
│  │  Authorization: Bearer <JWT_TOKEN>      │               │
│  └─────────────────────────────────────────┘               │
│      │                                                      │
│      ▼                                                      │
│  ┌───────────────────────────────────────┐                 │
│  │  Spring Security validates token      │                 │
│  │  - Signature verification             │                 │
│  │  - Expiration check                   │                 │
│  │  - Role/permission check              │                 │
│  └───────────────────────────────────────┘                 │
│      │                                                      │
│      ▼                                                      │
│  Request proceeds to controller                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   Data Security Layers                      │
├─────────────────────────────────────────────────────────────┤
│  1. Transport Layer                                         │
│     - HTTPS/TLS 1.3 for all API calls                      │
│     - WSS (WebSocket Secure) for real-time                 │
│                                                             │
│  2. Application Layer                                       │
│     - JWT token authentication                              │
│     - Role-based access control (RBAC)                      │
│     - Session validation                                    │
│     - Request rate limiting                                 │
│                                                             │
│  3. Data Layer                                              │
│     - Database encryption at rest (PostgreSQL)              │
│     - Audio file encryption (S3 server-side encryption)     │
│     - Sensitive data masking in logs                        │
│     - GDPR-compliant data retention policies                │
└─────────────────────────────────────────────────────────────┘
```

## Performance Optimization

### Caching Strategy
```
┌─────────────────────────────────────────────────────────────┐
│                       Redis Cache Layers                    │
├─────────────────────────────────────────────────────────────┤
│  Layer 1: Configuration Cache                               │
│    - TTL: 1 hour                                            │
│    - Keys: config:{assignmentId}                            │
│                                                             │
│  Layer 2: Rubric Cache                                      │
│    - TTL: 30 minutes                                        │
│    - Keys: rubric:{assignmentId}                            │
│                                                             │
│  Layer 3: Session State Cache                               │
│    - TTL: Session duration + 1 hour                         │
│    - Keys: session:{sessionId}:state                        │
│                                                             │
│  Layer 4: Question Bank Cache                               │
│    - TTL: 1 day                                             │
│    - Keys: questions:{conceptId}                            │
└─────────────────────────────────────────────────────────────┘
```

### Database Optimization
```
┌─────────────────────────────────────────────────────────────┐
│                      Database Indexes                       │
├─────────────────────────────────────────────────────────────┤
│  viva_session:                                              │
│    - INDEX idx_session_student (student_id, assignment_id)  │
│    - INDEX idx_session_status (status, created_at)          │
│                                                             │
│  viva_question:                                             │
│    - INDEX idx_question_session (session_id, sequence)      │
│    - INDEX idx_question_concept (concept_id, difficulty)    │
│                                                             │
│  viva_transcript:                                           │
│    - INDEX idx_transcript_session (session_id, timestamp)   │
└─────────────────────────────────────────────────────────────┘
```

## Monitoring & Observability

```
┌─────────────────────────────────────────────────────────────┐
│                      Monitoring Stack                       │
├─────────────────────────────────────────────────────────────┤
│  Metrics (Prometheus)                                       │
│    - API response times                                     │
│    - WebSocket connection count                             │
│    - Session completion rate                                │
│    - ML inference latency                                   │
│    - Database query performance                             │
│                                                             │
│  Logging (ELK Stack)                                        │
│    - Application logs                                       │
│    - Error tracking                                         │
│    - Audit logs                                             │
│                                                             │
│  Tracing (Jaeger)                                           │
│    - End-to-end request tracing                             │
│    - Service dependency mapping                             │
│                                                             │
│  Alerting (AlertManager)                                    │
│    - High error rate                                        │
│    - Slow API responses                                     │
│    - WebSocket failures                                     │
│    - Database connection issues                             │
└─────────────────────────────────────────────────────────────┘
```

## Scalability Considerations

### Horizontal Scaling
- **Spring Boot IVAS**: Stateless design allows multiple instances
- **Python AI/ML**: GPU-enabled instances for ML inference
- **PostgreSQL**: Read replicas for query distribution
- **Redis**: Cluster mode for high availability

### Vertical Scaling
- **Database**: Increase CPU/RAM for complex queries
- **ML Service**: GPU acceleration for faster inference
- **WebSocket Server**: More memory for concurrent connections

### Auto-scaling Triggers
- CPU > 70% for 5 minutes
- Memory > 80% for 5 minutes
- Active WebSocket connections > 1000
- API response time > 2 seconds (p95)
