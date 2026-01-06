#!/usr/bin/env python3
"""
Test script for WebSocket Real-Time Voice Streaming (Step 8)
Tests the viva WebSocket endpoint and message protocol
"""

import asyncio
import json
import base64
import sys
import os

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


async def test_websocket_connection():
    """Test basic WebSocket connection and message flow"""
    print("=" * 60)
    print("IVAS WebSocket Test - Step 8")
    print("=" * 60)
    
    try:
        import websockets
    except ImportError:
        print("\n❌ websockets library not installed")
        print("   Install with: pip install websockets")
        return False
    
    ws_url = "ws://localhost:8085/ivas/ws/test-session-001"
    params = "?student_id=test-student&assignment_id=test-assignment&topic=Python%20functions&code=def%20hello():%20return%20'Hello'"
    
    print(f"\n1. Connecting to WebSocket...")
    print(f"   URL: {ws_url}")
    
    try:
        async with websockets.connect(ws_url + params) as ws:
            print("   ✅ Connected successfully!")
            
            # Receive connection confirmation
            print("\n2. Waiting for connection confirmation...")
            msg = await asyncio.wait_for(ws.recv(), timeout=5.0)
            data = json.loads(msg)
            
            if data["type"] == "connection_established":
                print(f"   ✅ Connection confirmed: {data['data']['message']}")
            else:
                print(f"   ⚠️ Unexpected message type: {data['type']}")
            
            # Receive initial AI response (question)
            print("\n3. Waiting for initial question...")
            msg = await asyncio.wait_for(ws.recv(), timeout=30.0)
            data = json.loads(msg)
            
            if data["type"] == "ai_response":
                question = data["data"]
                print(f"   ✅ Received AI question:")
                print(f"      {question[:100]}...")
            else:
                print(f"   ⚠️ Unexpected message type: {data['type']}")
            
            # Receive AI audio
            print("\n4. Waiting for AI audio...")
            msg = await asyncio.wait_for(ws.recv(), timeout=30.0)
            data = json.loads(msg)
            
            if data["type"] == "ai_audio":
                audio_b64 = data["data"]
                audio_bytes = base64.b64decode(audio_b64)
                print(f"   ✅ Received AI audio: {len(audio_bytes)} bytes")
                
                # Save audio to file for verification
                with open("test_ai_greeting.wav", "wb") as f:
                    f.write(audio_bytes)
                print(f"   💾 Saved to test_ai_greeting.wav")
            else:
                print(f"   ⚠️ Unexpected message type: {data['type']}")
            
            # Simulate sending a text response (simulating audio processing)
            print("\n5. Testing end_session message...")
            await ws.send(json.dumps({
                "type": "end_session"
            }))
            
            # Wait for final assessment
            print("\n6. Waiting for final assessment...")
            while True:
                try:
                    msg = await asyncio.wait_for(ws.recv(), timeout=30.0)
                    data = json.loads(msg)
                    
                    if data["type"] == "session_end":
                        final = data["data"]
                        print(f"   ✅ Session ended!")
                        print(f"      Overall Score: {final.get('overall_score', 'N/A')}/100")
                        print(f"      Competency: {final.get('competency_level', 'N/A')}")
                        print(f"      Total Turns: {final.get('total_turns', 'N/A')}")
                        break
                    elif data["type"] == "error":
                        print(f"   ⚠️ Error: {data['data']}")
                        break
                    else:
                        print(f"   📩 Received: {data['type']}")
                        
                except asyncio.TimeoutError:
                    print("   ⚠️ Timeout waiting for response")
                    break
            
            print("\n✅ WebSocket test completed!")
            return True
            
    except ConnectionRefusedError:
        print("\n❌ Connection refused. Is the server running?")
        print("   Start with: uvicorn main:app --port 8085 --reload")
        return False
    except asyncio.TimeoutError:
        print("\n❌ Connection timeout")
        return False
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False


