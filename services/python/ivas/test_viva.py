"""
Simple test script for IVAS
Tests the complete flow without requiring audio files
"""
import requests
import json
import time

BASE_URL = "http://localhost:8085"

def test_health():
    """Test health endpoint"""
    print("\n" + "="*60)
    print("TEST 1: Health Check")
    print("="*60)
    
    response = requests.get(f"{BASE_URL}/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    return response.status_code == 200


def test_start_viva():
    """Test starting a viva session"""
    print("\n" + "="*60)
    print("TEST 2: Start Viva Session")
    print("="*60)
    
    payload = {
        "student_id": "test_student_123",
        "assignment_title": "Recursion and Backtracking",
        "assignment_description": "Implement recursive algorithms to solve problems like factorial, fibonacci, and N-Queens",
        "student_code": """
def factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n - 1)

def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)
"""
    }
    
    print("\nSending request to start viva...")
    response = requests.post(f"{BASE_URL}/viva/start", json=payload)
    
    if response.status_code != 200:
        print(f"Error: {response.status_code}")
        print(response.text)
        return None
    
    data = response.json()
    print(f"\n✓ Session started successfully!")
    print(f"Session ID: {data['session_id']}")
    print(f"\nQuestion 1:")
    print(f"{data['question']['question_text']}")
    print(f"\nAudio generated: {len(data['question_audio'])} hex characters")
    
    return data['session_id']


def test_get_session(session_id):
    """Test getting session details"""
    print("\n" + "="*60)
    print("TEST 3: Get Session Details")
    print("="*60)
    
    response = requests.get(f"{BASE_URL}/viva/session/{session_id}")
    
    if response.status_code != 200:
        print(f"Error: {response.status_code}")
        return
    
    data = response.json()
    print(f"\nSession Status:")
    print(f"  Current Question: {data['current_question']}")
    print(f"  Questions Answered: {data['questions_answered']}")
    print(f"  Complete: {data['is_complete']}")


def simulate_answer(session_id, question_number, answer_text):
    """
    Simulate answering a question
    Note: This requires actual audio file in production
    For testing, you would need to:
    1. Create a WAV file with the answer
    2. Or use text-to-speech to generate it
    3. Then submit it here
    """
    print(f"\n--- Simulating Answer to Question {question_number} ---")
    print(f"Answer text (would be spoken): {answer_text}")
    print("\nNote: To actually test this, you need to:")
    print("  1. Record audio saying the answer")
    print("  2. Save as answer.wav")
    print("  3. Submit using:")
    print(f"     curl -X POST \"{BASE_URL}/viva/answer?session_id={session_id}&question_number={question_number}\" \\")
    print(f"          -F \"audio=@answer.wav\"")


def main():
    """Run all tests"""
    print("\n" + "="*60)
    print("🧪 IVAS TEST SUITE")
    print("="*60)
    print("\nMake sure:")
    print("  1. Ollama is running: ollama serve")
    print("  2. IVAS server is running: python main.py")
    print("  3. All services are healthy")
    
    time.sleep(2)
    
    # Test 1: Health Check
    if not test_health():
        print("\n❌ Health check failed! Make sure server is running.")
        return
    
    time.sleep(1)
    
    # Test 2: Start Viva
    session_id = test_start_viva()
    if not session_id:
        print("\n❌ Failed to start viva session!")
        return
    
    time.sleep(1)
    
    # Test 3: Get Session
    test_get_session(session_id)
    
    # Simulate answers (informational only)
    print("\n" + "="*60)
    print("SIMULATED VIVA FLOW")
    print("="*60)
    
    sample_answers = [
        "Recursion is when a function calls itself. In the factorial function, we call factorial with n-1 until we reach the base case of n=1.",
        "The time complexity is exponential for the naive recursive approach. For fibonacci it's O(2^n) because each call branches into two more calls.",
        "We could optimize using memoization to store previously calculated values, reducing time complexity to O(n).",
        "The base case is crucial to prevent infinite recursion. Without it, the function would call itself forever.",
        "Dynamic programming can be used to solve this more efficiently by building up solutions from smaller subproblems."
    ]
    
    for i, answer in enumerate(sample_answers, 1):
        simulate_answer(session_id, i, answer)
        time.sleep(0.5)
    
    print("\n" + "="*60)
    print("MANUAL TESTING GUIDE")
    print("="*60)
    print("\nTo complete the full test:")
    print("1. Go to http://localhost:8085/docs")
    print("2. Use the interactive Swagger UI")
    print("3. Try POST /viva/answer with a real audio file")
    print("4. Repeat 5 times to get the final report")
    print("\nOr use curl + audio recording:")
    print("  # Record your answer (macOS)")
    print("  rec -r 16000 -c 1 answer.wav")
    print("  # Press Ctrl+C when done")
    print("")
    print("  # Submit the answer")
    print(f"  curl -X POST \"{BASE_URL}/viva/answer?session_id={session_id}&question_number=1\" \\")
    print("       -F \"audio=@answer.wav\"")
    
    print("\n✓ Test suite completed!")


if __name__ == "__main__":
    try:
        main()
    except requests.exceptions.ConnectionError:
        print("\n❌ Cannot connect to IVAS server!")
        print("Make sure the server is running:")
        print("  cd /Users/mpssj/all/code/uni/gradeloop-core/services/python/ivas")
        print("  source venv/bin/activate")
        print("  python main.py")
    except Exception as e:
        print(f"\n❌ Error: {e}")
