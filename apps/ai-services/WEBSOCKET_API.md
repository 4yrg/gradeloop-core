# IVAS WebSocket API Documentation

## Overview

The IVAS WebSocket endpoint provides real-time voice streaming for intelligent viva (oral examination) sessions. It handles bidirectional audio streaming with AI-powered conversation.

## Endpoint

```
ws://localhost:8000/api/ivas/ws/{session_id}
```

## Connection Flow

1. **Connect**: Client establishes WebSocket connection
2. **Session Start**: Client sends session initialization
3. **Conversation Loop**: Audio streaming back and forth
4. **Session End**: Either party can end the session

## Message Protocol

All messages are JSON objects with this structure:

```json
{
  "type": "message_type",
  "data": { /* message-specific data */ },
  "timestamp": "2025-12-02T10:30:00.000Z"
}
```

---

## Client → Server Messages

### 1. Session Start

Initialize a new viva session.

```json
{
  "type": "session_start",
  "data": {
    "student_id": "CS2021001",
    "student_name": "John Doe",
    "lab_assignment": "Write a Python function to reverse a string",
    "student_code": "def reverse_string(s):\n    return s[::-1]"
  }
}
```

**Response Flow:**
1. `session_started` confirmation
2. `ai_response` with first question (text)
3. `ai_audio` with first question (audio)

---

### 2. Audio Chunk

Send student's audio to be transcribed.

```json
{
  "type": "audio_chunk",
  "data": {
    "audio": "base64-encoded-audio-bytes",
    "format": "webm" | "wav" | "mp3",
    "is_final": false
  }
}
```

**Parameters:**
- `audio`: Base64-encoded audio data
- `format`: Audio format (webm, wav, mp3)
- `is_final`: Set to `true` to trigger immediate processing, or `false` to buffer

**Response Flow (when processed):**
1. `transcript` - Student's speech transcribed
2. `ai_response` - AI's next question (text)
3. `ai_audio` - AI's audio response

---

### 3. Session End

Request to end the session.

```json
{
  "type": "session_end",
  "data": {}
}
```

**Response:**
- `session_end` confirmation with session statistics

---

## Server → Client Messages

### 1. Connection

Sent immediately after WebSocket connection.

```json
{
  "type": "connection",
  "data": {
    "session_id": "test-session-123",
    "status": "connected",
    "message": "WebSocket connected. Send session_start to begin."
  },
  "timestamp": "2025-12-02T10:30:00.000Z"
}
```

---

### 2. Session Started

Confirms session initialization.

```json
{
  "type": "session_started",
  "data": {
    "session_id": "test-session-123",
    "message": "Session started. You can now send audio."
  },
  "timestamp": "2025-12-02T10:30:00.000Z"
}
```

---

### 3. Transcript

Student's speech transcribed to text.

```json
{
  "type": "transcript",
  "data": {
    "text": "I used string slicing to reverse the string"
  },
  "timestamp": "2025-12-02T10:30:01.000Z"
}
```

---

### 4. AI Response

AI's question or response (text).

```json
{
  "type": "ai_response",
  "data": {
    "text": "Why did you choose to use string slicing instead of a loop?"
  },
  "timestamp": "2025-12-02T10:30:02.000Z"
}
```

---

### 5. AI Audio

AI's audio response (spoken version of `ai_response`).

```json
{
  "type": "ai_audio",
  "data": {
    "audio": "base64-encoded-wav-audio",
    "format": "wav"
  },
  "timestamp": "2025-12-02T10:30:03.000Z"
}
```

**Audio Specs:**
- Format: WAV (16-bit PCM)
- Sample Rate: 22050 Hz (Piper) or 24000 Hz (XTTS)
- Channels: Mono

---

### 6. Error

Error message from server.

```json
{
  "type": "error",
  "data": {
    "message": "Session not started. Send session_start first."
  },
  "timestamp": "2025-12-02T10:30:00.000Z"
}
```

---

### 7. Session End

Session termination confirmation.

```json
{
  "type": "session_end",
  "data": {
    "message": "Session ended by client.",
    "turn_count": 5
  },
  "timestamp": "2025-12-02T10:30:10.000Z"
}
```

---

## Complete Example Flow

