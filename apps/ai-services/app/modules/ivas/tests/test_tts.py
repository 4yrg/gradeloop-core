"""
Test script for TTS (Text-to-Speech) service.
Tests the Piper TTS implementation with sample text.
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


async def test_tts_service():
    """Test TTS service with sample text"""
    
    print("\n" + "="*60)
    print("🔊 Testing TTS Service (Piper)")
    print("="*60 + "\n")
    
    try:
        # Import TTSService
        from app.modules.ivas.services import TTSService
        
        # Initialize TTS service
        print("1️⃣  Initializing TTS service...")
        tts_service = TTSService(voice_model="en_US-lessac-medium")
        print("✅ TTS service initialized successfully!\n")
        
        # Test text
        test_texts = [
            "Hello, let's begin the viva assessment.",
            "Can you explain how your code handles edge cases?",
            "That's a good answer. Let's move to the next question.",
            "The quick brown fox jumps over the lazy dog."
            "This is a longer test sentence to evaluate the performance of the text-to-speech synthesis system. We want to see how well it handles more complex and lengthy inputs, ensuring clarity and naturalness in the generated speech. Let's assess its capabilities thoroughly. it's important to have high-quality TTS for our applications."
        ]
        
        # Test each text sample
        for i, text in enumerate(test_texts, 1):
            print(f"2️⃣  Test {i}/{len(test_texts)}: Synthesizing text...")
            print(f"   Text: \"{text}\"")
            
            # Measure synthesis time
            start_time = time.time()
            audio_bytes = await tts_service.synthesize(text)
            elapsed_time = time.time() - start_time
            
            print(f"   ✅ Synthesis completed in {elapsed_time:.2f} seconds")
            print(f"   📊 Audio size: {len(audio_bytes):,} bytes")
            
            # Save to file in tests directory
            tests_dir = Path(__file__).parent
            output_file = tests_dir / f"test_output_{i}.wav"
            with open(output_file, "wb") as f:
                f.write(audio_bytes)
            print(f"   💾 Saved to: {output_file}")
            
            # Check performance
            if elapsed_time < 1.0:
                print(f"   ⚡ Performance: EXCELLENT (<1s)")
            elif elapsed_time < 3.0:
                print(f"   ✅ Performance: GOOD (<3s)")
            else:
                print(f"   ⚠️  Performance: SLOW (>{elapsed_time:.1f}s)")
            
            print()
        
        print("="*60)
        print("✅ TTS Service Test Complete!")
        print("="*60)
        print("\n📋 To verify audio quality:")
        print("   1. Open test_output_1.wav in your media player")
        print("   2. Check if speech is clear and natural-sounding")
        print("   3. Verify correct pronunciation")
        print("\n💡 macOS quick test:")
        print("   afplay test_output_1.wav")
        print()
        
    except FileNotFoundError as e:
        print(f"\n❌ Model files not found: {e}")
        print("\n📦 Please download Piper voice model:")
        print("   1. Visit: https://github.com/rhasspy/piper/releases/tag/v1.2.0")
        print("   2. Download 'en_US-lessac-medium' voice:")
        print("      - voice-en_US-lessac-medium.tar.gz")
        print("   3. Extract files to: apps/ai-services/models/piper/")
        print("      Required files:")
        print("      - en_US-lessac-medium.onnx")
        print("      - en_US-lessac-medium.onnx.json")
        print("\n   Or use this command:")
        print("   cd apps/ai-services/models/piper/")
        print("   wget https://github.com/rhasspy/piper/releases/download/v1.2.0/voice-en_US-lessac-medium.tar.gz")
        print("   tar -xzf voice-en_US-lessac-medium.tar.gz")
        print()
    except ImportError as e:
        print(f"\n❌ Import Error: {e}")
        print("\n📦 Please install piper-tts:")
        print("   pip install piper-tts pydub")
        print()
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        print()


async def benchmark_tts():
    """Benchmark TTS performance"""
    print("\n" + "="*60)
    print("⚡ TTS Performance Benchmark")
    print("="*60 + "\n")
    
    try:
        from app.modules.ivas.services import TTSService
        
        tts_service = TTSService(voice_model="en_US-lessac-medium")
        
        # Test different text lengths
        test_cases = [
            ("Short", "Hello world."),
            ("Medium", "Hello, let's begin the viva assessment. Can you explain your approach?"),
            ("Long", "Hello, let's begin the viva assessment. Can you explain how your code handles edge cases? I'm particularly interested in understanding your error handling strategy and how you ensure data validation.")
        ]
        
        for name, text in test_cases:
            print(f"Testing {name} text ({len(text)} chars)...")
            
            times = []
            num_runs = 3
            
            for i in range(num_runs):
                start_time = time.time()
                audio_bytes = await tts_service.synthesize(text)
                elapsed = time.time() - start_time
                times.append(elapsed)
            
            avg_time = sum(times) / len(times)
            print(f"   Average: {avg_time:.2f}s")
            print(f"   Audio size: {len(audio_bytes):,} bytes")
            print()
        
        print("="*60)
        print("✅ TTS Benchmark Complete!")
        print("="*60 + "\n")
        
    except Exception as e:
        print(f"❌ Benchmark failed: {e}\n")


async def play_audio_test():
    """Generate and play a test audio (macOS only)"""
    print("\n" + "="*60)
    print("🎵 Generate and Play Test Audio")
    print("="*60 + "\n")
    
    try:
        import subprocess
        import sys
        
        if sys.platform != "darwin":
            print("⚠️  Audio playback test only available on macOS")
            return
        
        from app.modules.ivas.services import TTSService
        
        print("1️⃣  Initializing TTS service...")
        tts_service = TTSService(voice_model="en_US-lessac-medium")
        
        test_text = "Hello, let's begin the viva assessment."
        print(f"2️⃣  Generating audio: \"{test_text}\"")
        
        audio_bytes = await tts_service.synthesize(test_text)
        
        output_file = Path("test_playback.wav")
        with open(output_file, "wb") as f:
            f.write(audio_bytes)
        
        print(f"3️⃣  Playing audio...")
        subprocess.run(["afplay", str(output_file)], check=True)
        
        print("✅ Playback complete!\n")
        
    except Exception as e:
        print(f"❌ Playback test failed: {e}\n")


if __name__ == "__main__":
    # Run basic test
    asyncio.run(test_tts_service())
    
    # Optional: Run benchmark
    # asyncio.run(benchmark_tts())
    
    # Optional: Test with audio playback (macOS)
    # asyncio.run(play_audio_test())
