"""
Test script for ASR (Automatic Speech Recognition) service.
Tests the Faster-Whisper implementation with sample audio.
"""

import asyncio
import time
import logging
import sys
from pathlib import Path
import os

# Add the ai-services directory to Python path
# From test file: tests/ -> ivas/ -> modules/ -> app/ -> ai-services/
ai_services_dir = Path(__file__).resolve().parent.parent.parent.parent.parent
sys.path.insert(0, str(ai_services_dir))

# Change to ai-services directory so relative paths work
os.chdir(str(ai_services_dir))

print(f"Working directory: {os.getcwd()}")
print(f"Python path includes: {ai_services_dir}")

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


async def test_asr_service():
    """Test ASR service with sample audio"""
    
    print("\n" + "="*60)
    print("🎤 Testing ASR Service (Faster-Whisper)")
    print("="*60 + "\n")
    
    try:
        # Import ASRService
        from app.modules.ivas.services import ASRService
        
        # Initialize ASR service
        print("1️⃣  Initializing ASR service...")
        asr_service = ASRService(model_size="base", device="cpu")
        print("✅ ASR service initialized successfully!\n")
        
        # Test with sample audio
        # Option 1: Use a test audio file if available
        test_audio_path = Path(__file__).parent.parent / "models" / "whisper" / "Southern Province 4.m4a"
        
        if test_audio_path.exists():
            print(f"2️⃣  Testing with audio file: {test_audio_path}")
            with open(test_audio_path, "rb") as f:
                audio_bytes = f.read()
            
            # Measure transcription time
            start_time = time.time()
            transcription = await asr_service.transcribe(audio_bytes)
            elapsed_time = time.time() - start_time
            
            print(f"\n✅ Transcription completed in {elapsed_time:.2f} seconds")
            print(f"\n📝 Transcription Result:")
            print(f"   \"{transcription}\"")
            print()
            
        else:
            print("⚠️  No test audio file found at 'test_audio.wav'")
            print("\n📋 To test with real audio:")
            print("   1. Place a WAV audio file at: test_audio.wav")
            print("   2. Run this script again")
            print("   3. You can record a 5-second voice memo on your phone")
            print("      saying 'This is a test of the speech recognition system'")
            print("\n💡 Alternatively, you can generate test audio using:")
            print("   - macOS: 'say \"Hello world\" -o test_audio.wav --data-format=LEI16@22050'")
            print("   - Or record via QuickTime Player and export as WAV")
            print()
            
            # Try to generate test audio on macOS
            import subprocess
            import sys
            
            if sys.platform == "darwin":  # macOS
                print("3️⃣  Generating test audio with macOS 'say' command...")
                try:
                    test_text = "This is a test of the automatic speech recognition system. The quick brown fox jumps over the lazy dog."
                    subprocess.run([
                        "say", test_text,
                        "-o", str(test_audio_path),
                        "--data-format=LEI16@22050"
                    ], check=True)
                    print(f"✅ Generated test audio: {test_audio_path}\n")
                    
                    # Now test with generated audio
                    with open(test_audio_path, "rb") as f:
                        audio_bytes = f.read()
                    
                    print(f"4️⃣  Testing transcription...")
                    start_time = time.time()
                    transcription = await asr_service.transcribe(audio_bytes)
                    elapsed_time = time.time() - start_time
                    
                    print(f"\n✅ Transcription completed in {elapsed_time:.2f} seconds")
                    print(f"\n📝 Original text:")
                    print(f"   \"{test_text}\"")
                    print(f"\n📝 Transcription result:")
                    print(f"   \"{transcription}\"")
                    print()
                    
                    # Check accuracy
                    if "test" in transcription.lower() and "speech" in transcription.lower():
                        print("✅ Transcription accuracy: GOOD (key words detected)")
                    else:
                        print("⚠️  Transcription may not be accurate (check results above)")
                    
                except subprocess.CalledProcessError as e:
                    print(f"❌ Failed to generate test audio: {e}")
            else:
                print("ℹ️  Automatic audio generation only available on macOS")
        
        print("\n" + "="*60)
        print("✅ ASR Service Test Complete!")
        print("="*60 + "\n")
        
    except ImportError as e:
        print(f"\n❌ Import Error: {e}")
        print("\n📦 Please install faster-whisper:")
        print("   pip install faster-whisper")
        print()
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        print()


async def benchmark_asr():
    """Benchmark ASR performance"""
    print("\n" + "="*60)
    print("⚡ ASR Performance Benchmark")
    print("="*60 + "\n")
    
    try:
        from app.modules.ivas.services import ASRService
        
        # Test different audio durations
        test_audio_path = Path(__file__).parent / "test_audio.wav"
        
        if not test_audio_path.exists():
            print("⚠️  No test audio file found. Skipping benchmark.")
            return
        
        asr_service = ASRService(model_size="base", device="cpu")
        
        with open(test_audio_path, "rb") as f:
            audio_bytes = f.read()
        
        # Run multiple times for average
        num_runs = 3
        times = []
        
        print(f"Running {num_runs} transcription iterations...\n")
        
        for i in range(num_runs):
            start_time = time.time()
            transcription = await asr_service.transcribe(audio_bytes)
            elapsed = time.time() - start_time
            times.append(elapsed)
            print(f"  Run {i+1}: {elapsed:.2f}s")
        
        avg_time = sum(times) / len(times)
        print(f"\n📊 Average transcription time: {avg_time:.2f} seconds")
        
        if avg_time < 2.0:
            print("✅ Performance: EXCELLENT (<2s)")
        elif avg_time < 5.0:
            print("✅ Performance: GOOD (<5s)")
        else:
            print("⚠️  Performance: Consider using smaller model or GPU")
        
        print()
        
    except Exception as e:
        print(f"❌ Benchmark failed: {e}\n")


if __name__ == "__main__":
    # Run basic test
    asyncio.run(test_asr_service())
    
    # Optional: Run benchmark
    # asyncio.run(benchmark_asr())