```javascript
// 1. Connect
const ws = new WebSocket('ws://localhost:8000/api/ivas/ws/session-123');

// 2. Handle connection
ws.onopen = () => {
  console.log('Connected');
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Received:', message.type, message.data);
  
  switch(message.type) {
    case 'connection':
      // Start session
      ws.send(JSON.stringify({
        type: 'session_start',
        data: {
          student_id: 'CS2021001',
          student_name: 'John Doe',
          lab_assignment: 'Reverse a string',
          student_code: 'def reverse_string(s):\n    return s[::-1]'
        }
      }));
      break;
      
    case 'ai_audio':
      // Play audio to user
      const audioData = atob(message.data.audio);
      playAudio(audioData);
      break;
      
    case 'transcript':
      // Show student's transcript
      console.log('You said:', message.data.text);
      break;
  }
};

// 3. Send audio chunk
function sendAudio(audioBlob) {
  const reader = new FileReader();
  reader.onload = () => {
    const base64Audio = btoa(reader.result);
    ws.send(JSON.stringify({
      type: 'audio_chunk',
      data: {
        audio: base64Audio,
        format: 'webm',
        is_final: true
      }
    }));
  };
  reader.readAsBinaryString(audioBlob);
}

// 4. End session
function endSession() {
  ws.send(JSON.stringify({
    type: 'session_end',
    data: {}
  }));
}
```

---

## Audio Processing

### Buffering Strategy

- Audio chunks are buffered until:
  - `is_final: true` is received
  - Buffer duration exceeds 3 seconds
  - Buffer size exceeds 500KB

### Processing Pipeline

```
Student Audio → Buffer → ASR (Whisper) → Transcript
                                              ↓
Client ← TTS (Piper/XTTS) ← LLM (Llama) ← Transcript
```

### Expected Latency

| Stage | Latency |
|-------|---------|
| ASR (Whisper base) | ~1x audio duration |
| LLM (Llama 3.1) | 2-5 seconds |
| TTS (Piper) | 0.1-0.2 seconds |
| TTS (XTTS CPU) | 3-6 seconds |
| TTS (XTTS GPU) | 0.5-1 seconds |
| **Total (Piper)** | **3-7 seconds** |
| **Total (XTTS GPU)** | **3-7 seconds** |

---

## Session Management

### Session States

1. **CONNECTING**: Initial connection
2. **ACTIVE**: Session running, processing messages
3. **ENDING**: Shutdown initiated
4. **ENDED**: Session closed

### Auto-Termination

Sessions end automatically when:
- Maximum turns reached (default: 10)
- Duration exceeds 30 minutes
- Client disconnects
- Server error occurs

---

## Error Handling

### Connection Errors

```json
{
  "type": "error",
  "data": {
    "message": "WebSocket connection error"
  }
}
```

### Processing Errors

```json
{
  "type": "error",
  "data": {
    "message": "ASR transcription error: Invalid audio format"
  }
}
```

### Recovery

- Client should reconnect with new session ID
- Previous conversation history is lost (not persisted yet)
- Database persistence coming in Step 8

---

## Testing

### Using Python Test Client

```bash
cd /Users/mpssj/all/code/uni/gradeloop-core/apps/ai-services
python test_websocket.py
```

### Using Browser Console

```javascript
const ws = new WebSocket('ws://localhost:8000/api/ivas/ws/test-123');
ws.onmessage = (e) => console.log(JSON.parse(e.data));
ws.send(JSON.stringify({
  type: 'session_start',
  data: {
    student_id: 'test',
    lab_assignment: 'Test assignment',
    student_code: '# test code'
  }
}));
```

---

## Configuration

Environment variables (see `config.py`):

```bash
# ASR
ASR_MODEL_SIZE=base  # tiny, base, small, medium, large
ASR_DEVICE=cpu       # cpu or cuda

# TTS
IVAS_ENV=development # development (Piper) or production (XTTS)
TTS_USE_GPU=false    # true for GPU acceleration

# LLM
LLM_MODEL=llama3.1:8b
LLM_HOST=http://localhost:11434

# Session
MAX_CONVERSATION_TURNS=10
```

---

## Next Steps

- ✅ WebSocket endpoint implemented
- ✅ Audio streaming working
- ✅ Session management active
- ⏳ Database persistence (Step 8)
- ⏳ Assessment scoring (Step 7)
- ⏳ Frontend integration (Step 9)
