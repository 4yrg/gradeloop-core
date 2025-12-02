# IVAS Frontend - Testing Instructions

## Prerequisites

1. **Backend server running on port 8000**
   ```bash
   cd /Users/mpssj/all/code/uni/gradeloop-core/apps/ai-services
   source /Users/mpssj/all/code/uni/gradeloop-core/.venv/bin/activate
   PYTHONPATH=. uvicorn app.main:app --reload --port 8000
   ```

2. **Ollama running with Llama 3.1**
   ```bash
   ollama serve
   # In another terminal:
   ollama pull llama3.1:8b
   ```

## Start Frontend Development Server

```bash
cd /Users/mpssj/all/code/uni/gradeloop-core/apps/client
npm run dev
```

Open browser to: **http://localhost:3000/ivas**

## Testing Flow

### 1. Start Session
- Fill in the form:
  - Student ID: `CS2021001`
  - Student Name: `John Doe`
  - Lab Assignment: `Write a Python function to reverse a string without using built-in reverse methods.`
  - Student Code: (default code is fine)
- Click **"Start Viva Session"**
- Grant microphone permission when prompted

### 2. Wait for First AI Question
- Status should change to "Ready"
- First AI question will be generated
- You'll see the question in the conversation
- You'll hear the AI speak the question

### 3. Record Your Response
- Click the **"🎤 Talk"** button
- Speak your answer (e.g., "I used string slicing with [::-1] to reverse the string")
- Click **"🛑 Stop"** when done
- Watch status change to "🤔 Thinking..."

### 4. Receive AI Follow-up
- Your transcript will appear in the conversation
- AI will generate a follow-up question
- You'll see and hear the AI's response
- Status changes to "🔊 Speaking..." then back to "Ready"

### 5. Continue Conversation
- Repeat steps 3-4 for multiple turns
- Session auto-ends after 10 turns or 30 minutes

### 6. End Session
- Click **"End Session"** button at any time
- WebSocket closes and microphone stops

## Features Implemented

✅ **Session Management**
- WebSocket connection to backend
- Session lifecycle (start, active, end)
- Automatic reconnection (up to 3 attempts)

✅ **Audio Recording**
- MediaRecorder API with WebM/Opus codec
- Microphone permission handling
- Audio chunking (250ms intervals)
- Echo cancellation and noise suppression

✅ **Audio Playback**
- Web Audio API for natural playback
- Audio queue for multiple responses
- Visual indicators (speaking status)

✅ **Real-time Transcript**
- Student speech transcription
- AI responses displayed
- Conversation history
- Timestamps for each message

✅ **UI Components**
- Status indicator (Ready, Listening, Thinking, Speaking)
- Recording button (large, accessible)
- Progress bar during recording
- Error messages
- Scrollable conversation view

## Troubleshooting

### Microphone Not Working
- Check browser permissions (Chrome: chrome://settings/content/microphone)
- Try HTTPS (some browsers require it)
- Check console for errors

### WebSocket Connection Failed
- Ensure backend is running on port 8000
- Check: `curl http://localhost:8000/ivas/health`
- Check browser console for connection errors

### No Audio Playback
- Check browser audio permissions
- Verify audio element creation in console
- Check if audio data is received (base64 string)

### AI Not Responding
- Check Ollama is running: `ollama list`
- Check backend logs for errors
- Verify LLM service is healthy: `curl http://localhost:8000/ivas/health/services`

## Browser Compatibility

- ✅ Chrome/Edge (recommended)
- ✅ Firefox
- ⚠️ Safari (may need HTTPS for microphone)

## Next Steps

Once basic flow works, you can add:
- Waveform visualization during recording
- Volume meter
- Better error handling
- Session resume capability
- Export conversation transcript
