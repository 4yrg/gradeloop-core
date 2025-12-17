# Piper TTS Voice Models

This directory contains Piper TTS voice models for text-to-speech synthesis.

## Current Model

**en_US-lessac-medium** - American English voice (Lessac quality, medium size)
- Model size: ~60 MB
- Quality: High-quality, natural-sounding voice
- Speed: <1 second for typical sentences

## Files

- `en_US-lessac-medium.onnx` - Neural network model file
- `en_US-lessac-medium.onnx.json` - Configuration file

## Download Instructions

If you need to download or update the model:

```bash
cd apps/ai-services/models/piper/

# Download model file
curl -L -o en_US-lessac-medium.onnx \
  https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/lessac/medium/en_US-lessac-medium.onnx

# Download config file
curl -L -o en_US-lessac-medium.onnx.json \
  https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/lessac/medium/en_US-lessac-medium.onnx.json
```

## Available Voices

Browse more voices at: https://huggingface.co/rhasspy/piper-voices/tree/v1.0.0

### Other English Voices

- `en_US-amy-low` - Smaller, faster model
- `en_US-lessac-high` - Higher quality, larger model
- `en_GB-*` - British English voices
- `en_US-libritts-high` - Very high quality

### Other Languages

- Spanish: `es_ES-*`
- French: `fr_FR-*`
- German: `de_DE-*`
- Italian: `it_IT-*`
- Portuguese: `pt_BR-*`
- And many more...

## Usage

The TTSService automatically loads the model on initialization:

```python
from app.modules.ivas.services import TTSService

# Initialize with default voice
tts_service = TTSService()

# Or specify a different voice model
tts_service = TTSService(voice_model="en_US-lessac-medium")

# Synthesize text to speech
audio_bytes = await tts_service.synthesize("Hello, world!")
```

## Performance

Typical synthesis times on CPU:
- Short text (5-10 words): ~0.1s
- Medium text (15-25 words): ~0.2s
- Long text (50+ words): ~0.5s

Performance meets the <1 second requirement for real-time viva assessment.

## Troubleshooting

If you get "Model files not found" error:
1. Ensure both `.onnx` and `.onnx.json` files exist in this directory
2. Check file permissions are readable
3. Verify files are not corrupted (re-download if needed)

If synthesis is slow:
- Consider using a smaller model like `en_US-lessac-low`
- Ensure no other heavy processes are running
- Check CPU usage during synthesis
