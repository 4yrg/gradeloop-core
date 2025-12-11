#!/usr/bin/env python3
"""Simple connection test"""

import asyncio
import json
import websockets


async def test():
    uri = "ws://localhost:8000/ivas/ws/test-123"
    print(f"Connecting to {uri}...")
    
    try:
        async with websockets.connect(uri) as ws:
            print("✅ Connected!")
            msg = await asyncio.wait_for(ws.recv(), timeout=5)
            print(f"Received: {msg}")
            print("\n✅ Test passed!")
    except Exception as e:
        print(f"❌ Error: {e}")

asyncio.run(test())
