#!/usr/bin/env python3
"""
Simple WebSocket client to test IVAS real-time viva endpoint.

Usage:
    python test_websocket.py
"""

import asyncio
import json
import websockets
import base64
from pathlib import Path


async def test_websocket():
    """Test WebSocket connection and basic message flow"""
    
    uri = "ws://localhost:8000/ivas/ws/test-session-123"
    
    print(f"🔌 Connecting to {uri}...")
    
    async with websockets.connect(uri) as websocket:
        print("✅ WebSocket connected!")
        
        # Wait for connection message
        response = await websocket.recv()
        print(f"📩 Received: {response}")
        
        # Start session
        print("\n🎯 Starting session...")
        session_start = {
            "type": "session_start",
            "data": {
                "student_id": "CS2021001",
                "student_name": "John Doe",
                "lab_assignment": "Write a Python function to reverse a string without using built-in reverse methods.",
                "student_code": "def reverse_string(s):\n    return s[::-1]"
            }
        }
        
        await websocket.send(json.dumps(session_start))
        print("📤 Sent session_start")
        
        # Wait for session started confirmation
        response = await websocket.recv()
        print(f"📩 Received: {response}")
        
        # Wait for first AI question (text)
        response = await websocket.recv()
        data = json.loads(response)
        print(f"\n🤖 AI Question (text): {data.get('data', {}).get('text', '')}")
        
        # Wait for first AI question (audio)
        response = await websocket.recv()
        data = json.loads(response)
        print(f"🔊 AI Audio received: {len(data.get('data', {}).get('audio', ''))} bytes (base64)")
        
        # Simulate sending audio chunk
        print("\n🎤 Simulating audio chunk...")
        
        # Create a dummy audio chunk (in real scenario, this would be from microphone)
        # For testing, we'll send empty bytes
        dummy_audio = b"dummy_audio_data_would_be_here"
        audio_b64 = base64.b64encode(dummy_audio).decode('utf-8')
        
        audio_message = {
            "type": "audio_chunk",
            "data": {
                "audio": audio_b64,
                "format": "webm",
                "is_final": True  # Mark as final to trigger processing
            }
        }
        
        await websocket.send(json.dumps(audio_message))
        print("📤 Sent audio_chunk (note: dummy data, will fail ASR)")
        
        # Wait for responses
        print("\n⏳ Waiting for responses...")
        
        try:
            # Set timeout for responses
            response = await asyncio.wait_for(websocket.recv(), timeout=10.0)
            print(f"📩 Response 1: {response}")
            
            response = await asyncio.wait_for(websocket.recv(), timeout=10.0)
            print(f"📩 Response 2: {response}")
            
        except asyncio.TimeoutError:
            print("⏱️  Timeout waiting for response (expected with dummy audio)")
        except Exception as e:
            print(f"❌ Error: {e}")
        
        # End session
        print("\n🛑 Ending session...")
        session_end = {
            "type": "session_end",
            "data": {}
        }
        
        await websocket.send(json.dumps(session_end))
        print("📤 Sent session_end")
        
        # Wait for final message
        try:
            response = await asyncio.wait_for(websocket.recv(), timeout=2.0)
            print(f"📩 Final: {response}")
        except:
            pass
        
        print("\n✅ Test complete!")


async def test_connection_only():
    """Test just connection and session start"""
    
    uri = "ws://localhost:8000/ivas/ws/test-connection-456"
    
    print(f"🔌 Testing connection to {uri}...")
    
    try:
        async with websockets.connect(uri) as websocket:
            print("✅ Connection successful!")
            
            # Receive connection message
            response = await websocket.recv()
            data = json.loads(response)
            print(f"📩 Server says: {data}")
            
            print("\n✅ Basic connection test passed!")
            
    except Exception as e:
        print(f"❌ Connection failed: {e}")


if __name__ == "__main__":
    print("=" * 60)
    print("IVAS WebSocket Test Client")
    print("=" * 60)
    print()
    
    print("Test 1: Basic Connection")
    print("-" * 60)
    asyncio.run(test_connection_only())
    
    print("\n\nTest 2: Full Session Flow (with dummy audio)")
    print("-" * 60)
    print("Note: This will fail at ASR stage (expected - dummy audio)")
    print()
    
    try:
        asyncio.run(test_websocket())
    except KeyboardInterrupt:
        print("\n\n⚠️  Test interrupted by user")
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
