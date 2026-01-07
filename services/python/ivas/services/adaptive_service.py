"""
Adaptive Question Selection Service using simplified IRT and BKT algorithms
"""
import math
import re
from typing import List, Dict, Optional, Tuple
from models import ConversationEntry


class Question:
    """Represents a question with IRT parameters"""
    def __init__(self, text: str, difficulty: float, topic: str):
        self.text = text
        self.difficulty = difficulty  # -3 to +3 scale (easier to harder)
        self.topic = topic
        self.asked = False
        
    def __repr__(self):
        return f"Q(topic={self.topic}, diff={self.difficulty:.2f})"


class AdaptiveQuestionService:
    """
    Simple adaptive question selection using IRT (Item Response Theory) 
    and BKT (Bayesian Knowledge Tracing) principles
    """
    
    def __init__(self, llm_service=None):
        """Initialize the adaptive service with default question bank"""
        self.student_theta = 0.0  # Student ability estimate (starts neutral)
        self.topic_knowledge = {}  # Track knowledge state per topic
        self.question_bank = []
        self.asked_questions = set()
        self.primary_topic = None  # Main focus topic from assignment
        self.llm_service = llm_service  # For dynamic question generation
        
    def initialize_question_bank(self, assignment_description: str, student_code: str):
        """using LLM to generate relevant questions
        
        Args:
            assignment_description: Description of the assignment
            student_code: Student's submitted code
        """
        print("  Analyzing assignment and generating questions...")
        
        # Use LLM to generate questions if available
        if self.llm_service:
            self.question_bank = self._generate_questions_with_llm(
                assignment_description, 
                student_code
            )
        else:
            # Fallback to hardcoded questions
            self.question_bank = self._get_fallback_questions(assignment_description)
        
        # Detect primary topic from questions
        if self.question_bank:
            self.primary_topic = self.question_bank[0].topic
        else:
            self.primary_topic = 'programming'
        
        # Initialize topic knowledge states
        topics = set(q.topic for q in self.question_bank)
        for topic in topics:
            self.topic_knowledge[topic] = 0.5  # Start with 50% knowledge probability
        
        print(f"✓ Generated {len(self.question_bank)} questions")
        print(f"  Primary topic: {self.primary_topic}")
        print(f"  All topics: {', '.join(topics)}")
    
    def _generate_questions_with_llm(self, assignment_description: str, student_code: str) -> List[Question]:
        """
        Use LLM to generate 20 conceptual questions about the assignment
        
        Args:
            assignment_description: What the assignment is about
            student_code: Student's code (for context)
            
        Returns:
            List of Question objects with difficulty ratings
        """
        prompt = f"""You are a programming teacher creating viva questions for a student.

Assignment: {assignment_description}

Student's Code Summary: {student_code[:500]}...

Generate 20 CONCEPTUAL questions about programming concepts related to this assignment.
Questions should be about CONCEPTS, not specific code implementation.

REQUIREMENTS:
- Questions 1-7: EASY (basic definitions, "what is X?")
- Questions 8-13: MEDIUM (differences, when to use, why)
- Questions 14-20: HARD (deeper understanding, edge cases, tradeoffs)
- Focus on programming CONCEPTS relevant to the assignment
- NO questions about specific code syntax or implementation details
- Questions should be answerable verbally without looking at code

Format EXACTLY as:
TOPIC: [main_topic_name]
Q1|EASY: [question text]
Q2|EASY: [question text]
...
Q8|MEDIUM: [question text]
...
Q14|HARD: [question text]
...
Q20|HARD: [question text]

Generate all 20 questions now:"""

        try:
            response = self.llm_service._call_ollama(prompt, temperature=0.7)
            questions = self._parse_llm_questions(response)
            
            if len(questions) < 10:
                print(f"  Warning: Only generated {len(questions)} questions, using fallback")
                return self._get_fallback_questions(assignment_description)
            
            return questions
            
        except Exception as e:
            print(f"  Error generating questions with LLM: {e}")
            print("  Falling back to predefined questions")
            return self._get_fallback_questions(assignment_description)
    
    def _parse_llm_questions(self, llm_response: str) -> List[Question]:
        """Parse LLM response into Question objects"""
        questions = []
        topic = "programming"
        
        # Extract topic
        topic_match = re.search(r'TOPIC:\s*(.+)', llm_response, re.IGNORECASE)
        if topic_match:
            topic = topic_match.group(1).strip().lower()
        
        # Difficulty mapping
        difficulty_map = {
            'EASY': -1.5,
            'MEDIUM': 0.0,
            'HARD': 1.0
        }
        
        # Parse questions
        pattern = r'Q\d+\|(EASY|MEDIUM|HARD):\s*(.+?)(?=\n|$)'
        matches = re.findall(pattern, llm_response, re.IGNORECASE | re.MULTILINE)
        
        for difficulty_str, question_text in matches:
            difficulty = difficulty_map.get(difficulty_str.upper(), 0.0)
            # Add variation to difficulty within each category
            if difficulty_str.upper() == 'EASY':
                difficulty += (len(questions) % 7) * 0.1  # -1.5 to -0.9
            elif difficulty_str.upper() == 'MEDIUM':
                difficulty += (len(questions) % 6) * 0.15  # 0.0 to 0.75
            else:  # HARD
                difficulty += (len(questions) % 7) * 0.15  # 1.0 to 1.9
            
            questions.append(Question(
                text=question_text.strip(),
                difficulty=round(difficulty, 2),
                topic=topic
            ))
        
        return questions
    
    def _get_fallback_questions(self, assignment_description: str) -> List[Question]:
        """Fallback to predefined questions if LLM fails"""
        desc_lower = assignment_description.lower()
        
        # Detect primary topic
        if any(word in desc_lower for word in ['loop', 'iteration', 'for', 'while', 'repeat']):
            self.primary_topic = 'loops'
        elif any(word in desc_lower for word in ['if', 'else', 'condition', 'boolean']):
            questions.extend([
                Question("What is a for loop?", -1.5, "loops"),
                Question("What is a while loop?", -1.2, "loops"),
                Question("What is the difference between a for loop and a while loop?", -0.5, "loops"),
                Question("When would you use a for loop instead of a while loop?", 0.0, "loops"),
                Question("What is a nested loop?", 0.3, "loops"),
                Question("Why do we use loops in programming?", -1.0, "loops"),
                Question("What is iteration?", -0.8, "loops"),
                Question("What is an infinite loop?", 0.2, "loops"),
                Question("What does it mean to iterate?", -0.6, "loops"),
                Question("How do you exit a loop early?", 0.5, "loops"),
            ])
        
        # Conditional-related questions
        elif self.primary_topic == 'conditionals':
            questions.extend([
                Question("What is a conditional statement?", -1.5, "conditionals"),
                Question("What is the difference between if and else?", -0.8, "conditionals"),
                Question("When do we use elif?", 0.0, "conditionals"),
                Question("What is a boolean expression?", -0.3, "conditionals"),
                Question("What are comparison operators?", -0.2, "conditionals"),
            ])
        
        # Function-related questions
        elif self.primary_topic == 'functions':
            questions.extend([
                Question("What is a function?", -1.3, "functions"),
                Question("What does it mean to return a value?", -0.5, "functions"),
                Question("What is the difference between a parameter and an argument?", 0.5, "functions"),
                Question("Why do we use functions?", -0.8, "functions"),
                Question("What does it mean to call a function?", -0.7, "functions"),
            ])
        
        # Array/List questions
        elif self.primary_topic == 'arrays':
            questions.extend([
                Question("What is an array?", -1.2, "arrays"),
                Question("What is an index?", -0.7, "arrays"),
                Question("How do you access elements in an array?", -0.3, "arrays"),
                Question("What does zero-based indexing mean?", 0.2, "arrays"),
            ])
        
        # String questions
        elif self.primary_topic == 'strings':
            questions.extend([
                Question("What is a string?", -1.5, "strings"),
                Question("How are strings different from numbers?", -0.5, "strings"),
                Question("How do you concatenate strings?", -0.2, "strings"),
            ])
        
        # Variable/Data type questions
        elif self.primary_topic == 'variables':
            questions.extend([
                Question("What is an array?", -1.2, "arrays"),
                Question("What is an index?", -0.7, "arrays"),
                Question("How do you access elements in an array?", -0.3, "arrays"),
                Question("What does zero-based indexing mean?", 0.2, "arrays"),
            ])
        
        # String questions
        elif self.primary_topic == 'strings':
            self.question_bank.extend([
                Question("What is a string?", -1.5, "strings"),
                Question("How are strings different from numbers?", -0.5, "strings"),
                Question("How do you concatenate strings?", -0.2, "strings"),
            ])
        
        # Variable/Data type questions
        elif self.primary_topic == 'variables':
            self.question_bank.extend([
                Question("What is a variable?", -1.8, "variables"),
                Question("What are data types?", -1.0, "variables"),
                Question("What is the difference between an integer and a float?", 0.0, "variables"),
            ])
        
        # If no specific topics detected, use generic programming concepts
        if not questions:
            questions.extend([
                Question("What is a variable?", -1.8, "basics"),
                Question("What is a function?", -1.3, "basics"),
                Question("What is a loop?", -1.2, "basics"),
                Question("What is a conditional statement?", -1.5, "basics"),
                Question("Why do we use comments in code?", -0.8, "basics"),
            ])
        
        return questions
    
    def calculate_probability_correct(self, student_ability: float, question_difficulty: float) -> float:
        """
        IRT: Calculate probability student will answer correctly using 2PL model
        
        P(correct) = 1 / (1 + e^(-1.7 * (theta - difficulty)))
        
        Args:
            student_ability: Student's ability estimate (theta)
            question_difficulty: Question difficulty parameter
            
        Returns:
            Probability between 0 and 1
        """
        return 1 / (1 + math.exp(-1.7 * (student_ability - question_difficulty)))
    
    def calculate_information(self, student_ability: float, question_difficulty: float) -> float:
        """
        IRT: Calculate Fisher information - how much we learn from this question
        Higher information = better question for current ability level
        
        Args:
            student_ability: Student's ability estimate
            question_difficulty: Question difficulty
            
        Returns:
            Information value (0 to ~0.5, higher is better)
        """
        p = self.calculate_probability_correct(student_ability, question_difficulty)
        # Fisher information for 2PL model
        return 1.7**2 * p * (1 - p)
    
    def select_next_question(self, conversation_history: List[ConversationEntry]) -> Optional[Question]:
        """
        Select next question using adaptive algorithm:
        1. Update student ability based on previous answers (IRT)
        2. Update topic knowledge states (BKT)
        3. Select question that maximizes information gain
        
        Args:
            conversation_history: Previous Q&A exchanges
            
        Returns:
            Next question to ask, or None if no questions available
        """
        # Update student ability and knowledge states
        if conversation_history:
            self._update_student_model(conversation_history)
        
        # Find available questions (not yet asked)
        available = [q for q in self.question_bank if not q.asked]
        
        if not available:
            return None
        
        # For first question, pick an easy one
        if not conversation_history:
            available.sort(key=lambda q: q.difficulty)
            return available[0]
        
        # Strongly prefer questions from primary topic
        primary_topic_questions = [q for q in available if q.topic == self.primary_topic]
        
        # Use primary topic questions if available
        if primary_topic_questions:
            available = primary_topic_questions
        
        # Calculate information value for each available question
        best_question = None
        best_score = -1
        
        for question in available:
            # Information from IRT
            irt_info = self.calculate_information(self.student_theta, question.difficulty)
            
            # Knowledge state from BKT
            topic_knowledge = self.topic_knowledge.get(question.topic, 0.5)
            
            # Bonus for staying on primary topic
            topic_bonus = 0.5 if question.topic == self.primary_topic else 0.0
            
            # Combined score: IRT info + topic coverage + topic focus
            uncertainty = abs(0.5 - topic_knowledge)
            score = 0.6 * irt_info + 0.2 * uncertainty + topic_bonus
            
            if score > best_score:
                best_score = score
                best_question = question
        
        if best_question:
            best_question.asked = True
            self.asked_questions.add(best_question.text)
        
        return best_question
    
    def _update_student_model(self, conversation_history: List[ConversationEntry]):
        """
        Update student ability (theta) and topic knowledge based on performance
        
        Args:
            conversation_history: All Q&A exchanges so far
        """
        # Simple theta estimation: weighted average based on scores
        # More recent answers have slightly more weight
        total_weight = 0
        weighted_sum = 0
        
        for i, entry in enumerate(conversation_history):
            # Convert score (0-100) to ability scale (-3 to +3)
            # 0 -> -3, 50 -> 0, 100 -> +3
            estimated_ability = (entry.score - 50) / 50 * 3
            
            # Weight recent answers slightly more (recency effect)
            weight = 1.0 + (i / len(conversation_history)) * 0.3
            
            weighted_sum += estimated_ability * weight
            total_weight += weight
        
        # Update student ability estimate
        if total_weight > 0:
            self.student_theta = weighted_sum / total_weight
        
        # BKT: Update topic knowledge probabilities
        last_entry = conversation_history[-1]
        
        # Find which topic this question belongs to
        question_topic = None
        for q in self.question_bank:
            if self._questions_match(q.text, last_entry.question_text):
                question_topic = q.topic
                break
        
        if question_topic and question_topic in self.topic_knowledge:
            # Simple BKT update based on correctness
            correct = last_entry.score >= 60  # Consider 60+ as "correct"
            current_p = self.topic_knowledge[question_topic]
            
            if correct:
                # Increase knowledge probability
                # P(learned | correct) > P(learned)
                self.topic_knowledge[question_topic] = min(0.95, current_p + (1 - current_p) * 0.3)
            else:
                # Decrease knowledge probability slightly (might be lucky guess before)
                self.topic_knowledge[question_topic] = max(0.05, current_p * 0.8)
    
    def _questions_match(self, q1: str, q2: str) -> bool:
        """Check if two questions are essentially the same"""
        q1_norm = q1.lower().strip().rstrip('?')
        q2_norm = q2.lower().strip().rstrip('?')
        return q1_norm == q2_norm or q1_norm in q2_norm or q2_norm in q1_norm
    
    def get_adjusted_score(self, raw_score: int, question_difficulty: float) -> int:
        """
        Adjust score based on question difficulty (IRT-inspired)
        Harder questions should give more credit for partial answers
        
        Args:
            raw_score: Raw score from LLM assessment (0-100)
            question_difficulty: Question difficulty (-3 to +3)
            
        Returns:
            Adjusted score (0-100)
        """
        # Difficulty bonus: harder questions get a small boost
        # Easy questions (-1.5 to -1): no bonus
        # Medium questions (-0.5 to 0.5): small bonus
        # Hard questions (0.5 to 2): larger bonus
        
        if question_difficulty < -1.0:
            # Easy question - raw score stands
            return raw_score
        elif question_difficulty < 0:
            # Medium-easy - small bonus for partial answers
            bonus = (raw_score / 100) * 5  # Up to +5 bonus
            return min(100, int(raw_score + bonus))
        else:
            # Medium-hard to hard - larger bonus for trying
            bonus = (raw_score / 100) * 10  # Up to +10 bonus
            return min(100, int(raw_score + bonus))
    
    def get_diagnostics(self) -> Dict:
        """Get current model state for debugging"""
        return {
            "student_theta": round(self.student_theta, 2),
            "topic_knowledge": {k: round(v, 2) for k, v in self.topic_knowledge.items()},
            "questions_asked": len(self.asked_questions),
            "questions_remaining": len([q for q in self.question_bank if not q.asked])
        }
