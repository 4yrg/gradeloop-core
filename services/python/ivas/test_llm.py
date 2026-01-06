#!/usr/bin/env python3
"""
Test script for LLM (Large Language Model) Service
Tests question generation and response assessment using Ollama
"""

import sys
import os

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


def test_llm_service():
    """Test the LLM service directly"""
    print("=" * 50)
    print("IVAS LLM Service Test")
    print("=" * 50)
    
    try:
        from services import LLMService
        
        llm = LLMService()
        print(f"\n1. LLM Service created")
        print(f"   Model: {llm.model}")
        print(f"   Is available: {llm.is_available}")
        
        if not llm.is_available:
            print("\n   ⚠️  Ollama not available. Make sure Ollama is running:")
            print("      ollama serve")
            print("      ollama pull llama3.1:8b")
            return False
        
        # Test code sample
        test_code = '''
def fibonacci(n):
    """Calculate the nth Fibonacci number."""
    if n <= 0:
        return 0
    elif n == 1:
        return 1
    else:
        return fibonacci(n-1) + fibonacci(n-2)

# Test
print(fibonacci(10))
'''
        
        print("\n2. Testing Question Generation...")
        print(f"   Topic: Recursion and Fibonacci")
        print(f"   Difficulty: medium")
        
        result = llm.generate_question(
            code=test_code,
            topic="Recursion and Fibonacci",
            difficulty="medium"
        )
        
        print("\n" + "=" * 50)
        print("QUESTION GENERATION RESULT:")
        print("=" * 50)
        print(f"   Question: {result['question']}")
        print(f"   Difficulty: {result['difficulty']}")
        print(f"   Topic: {result['topic']}")
        print(f"   Hints: {result.get('follow_up_hints', [])}")
        
        # Test response assessment
        print("\n3. Testing Response Assessment...")
        
        test_response = "The fibonacci function calculates the nth Fibonacci number using recursion. It has a base case for n=0 and n=1, and for other values it recursively calls itself twice."
        
        assessment = llm.assess_response(
            question=result['question'],
            response=test_response,
            expected_concepts=["recursion", "base case", "fibonacci sequence"],
            code_context=test_code
        )
        
        print("\n" + "=" * 50)
        print("ASSESSMENT RESULT:")
        print("=" * 50)
        print(f"   Understanding Level: {assessment['understanding_level']}")
        print(f"   Clarity: {assessment['clarity']}")
        print(f"   Confidence Score: {assessment['confidence_score']}")
        print(f"   Strengths: {assessment.get('strengths', [])}")
        print(f"   Misconceptions: {assessment.get('misconceptions', [])}")
        print(f"   Areas to Improve: {assessment.get('areas_for_improvement', [])}")
        print(f"   Suggested Follow-up: {assessment.get('suggested_follow_up', '')}")
        
        print("\n✅ LLM Service test completed successfully!")
        return True
        
    except ImportError as e:
        print(f"\n❌ Import error: {e}")
        print("   Install ollama: pip install ollama")
        return False
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_final_assessment():
    """Test final assessment generation"""
    print("\n" + "=" * 50)
    print("Testing Final Assessment Generation")
    print("=" * 50)
    
    try:
        from services import LLMService
        
        llm = LLMService()
        
        if not llm.is_available:
            print("⚠️  Ollama not available")
            return False
        
        test_code = '''
def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        for j in range(0, n-i-1):
            if arr[j] > arr[j+1]:
                arr[j], arr[j+1] = arr[j+1], arr[j]
    return arr
'''
        
        conversation = [
            {"role": "assistant", "content": "Can you explain what bubble sort does?"},
            {"role": "user", "content": "It sorts an array by comparing adjacent elements and swapping them if they're in the wrong order."},
            {"role": "assistant", "content": "Good! What's the time complexity of bubble sort?"},
            {"role": "user", "content": "I think it's O(n^2) because of the nested loops."},
            {"role": "assistant", "content": "Correct! Can you think of when bubble sort might be efficient?"},
            {"role": "user", "content": "When the array is almost sorted already, because it won't need many swaps."},
        ]
        
        print("\n   Generating final assessment for bubble sort conversation...")
        
        result = llm.generate_final_assessment(
            code=test_code,
            conversation_history=conversation
        )
        
        print("\n" + "=" * 50)
        print("FINAL ASSESSMENT:")
        print("=" * 50)
        print(f"   Overall Score: {result['overall_score']}/100")
        print(f"   Competency Level: {result['competency_level']}")
        print(f"   Strengths: {result.get('strengths', [])}")
        print(f"   Weaknesses: {result.get('weaknesses', [])}")
        print(f"   Misconceptions: {result.get('misconceptions', [])}")
        print(f"\n   Analysis: {result.get('full_analysis', '')[:200]}...")
        
        print("\n✅ Final assessment test completed!")
        return True
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_api_endpoints():
    """Test the LLM API endpoints"""
    print("\n" + "=" * 50)
    print("Testing LLM API Endpoints")
    print("=" * 50)
    
    try:
        import httpx
        
        base_url = "http://localhost:8085/ivas"
        
        # Test generate-question
        print("\n1. Testing /generate-question endpoint...")
        
        response = httpx.post(
            f"{base_url}/generate-question",
            json={
                "code": "def hello(): return 'Hello World'",
                "topic": "Python functions",
                "difficulty": "easy"
            },
            timeout=60.0
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"   ✅ Question generated: {result['question'][:80]}...")
        else:
            print(f"   ❌ Error: {response.status_code} - {response.text}")
            return False
        
        # Test assess-response
        print("\n2. Testing /assess-response endpoint...")
        
        response = httpx.post(
            f"{base_url}/assess-response",
            json={
                "question": "What does the hello function do?",
                "response": "The hello function returns the string 'Hello World' when called.",
                "expected_concepts": ["function", "return statement", "string"],
            },
            timeout=60.0
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"   ✅ Assessment: {result['understanding_level']}, confidence: {result['confidence_score']}")
        else:
            print(f"   ❌ Error: {response.status_code} - {response.text}")
            return False
        
        print("\n✅ API endpoint tests completed!")
        return True
        
    except httpx.ConnectError:
        print("\n⚠️  Could not connect to API. Is the server running?")
        print("   Start with: uvicorn main:app --port 8085")
        return False
    except Exception as e:
        print(f"\n❌ Error: {e}")
        return False


if __name__ == "__main__":
    print("\nRunning LLM tests...\n")
    
    # Test 1: Direct service test
    service_ok = test_llm_service()
    
    # Test 2: Final assessment (optional)
    if "--full" in sys.argv and service_ok:
        test_final_assessment()
    
    # Test 3: API endpoints (optional)
    if "--api" in sys.argv:
        api_ok = test_api_endpoints()
    else:
        print("\n💡 Tip: Run with --api flag to test HTTP endpoints")
        print("💡 Tip: Run with --full flag to test final assessment")
    
    print("\n" + "=" * 50)
    print("Test Summary")
    print("=" * 50)
    print(f"   LLM Service: {'✅ PASS' if service_ok else '❌ FAIL'}")
    
    sys.exit(0 if service_ok else 1)
