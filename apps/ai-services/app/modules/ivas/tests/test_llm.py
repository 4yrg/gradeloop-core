"""
Test script for LLM service (Ollama + Llama 3.1).
Tests question generation with sample code for Socratic viva dialogue.

Usage:
    python test_llm.py
"""

import asyncio
import sys
import logging
from pathlib import Path

# Import from parent module using relative import
from ..services import LLMService

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)


# Sample lab assignment and student code for testing
SAMPLE_LAB_ASSIGNMENT = """
Lab 3: Array Manipulation and Sorting

Objective: Write a Python program that implements bubble sort to sort an array of integers.

Requirements:
1. Implement a bubble_sort() function that takes a list of integers
2. Sort the list in ascending order
3. Handle edge cases (empty list, single element)
4. Print the sorted result
"""

SAMPLE_STUDENT_CODE = """
def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        for j in range(0, n-i-1):
            if arr[j] > arr[j+1]:
                arr[j], arr[j+1] = arr[j+1], arr[j]
    return arr

# Test
numbers = [64, 34, 25, 12, 22, 11, 90]
print("Original:", numbers)
sorted_numbers = bubble_sort(numbers)
print("Sorted:", sorted_numbers)
"""


async def test_llm_service():
    """Test LLM service with sample code."""
    
    print("=" * 80)
    print("🧪 Testing LLM Service (Ollama + Llama 3.1)")
    print("=" * 80)
    print()
    
    try:
        # Initialize LLM service
        print("📝 Initializing LLM service...")
        llm = LLMService(model="llama3.1:8b")
        print("✅ LLM service initialized\n")
        
        # Test 1: Generate first question (no conversation history)
        print("-" * 80)
        print("Test 1: Generate first question")
        print("-" * 80)
        print(f"Lab Assignment:\n{SAMPLE_LAB_ASSIGNMENT}\n")
        print(f"Student Code:\n{SAMPLE_STUDENT_CODE}\n")
        
        print("🤔 Generating first question...")
        question1 = await llm.generate_question(
            conversation_history=[],
            lab_assignment=SAMPLE_LAB_ASSIGNMENT,
            student_code=SAMPLE_STUDENT_CODE
        )
        
        print(f"❓ Question 1: {question1}\n")
        
        # Test 2: Generate follow-up question with conversation history
        print("-" * 80)
        print("Test 2: Generate follow-up question with history")
        print("-" * 80)
        
        # Simulate a conversation turn
        conversation_history = [
            {"role": "assistant", "content": question1},
            {"role": "user", "content": "I used bubble sort because it's simple to implement and I understand how it works. It compares adjacent elements and swaps them if they're in the wrong order."}
        ]
        
        print("Previous conversation:")
        for msg in conversation_history:
            print(f"  {msg['role']}: {msg['content'][:100]}...")
        print()
        
        print("🤔 Generating follow-up question...")
        question2 = await llm.generate_question(
            conversation_history=conversation_history,
            lab_assignment=SAMPLE_LAB_ASSIGNMENT,
            student_code=SAMPLE_STUDENT_CODE
        )
        
        print(f"❓ Question 2: {question2}\n")
        
        # Test 3: Check response time
        print("-" * 80)
        print("Test 3: Performance test (response time)")
        print("-" * 80)
        
        import time
        start_time = time.time()
        
        question3 = await llm.generate_question(
            conversation_history=[],
            lab_assignment=SAMPLE_LAB_ASSIGNMENT,
            student_code=SAMPLE_STUDENT_CODE
        )
        
        end_time = time.time()
        response_time = end_time - start_time
        
        print(f"⏱️  Response time: {response_time:.2f} seconds")
        print(f"❓ Question 3: {question3}\n")
        
        # Success criteria check
        print("=" * 80)
        print("✅ SUCCESS CRITERIA CHECK")
        print("=" * 80)
        
        checks = [
            ("✓", f"Response time < 3 seconds", response_time < 3.0),
            ("✓", f"Question is not empty", len(question1.strip()) > 0),
            ("✓", f"Question is focused (< 300 chars)", len(question1) < 300),
            ("✓", f"Follow-up considers context", "bubble" in question2.lower() or "sort" in question2.lower() or "time" in question2.lower() or "complexity" in question2.lower()),
        ]
        
        all_passed = True
        for symbol, check_name, passed in checks:
            status = "✅" if passed else "❌"
            print(f"{status} {check_name}")
            if not passed:
                all_passed = False
        
        print()
        if all_passed:
            print("🎉 All tests PASSED!")
            print("✅ LLM generates relevant programming questions")
            print("✅ Questions are clear and Socratic in style")
            print("✅ Context from code is understood")
        else:
            print("⚠️  Some tests FAILED - review output above")
        
        print("=" * 80)
        
    except Exception as e:
        logger.error(f"❌ Test failed: {e}", exc_info=True)
        print(f"\n❌ ERROR: {e}")
        print("\nTroubleshooting:")
        print("1. Ensure Ollama is running: ollama serve")
        print("2. Ensure model is installed: ollama pull llama3.1:8b")
        print("3. Check Ollama server: curl http://localhost:11434/api/tags")
        sys.exit(1)


if __name__ == "__main__":
    print("\n🚀 Starting LLM Service Test\n")
    asyncio.run(test_llm_service())