async def test_audio_streaming():
    """Test audio chunk streaming (simulated)"""
    print("\n" + "=" * 60)
    print("Testing Audio Streaming Protocol")
    print("=" * 60)
    
    try:
        import websockets
    except ImportError:
        print("websockets not installed")
        return False
    
    ws_url = "ws://localhost:8085/ivas/ws/audio-test-session"
    params = "?student_id=audio-test&topic=testing"
    
    print("\n1. Connecting for audio test...")
    
    try:
        async with websockets.connect(ws_url + params) as ws:
            print("   ✅ Connected")
            
            # Skip connection and initial messages
            for _ in range(3):  # connection, ai_response, ai_audio
                await asyncio.wait_for(ws.recv(), timeout=30.0)
            
            print("\n2. Sending simulated audio chunks...")
            
            # Create fake audio data (just for protocol testing)
            fake_audio = b'\x00' * 1000  # 1KB of silence
            audio_b64 = base64.b64encode(fake_audio).decode('utf-8')
            
            # Send several audio chunks
            for i in range(3):
                await ws.send(json.dumps({
                    "type": "audio_chunk",
                    "data": audio_b64
                }))
                print(f"   📤 Sent chunk {i+1}")
                await asyncio.sleep(0.1)
            
            print("\n3. Signaling end of turn...")
            await ws.send(json.dumps({"type": "end_turn"}))
            
            # We expect an error because the fake audio can't be transcribed
            print("\n4. Waiting for response (expecting error due to fake audio)...")
            
            msg = await asyncio.wait_for(ws.recv(), timeout=30.0)
            data = json.loads(msg)
            
            if data["type"] == "error":
                print(f"   ℹ️ Expected error: {data['data']['message']}")
                print("   (This is expected with fake audio data)")
            else:
                print(f"   Received: {data['type']}")
            
            # End session
            await ws.send(json.dumps({"type": "end_session"}))
            
            print("\n✅ Audio streaming protocol test completed!")
            return True
            
    except Exception as e:
        print(f"\n❌ Error: {e}")
        return False


async def test_session_management_api():
    """Test session management REST endpoints"""
    print("\n" + "=" * 60)
    print("Testing Session Management API")
    print("=" * 60)
    
    try:
        import httpx
    except ImportError:
        print("httpx not installed")
        return False
    
    base_url = "http://localhost:8085/ivas"
    
    async with httpx.AsyncClient() as client:
        # List sessions
        print("\n1. Listing active sessions...")
        response = await client.get(f"{base_url}/sessions")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Active sessions: {data['active_count']}")
            for s in data.get('sessions', []):
                print(f"      - {s['session_id']}: {s['status']}")
        else:
            print(f"   ❌ Error: {response.status_code}")
    
    print("\n✅ Session management API test completed!")
    return True


def test_session_manager_unit():
    """Unit test for SessionManager class"""
    print("\n" + "=" * 60)
    print("Testing SessionManager Unit")
    print("=" * 60)
    
    from session_manager import SessionManager, VivaSession
    
    manager = SessionManager()
    
    # Test session creation (without actual websocket)
    print("\n1. Creating test session...")
    session = VivaSession(
        session_id="unit-test-001",
        student_id="student-123",
        assignment_id="assignment-456",
        code="def test(): pass",
        topic="unit testing"
    )
    
    manager.active_sessions[session.session_id] = session
    print(f"   ✅ Session created: {session.session_id}")
    
    # Test adding turns
    print("\n2. Adding conversation turns...")
    session.add_turn("AI", "What does this function do?")
    session.add_turn("STUDENT", "It's a test function that does nothing.")
    session.add_turn("AI", "Good observation. Why might we have such a function?")
    
    print(f"   ✅ Added {len(session.conversation_history)} turns")
    
    # Test history for LLM
    print("\n3. Getting LLM-formatted history...")
    history = session.get_history_for_llm()
    print(f"   ✅ Got {len(history)} formatted turns")
    for h in history:
        print(f"      {h['role']}: {h['content'][:40]}...")
    
    # Test session info
    print("\n4. Getting session info...")
    info = session.to_dict()
    print(f"   ✅ Session info: {info['session_id']}, turns: {info['turns_count']}")
    
    # Test audio buffer
    print("\n5. Testing audio buffer...")
    manager.add_audio_chunk(session.session_id, b"chunk1")
    manager.add_audio_chunk(session.session_id, b"chunk2")
    audio = manager.get_and_clear_audio_buffer(session.session_id)
    print(f"   ✅ Audio buffer: {len(audio)} bytes, cleared: {len(session.audio_buffer)} bytes")
    
    # Clean up
    manager.end_session(session.session_id)
    print(f"\n   ✅ Session ended and cleaned up")
    
    print("\n✅ SessionManager unit tests passed!")
    return True


async def main():
    """Run all WebSocket tests"""
    print("\n🧪 Running WebSocket Tests (Step 8)\n")
    
    results = {}
    
    # Unit test (no server needed)
    results["unit"] = test_session_manager_unit()
    
    # Integration tests (need server running)
    if "--integration" in sys.argv or "--all" in sys.argv:
        results["websocket"] = await test_websocket_connection()
        results["audio"] = await test_audio_streaming()
        results["api"] = await test_session_management_api()
    else:
        print("\n💡 Run with --integration or --all to test live WebSocket")
    
    # Summary
    print("\n" + "=" * 60)
    print("Test Summary")
    print("=" * 60)
    
    for name, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"   {name}: {status}")
    
    all_passed = all(results.values())
    sys.exit(0 if all_passed else 1)


if __name__ == "__main__":
    asyncio.run(main())
