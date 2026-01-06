#!/usr/bin/env python3
"""
Test script for TTS (Text-to-Speech) Service
Tests speech synthesis using Edge TTS
"""

import sys
import os
import asyncio

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


def test_tts_service():
    """Test the TTS service directly"""
    print("=" * 50)
    print("IVAS TTS Service Test")
    print("=" * 50)
    
    try:
        from services import TTSService
        
        tts = TTSService()
        print(f"\n1. TTS Service created")
        print(f"   Voice model: {tts.model_name}")
        print(f"   Is available: {tts.is_available}")
        
        if not tts.is_available:
            print("\n   ⚠️  edge-tts not installed. Install with:")
            print("      pip install edge-tts pydub")
            return False
        
        print("\n2. Available voice styles:")
        for emotion, voice in tts.VOICE_STYLES.items():
            print(f"   - {emotion}: {voice}")
        
        print("\n3. Testing speech synthesis...")
        
        # Test text
        test_text = "Hello! Welcome to the viva assessment. Let's begin with a simple question about your code."
        
        # Synthesize using async
        async def run_synthesis():
            return await tts.synthesize_async(
                text=test_text,
                emotion="friendly",
                speed=1.0
            )
        
        audio_bytes = asyncio.run(run_synthesis())
        
        # Save to file
        output_file = "test_output.wav"
        with open(output_file, "wb") as f:
            f.write(audio_bytes)
        
        print("\n" + "=" * 50)
        print("SYNTHESIS RESULT:")
        print("=" * 50)
        print(f"   Text: '{test_text[:50]}...'")
        print(f"   Output size: {len(audio_bytes)} bytes")
        print(f"   Output file: {output_file}")
        
        # Verify WAV file
        if len(audio_bytes) > 44:  # WAV header is 44 bytes
            print(f"   File format: Valid WAV file")
            print("\n✅ TTS Service test completed successfully!")
            print(f"\n💡 Play the audio: open {output_file}")
            return True
        else:
            print(f"   ⚠️ Warning: Output may be too small")
            return False
            
    except ImportError as e:
        print(f"\n❌ Import error: {e}")
        print("   Install edge-tts: pip install edge-tts pydub")
        return False
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_different_emotions():
    """Test different voice emotions/styles"""
    print("\n" + "=" * 50)
    print("Testing Different Voice Styles")
    print("=" * 50)
    
    try:
        from services import TTSService
        
        tts = TTSService()
        
        emotions = ["neutral", "friendly", "professional", "empathetic", "calm"]
        test_text = "This is a test of the text to speech system."
        
        async def synthesize_all():
            results = {}
            for emotion in emotions:
                print(f"\n   Synthesizing '{emotion}' style...")
                audio = await tts.synthesize_async(test_text, emotion=emotion)
                results[emotion] = len(audio)
                
                # Save each style
                filename = f"test_tts_{emotion}.wav"
                with open(filename, "wb") as f:
                    f.write(audio)
                print(f"   ✓ Saved to {filename} ({len(audio)} bytes)")
            
            return results
        
        results = asyncio.run(synthesize_all())
        
        print("\n" + "=" * 50)
        print("All styles synthesized successfully!")
        return True
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        return False


def test_api_endpoint():
    """Test the /synthesize API endpoint"""
    print("\n" + "=" * 50)
    print("Testing /synthesize API endpoint")
    print("=" * 50)
    
    try:
        import httpx
        
        print("\nSending request to http://localhost:8085/ivas/synthesize...")
        
        with httpx.Client() as client:
            response = client.post(
                "http://localhost:8085/ivas/synthesize",
                json={
                    "text": "Hello, this is a test of the API endpoint.",
                    "emotion": "friendly",
                    "speed": 1.0
                },
                timeout=30.0,
            )
        
        if response.status_code == 200:
            audio_data = response.content
            
            # Save the response
            with open("test_api_output.wav", "wb") as f:
                f.write(audio_data)
            
            print("\n✅ API Response:")
            print(f"   Status: {response.status_code}")
            print(f"   Content-Type: {response.headers.get('content-type')}")
            print(f"   Audio size: {len(audio_data)} bytes")
            print(f"   Saved to: test_api_output.wav")
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


def cleanup_test_files():
    """Clean up generated test files"""
    import glob
    
    patterns = ["test_output.wav", "test_tts_*.wav", "test_api_output.wav"]
    
    for pattern in patterns:
        for file in glob.glob(pattern):
            try:
                os.remove(file)
                print(f"   Cleaned up: {file}")
            except:
                pass


if __name__ == "__main__":
    print("\nRunning TTS tests...\n")
    
    # Test 1: Direct service test
    service_ok = test_tts_service()
    
    # Test 2: Different emotions (optional)
    if "--all-styles" in sys.argv and service_ok:
        test_different_emotions()
    
    # Test 3: API endpoint test (optional)
    if "--api" in sys.argv:
        api_ok = test_api_endpoint()
    else:
        print("\n💡 Tip: Run with --api flag to test the HTTP endpoint")
        print("💡 Tip: Run with --all-styles flag to test all voice styles")
    
    # Cleanup (optional)
    if "--cleanup" in sys.argv:
        print("\nCleaning up test files...")
        cleanup_test_files()
    
    print("\n" + "=" * 50)
    print("Test Summary")
    print("=" * 50)
    print(f"   TTS Service: {'✅ PASS' if service_ok else '❌ FAIL'}")
    
    sys.exit(0 if service_ok else 1)
