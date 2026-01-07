"""
Simple test script for the adaptive question service
"""
from services.adaptive_service import AdaptiveQuestionService
from models import ConversationEntry

def test_adaptive_service():
    """Test the adaptive question selection"""
    
    print("="*60)
    print("Testing Adaptive Question Service")
    print("="*60)
    
    # Initialize service
    service = AdaptiveQuestionService()
    
    # Test 1: Initialize with loop-based assignment
    print("\nTest 1: Loop-based assignment")
    service.initialize_question_bank(
        assignment_description="Write Python loops to print patterns",
        student_code="for i in range(5): print('*' * i)"
    )
    
    print(f"Questions in bank: {len(service.question_bank)}")
    print(f"Topics: {list(service.topic_knowledge.keys())}")
    
    # Test 2: Select first question
    print("\nTest 2: First question selection")
    q1 = service.select_next_question([])
    print(f"Q1: {q1.text}")
    print(f"Difficulty: {q1.difficulty}")
    print(f"Topic: {q1.topic}")
    
    # Test 3: Simulate good answer
    print("\nTest 3: Simulate good answer (score: 85)")
    history = [
        ConversationEntry(
            question_number=1,
            question_text=q1.text,
            answer_text="A for loop is used when you know how many iterations",
            understanding_level="good",
            score=85
        )
    ]
    
    # Test 4: Select next question adaptively
    print("\nTest 4: Adaptive question selection")
    q2 = service.select_next_question(history)
    diagnostics = service.get_diagnostics()
    
    print(f"Q2: {q2.text}")
    print(f"Difficulty: {q2.difficulty}")
    print(f"Student θ: {diagnostics['student_theta']}")
    print(f"Topic knowledge: {diagnostics['topic_knowledge']}")
    
    # Test 5: Simulate poor answer
    print("\nTest 5: Simulate poor answer (score: 30)")
    history.append(
        ConversationEntry(
            question_number=2,
            question_text=q2.text,
            answer_text="I don't know",
            understanding_level="minimal",
            score=30
        )
    )
    
    q3 = service.select_next_question(history)
    diagnostics = service.get_diagnostics()
    
    print(f"Q3: {q3.text}")
    print(f"Difficulty: {q3.difficulty}")
    print(f"Student θ: {diagnostics['student_theta']}")
    print(f"Topic knowledge: {diagnostics['topic_knowledge']}")
    
    # Test 6: Test difficulty adjustment
    print("\nTest 6: Difficulty-adjusted scoring")
    easy_q_score = service.get_adjusted_score(raw_score=60, question_difficulty=-1.5)
    hard_q_score = service.get_adjusted_score(raw_score=60, question_difficulty=1.0)
    
    print(f"Easy question (diff=-1.5), raw=60 → adjusted={easy_q_score}")
    print(f"Hard question (diff=1.0), raw=60 → adjusted={hard_q_score}")
    
    # Test 7: Multi-topic assignment
    print("\nTest 7: Multi-topic assignment")
    service2 = AdaptiveQuestionService()
    service2.initialize_question_bank(
        assignment_description="Write functions using loops and conditionals",
        student_code="def test(): if x > 0: for i in range(x): print(i)"
    )
    
    print(f"Questions: {len(service2.question_bank)}")
    print(f"Topics: {list(service2.topic_knowledge.keys())}")
    
    # Test 8: Verify no duplicates
    print("\nTest 8: Verify no duplicate questions")
    asked = []
    history = []
    
    for i in range(5):
        q = service.select_next_question(history)
        if not q:
            print(f"Ran out of questions at #{i+1}")
            break
        
        print(f"Q{i+1}: {q.text}")
        asked.append(q.text)
        
        # Simulate answer
        history.append(
            ConversationEntry(
                question_number=i+1,
                question_text=q.text,
                answer_text="test answer",
                understanding_level="good",
                score=70
            )
        )
    
    duplicates = len(asked) - len(set(asked))
    print(f"\nDuplicates found: {duplicates}")
    
    print("\n" + "="*60)
    print("✓ All tests completed!")
    print("="*60)

if __name__ == "__main__":
    test_adaptive_service()
