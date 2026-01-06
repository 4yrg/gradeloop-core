#!/usr/bin/env python3
"""
Test script for ASR (Automatic Speech Recognition) Service
Generates a test audio file and tests transcription using OpenAI Whisper
"""

import sys
import os

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


def generate_test_audio():
    """Generate a simple test WAV file with a beep tone"""
    import struct
    import math
    
    # WAV parameters
    sample_rate = 16000
    duration = 1.0  # 1 second
    frequency = 440  # A4 note
    
    num_samples = int(sample_rate * duration)
    
    # Generate sine wave samples
    samples = []
    for i in range(num_samples):
        t = i / sample_rate
        sample = int(32767 * 0.5 * math.sin(2 * math.pi * frequency * t))
        samples.append(sample)
    
    # Create WAV file
    wav_data = bytearray()
    
    # RIFF header
    wav_data.extend(b'RIFF')
    wav_data.extend(struct.pack('<I', 36 + num_samples * 2))  # File size
    wav_data.extend(b'WAVE')
    
    # fmt chunk
    wav_data.extend(b'fmt ')
    wav_data.extend(struct.pack('<I', 16))  # Chunk size
    wav_data.extend(struct.pack('<H', 1))   # Audio format (PCM)
    wav_data.extend(struct.pack('<H', 1))   # Num channels (mono)
    wav_data.extend(struct.pack('<I', sample_rate))  # Sample rate
    wav_data.extend(struct.pack('<I', sample_rate * 2))  # Byte rate
    wav_data.extend(struct.pack('<H', 2))   # Block align
    wav_data.extend(struct.pack('<H', 16))  # Bits per sample
    
    # data chunk
    wav_data.extend(b'data')
    wav_data.extend(struct.pack('<I', num_samples * 2))  # Data size
    for sample in samples:
        wav_data.extend(struct.pack('<h', sample))
    
    return bytes(wav_data)


def test_asr_service():
    """Test the ASR service with a generated audio file"""
    print("=" * 50)
    print("IVAS ASR Service Test")
    print("=" * 50)
    
    # Generate test audio
    print("\n1. Generating test audio file...")
    audio_data = generate_test_audio()
    
    # Save to file for reference
    test_file = "test_audio.wav"
    with open(test_file, "wb") as f:
        f.write(audio_data)
    print(f"   Created: {test_file} ({len(audio_data)} bytes)")
    
    # Test ASR service
    print("\n2. Testing ASR Service...")
    try:
        from services import ASRService
        
        asr = ASRService(model_size="base")
        print(f"   Model size: {asr.model_size}")
        print(f"   Is available: {asr.is_available}")
        
        if not asr.is_available:
            print("\n   ⚠️  openai-whisper not installed. Install with:")
            print("      pip install openai-whisper")
            return False
        
        print("\n3. Initializing model (may take a moment on first run)...")
        
        # Test with file
        with open(test_file, "rb") as f:
            audio_bytes = f.read()
        
        print("\n4. Transcribing audio...")
        result = asr.transcribe(audio_bytes)
        
        print("\n" + "=" * 50)
        print("TRANSCRIPTION RESULT:")
        print("=" * 50)
        print(f"   Transcript:  '{result['transcript']}'")
        print(f"   Confidence:  {result['confidence']:.3f}")
        print(f"   Duration:    {result['duration']:.2f}s")
        print(f"   Language:    {result['language']}")
        
        print("\n✅ ASR Service test completed successfully!")
        return True
        
    except ImportError as e:
        print(f"\n❌ Import error: {e}")
        print("   Install faster-whisper: pip install faster-whisper>=1.0.0")
        return False
    except Exception as e:
        print(f"\n❌ Error: {e}")
        return False
    finally:
        # Cleanup
        if os.path.exists(test_file):
            os.remove(test_file)
            print(f"\n   Cleaned up: {test_file}")


def test_api_endpoint():
    """Test the /transcribe API endpoint"""
    print("\n" + "=" * 50)
    print("Testing /transcribe API endpoint")
    print("=" * 50)
    
    try:
        import httpx
        
        # Generate test audio
        audio_data = generate_test_audio()
        
        # Test API
        print("\nSending request to http://localhost:8085/ivas/transcribe...")
        
        with httpx.Client() as client:
            response = client.post(
                "http://localhost:8085/ivas/transcribe",
                files={"file": ("test.wav", audio_data, "audio/wav")},
                timeout=60.0,  # Longer timeout for model loading
            )
        
        if response.status_code == 200:
            result = response.json()
            print("\n✅ API Response:")
            print(f"   Status: {response.status_code}")
            print(f"   Transcript: '{result.get('transcript', '')}'")
            print(f"   Confidence: {result.get('confidence', 0):.3f}")
            print(f"   Duration: {result.get('duration', 0):.2f}s")
            return True
        else:
            print(f"\n❌ API Error: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except httpx.ConnectError:
        print("\n⚠️  Could not connect to API. Is the server running?")
        print("   Start with: uvicorn main:app --port 8085")
        return False
    except Exception as e:
        print(f"\n❌ Error: {e}")
        return False


if __name__ == "__main__":
    print("\nRunning ASR tests...\n")
    
    # Test 1: Direct service test
    service_ok = test_asr_service()
    
    # Test 2: API endpoint test (optional)
    if "--api" in sys.argv:
        api_ok = test_api_endpoint()
    else:
        print("\n💡 Tip: Run with --api flag to also test the HTTP endpoint")
    
    print("\n" + "=" * 50)
    print("Test Summary")
    print("=" * 50)
    print(f"   ASR Service: {'✅ PASS' if service_ok else '❌ FAIL'}")
    
    sys.exit(0 if service_ok else 1)
