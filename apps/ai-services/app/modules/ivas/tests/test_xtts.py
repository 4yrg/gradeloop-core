"""
Test script for XTTS (Coqui TTS v2) - Natural Human Voice
Tests the XTTS v2 implementation with natural, emotional speech.
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


async def test_xtts_service():
    """Test XTTS service with natural voice samples"""
    
    print("\n" + "="*60)
    print("🎙️  Testing XTTS v2 Service (Natural Human Voice)")
    print("="*60 + "\n")
    
    try:
        # Import XTTSService
        from app.modules.ivas.services import XTTSService
        
        # Initialize XTTS service
        print("1️⃣  Initializing XTTS v2 service...")
        print("    ⏳ First run will download ~1.8GB model, please wait...")
        xtts_service = XTTSService(language="en", use_gpu=False)
        print("✅ XTTS service initialized successfully!\n")
        
        # Test texts simulating viva assessment scenarios
        test_scenarios = [
            {
                "context": "Opening greeting",
                "text": "Hello! Let's begin the viva assessment. I'm here to help you demonstrate your understanding."
            },
            {
                "context": "Asking a question",
                "text": "That's a good start. Can you explain why you chose this particular approach?"
            },
            {
                "context": "Encouragement",
                "text": "Excellent explanation! Your understanding of the concept is quite clear. Let's explore this a bit deeper."
            },
            {
                "context": "Probing deeper",
                "text": "Interesting. What would happen if we changed the input parameters? How would your code handle that?"
            },
            {
                "context": "Positive feedback",
                "text": "That's exactly right! You've demonstrated a solid grasp of error handling. Well done."
            },
            {
                "context": "Gentle correction",
                "text": "I see where you're going with that. However, let me help you think about this differently."
            },
            {
                "context": "Complex question",
                "text": "Now, considering time complexity and space efficiency, how would you optimize this algorithm for large datasets?"
            }
        ]
        
        # Test each scenario
        tests_dir = Path(__file__).parent
        
        for i, scenario in enumerate(test_scenarios, 1):
            print(f"2️⃣  Test {i}/{len(test_scenarios)}: {scenario['context']}")
            print(f"   Text: \"{scenario['text']}\"")
            
            # Measure synthesis time
            start_time = time.time()
            audio_bytes = await xtts_service.synthesize(scenario['text'])
            elapsed_time = time.time() - start_time
            
            print(f"   ✅ Synthesis completed in {elapsed_time:.2f} seconds")
            print(f"   📊 Audio size: {len(audio_bytes):,} bytes")
            
            # Save to file
            output_file = tests_dir / f"xtts_output_{i}.wav"
            with open(output_file, "wb") as f:
                f.write(audio_bytes)
            print(f"   💾 Saved to: {output_file.name}")
            
            # Performance check
            if elapsed_time < 3.0:
                print(f"   ⚡ Performance: EXCELLENT (<3s)")
            elif elapsed_time < 5.0:
                print(f"   ✅ Performance: GOOD (<5s)")
            elif elapsed_time < 10.0:
                print(f"   ⚠️  Performance: ACCEPTABLE (<10s)")
            else:
                print(f"   🐌 Performance: SLOW (>{elapsed_time:.1f}s) - Consider GPU")
            
            print()
        
        print("="*60)
        print("✅ XTTS v2 Service Test Complete!")
        print("="*60)
        print("\n🎧 To verify natural voice quality:")
        print("   1. Listen to xtts_output_1.wav through xtts_output_7.wav")
        print("   2. Check for:")
        print("      • Natural intonation and rhythm")
        print("      • Proper emotional tone")
        print("      • Clear pronunciation")
        print("      • Human-like pacing and pauses")
        print("\n💡 macOS quick test:")
        print("   afplay xtts_output_1.wav")
        print("\n💡 Play all samples:")
        print("   for f in xtts_output_*.wav; do echo \"Playing $f\"; afplay \"$f\"; done")
        print()
        
    except ImportError as e:
        print(f"\n❌ Import Error: {e}")
        print("\n📦 Please install Coqui TTS:")
        print("   pip install TTS==0.22.0")
        print()
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        print()


async def compare_voices():
    """Compare Piper vs XTTS v2 voice quality"""
    print("\n" + "="*60)
    print("🔄 Voice Quality Comparison: Piper vs XTTS v2")
    print("="*60 + "\n")
    
    try:
        from app.modules.ivas.services import TTSService, XTTSService
        
        test_text = "That's a good start. Can you explain why you chose this approach?"
        tests_dir = Path(__file__).parent
        
        # Test Piper
        print("1️⃣  Generating with Piper (basic TTS)...")
        piper_service = TTSService(voice_model="en_US-lessac-medium")
        start_time = time.time()
        piper_audio = await piper_service.synthesize(test_text)
        piper_time = time.time() - start_time
        
        piper_file = tests_dir / "comparison_piper.wav"
        with open(piper_file, "wb") as f:
            f.write(piper_audio)
        print(f"   ✅ Piper: {piper_time:.2f}s, {len(piper_audio):,} bytes")
        print(f"   💾 Saved: {piper_file.name}")
        
        # Test XTTS v2
        print("\n2️⃣  Generating with XTTS v2 (natural voice)...")
        xtts_service = XTTSService(language="en", use_gpu=False)
        start_time = time.time()
        xtts_audio = await xtts_service.synthesize(test_text)
        xtts_time = time.time() - start_time
        
        xtts_file = tests_dir / "comparison_xtts.wav"
        with open(xtts_file, "wb") as f:
            f.write(xtts_audio)
        print(f"   ✅ XTTS v2: {xtts_time:.2f}s, {len(xtts_audio):,} bytes")
        print(f"   💾 Saved: {xtts_file.name}")
        
        print("\n" + "="*60)
        print("📊 Comparison Summary")
        print("="*60)
        print(f"   Piper:    {piper_time:.2f}s - Fast, robotic")
        print(f"   XTTS v2:  {xtts_time:.2f}s - Natural, human-like")
        print(f"   Speed:    Piper is {xtts_time/piper_time:.1f}x faster")
        print(f"\n🎧 Listen to both and compare:")
        print(f"   afplay {piper_file.name}")
        print(f"   afplay {xtts_file.name}")
        print()
        
    except Exception as e:
        print(f"\n❌ Comparison failed: {e}")
        import traceback
        traceback.print_exc()
        print()


async def test_voice_cloning():
    """Test voice cloning with custom reference audio"""
    print("\n" + "="*60)
    print("🎤 Voice Cloning Test")
    print("="*60 + "\n")
    
    try:
        from app.modules.ivas.services import XTTSService
        
        xtts_service = XTTSService(language="en", use_gpu=False)
        
        # Check if reference audio exists
        reference_audio = Path(__file__).parent.parent / "models" / "xtts" / "reference_voice.wav"
        
        if not reference_audio.exists():
            print("ℹ️  No custom reference voice found")
            print(f"   To test voice cloning:")
            print(f"   1. Record 6-10 seconds of clear speech")
            print(f"   2. Save as WAV file: {reference_audio}")
            print(f"   3. Run this test again")
            print("\n   Using default XTTS speaker for now...")
            
            text = "Hello, this is a test of the voice cloning system."
            audio = await xtts_service.synthesize(text)
            
            tests_dir = Path(__file__).parent
            output_file = tests_dir / "voice_clone_default.wav"
            with open(output_file, "wb") as f:
                f.write(audio)
            print(f"   💾 Generated with default voice: {output_file.name}")
        else:
            print(f"✅ Found reference voice: {reference_audio.name}")
            print("   Generating speech with cloned voice...")
            
            text = "Hello, this is a test of voice cloning. The system should mimic the reference speaker's voice characteristics."
            audio = await xtts_service.synthesize(text, speaker_wav=str(reference_audio))
            
            tests_dir = Path(__file__).parent
            output_file = tests_dir / "voice_clone_custom.wav"
            with open(output_file, "wb") as f:
                f.write(audio)
            print(f"   💾 Generated with cloned voice: {output_file.name}")
            print(f"   🎧 Compare reference and cloned:")
            print(f"      afplay {reference_audio}")
            print(f"      afplay {output_file.name}")
        
        print()
        
    except Exception as e:
        print(f"\n❌ Voice cloning test failed: {e}")
        import traceback
        traceback.print_exc()
        print()


if __name__ == "__main__":
    # Run basic XTTS test
    asyncio.run(test_xtts_service())
    
    # Optional: Compare Piper vs XTTS
    # asyncio.run(compare_voices())
    
    # Optional: Test voice cloning
    # asyncio.run(test_voice_cloning())
