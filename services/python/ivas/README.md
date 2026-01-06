# IVAS - Intelligent Viva Assessment System

FastAPI Python backend for AI-powered viva assessments.

## Overview

This service provides AI capabilities for automated viva assessments:

- **ASR (Automatic Speech Recognition)**: Transcribes student audio using Faster-Whisper
- **TTS (Text-to-Speech)**: Generates AI examiner voice using Coqui XTTS v2
- **LLM (Large Language Model)**: Powers Socratic questioning using Ollama/Llama 3.1

## Quick Start

### Prerequisites

- Python 3.11+
- Ollama (for LLM) - [Install Ollama](https://ollama.com/download)

### Setup

1. **Create virtual environment:**
   ```bash
   cd services/python/ivas
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env as needed
   ```

4. **Start Ollama (in separate terminal):**
   ```bash
   ollama serve
   ollama pull llama3.1:8b
   ```

5. **Run the service:**
   ```bash
   uvicorn main:app --reload --port 8085
   ```

### Verify Installation

```bash
# Health check
curl http://localhost:8085/health
# Expected: {"status": "healthy", "service": "ivas-ai-services"}

# IVAS module health
curl http://localhost:8085/ivas/health
# Expected: {"status": "healthy", "services": {...}}
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Root health check |
| `/ivas/health` | GET | IVAS services status |
| `/ivas/transcribe` | POST | Transcribe audio to text |
| `/ivas/synthesize` | POST | Synthesize text to speech |
| `/ivas/generate-question` | POST | Generate Socratic question |
| `/ivas/assess-response` | POST | Assess student response |

## API Documentation

- **Swagger UI**: http://localhost:8085/docs
- **ReDoc**: http://localhost:8085/redoc

## Project Structure

```
services/python/ivas/
├── main.py              # FastAPI application entry point
├── config.py            # Application settings
├── router.py            # API endpoints
├── schemas.py           # Pydantic models
├── services.py          # AI service classes
├── prompts.py           # LLM prompt templates
├── requirements.txt     # Python dependencies
├── Dockerfile           # Docker configuration
├── .env.example         # Environment template
└── models/              # Downloaded AI models
    ├── whisper/
    └── tts/
```

## Docker

### Build and run:

```bash
docker build -t ivas .
docker run -p 8085:8085 ivas
```

### With Docker Compose (from project root):

```bash
docker compose -f infra/docker/docker-compose.yml up ivas -d
```

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 8085 | Server port |
| `DEBUG` | true | Enable debug mode |
| `OLLAMA_HOST` | http://localhost:11434 | Ollama server URL |
| `OLLAMA_MODEL` | llama3.1:8b | LLM model name |
| `WHISPER_MODEL_SIZE` | base | Whisper model size |
| `TTS_MODEL` | xtts_v2 | TTS model name |

## Next Steps

- **Step 5**: Implement ASR with Faster-Whisper
- **Step 6**: Implement TTS with Coqui XTTS
- **Step 7**: Implement LLM with Ollama
- **Step 8**: Add WebSocket support for real-time streaming

## Related Documentation

- [IVAS Implementation Guide](../../../docs/IVAS_IMPLEMENTATION_GUIDE.md)
- [Architecture Overview](../../../docs/architecture.md)
