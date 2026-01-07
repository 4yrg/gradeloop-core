"""
Adaptive Question Selection Service using IRT and BKT algorithms

This service:
1. Generates 10 conceptual questions using LLM based on assignment
2. Groups questions by difficulty (EASY, MEDIUM, HARD)
3. Uses IRT (Item Response Theory) to select optimal questions
4. Uses BKT (Bayesian Knowledge Tracing) to track student knowledge
5. Selects up to 5 questions adaptively based on student performance
"""
import math
import re
from typing import List, Dict, Optional
from models import ConversationEntry


class Question:
    """Represents a question with IRT parameters"""
    
    def __init__(self, text: str, difficulty: float, topic: str, difficulty_level: str = "MEDIUM"):
        self.text = text
        self.difficulty = difficulty  # -3 to +3 scale (easier to harder)
        self.topic = topic
        self.difficulty_level = difficulty_level  # EASY, MEDIUM, HARD
        self.asked = False
        
    def __repr__(self):
        return f"Q(topic={self.topic}, diff={self.difficulty:.2f}, level={self.difficulty_level})"


class AdaptiveQuestionService:
    """
    Adaptive question selection using IRT (Item Response Theory) 
    and BKT (Bayesian Knowledge Tracing) for viva assessment.
    
    Flow:
    1. Generate 10 questions using LLM (any topic from assignment)
    2. Group questions: EASY (Q1-4), MEDIUM (Q5-7), HARD (Q8-10)
    3. For each of 5 rounds:
       - Select best question using IRT information function
       - Update student ability (theta) after answer
       - Update topic knowledge using BKT
    """
    
    # BKT Parameters
    P_INIT = 0.3      # Initial probability of knowledge
    P_LEARN = 0.2     # Probability of learning after correct answer
    P_GUESS = 0.25    # Probability of guessing correctly
    P_SLIP = 0.1      # Probability of slipping (wrong answer when knows)
    
    def __init__(self, llm_service=None):
        """Initialize the adaptive service"""
        self.student_theta = 0.0  # Student ability estimate (IRT)
        self.topic_knowledge = {}  # Track knowledge state per topic (BKT)
        self.question_bank: List[Question] = []
        self.asked_questions = set()
        self.primary_topic = None
        self.llm_service = llm_service
        self.question_history = []  # Track asked questions with responses
        
    def initialize_question_bank(self, assignment_description: str, student_code: str):
        """
        Generate 20 conceptual questions using LLM based on assignment.
        
        Args:
            assignment_description: Description of the assignment
            student_code: Student's submitted code
        """
        print("  Analyzing assignment and generating questions...")
        
        if not self.llm_service:
            raise ValueError("LLM service is required for question generation")
        
        # Generate questions using LLM
        self.question_bank = self._generate_questions_with_llm(
            assignment_description, 
            student_code
        )
        
        if not self.question_bank:
            raise ValueError("Failed to generate questions - LLM service error")
        
        # Set primary topic from generated questions
        self.primary_topic = self.question_bank[0].topic
        
        # Initialize BKT knowledge states for all topics
        topics = set(q.topic for q in self.question_bank)
        for topic in topics:
            self.topic_knowledge[topic] = self.P_INIT
        
        # Group and display statistics
        easy = [q for q in self.question_bank if q.difficulty_level == "EASY"]
        medium = [q for q in self.question_bank if q.difficulty_level == "MEDIUM"]
        hard = [q for q in self.question_bank if q.difficulty_level == "HARD"]
        
        print(f"✓ Generated {len(self.question_bank)} questions")
        print(f"  Primary topic: {self.primary_topic}")
        print(f"  Difficulty distribution: EASY={len(easy)}, MEDIUM={len(medium)}, HARD={len(hard)}")
    
    def _generate_questions_with_llm(self, assignment_description: str, student_code: str) -> List[Question]:
        """
        Use LLM to generate 20 conceptual questions about ANY topic from the assignment.
        
        Args:
            assignment_description: What the assignment is about
            student_code: Student's code (for context)
            
        Returns:
            List of Question objects grouped by difficulty
        """
        # Truncate code to reasonable length for context
        code_summary = student_code[:1000] if len(student_code) > 1000 else student_code
        
        prompt = f"""You are a programming teacher creating viva questions to assess a student's understanding.

ASSIGNMENT DESCRIPTION:
{assignment_description}

STUDENT'S CODE (for context):
{code_summary}

TASK: Generate exactly 10 CONCEPTUAL questions about programming concepts used in this assignment.

IMPORTANT RULES:
1. Questions should test understanding of CONCEPTS, not specific code syntax
2. Questions should be answerable verbally without looking at code
3. Cover the main programming concepts evident in the assignment
4. Questions should progress from basic to advanced understanding

DIFFICULTY DISTRIBUTION:
- Q1 to Q4: EASY - Basic definitions ("What is X?", "Define Y")
- Q5 to Q7: MEDIUM - Comparisons, when/why to use ("Why do we use X?", "Difference between X and Y")
- Q8 to Q10: HARD - Deep understanding, edge cases, tradeoffs ("What happens if...", "Compare approaches")

OUTPUT FORMAT (follow exactly):
TOPIC: [main_programming_concept_from_assignment]
Q1|EASY: [question text]
Q2|EASY: [question text]
Q3|EASY: [question text]
Q4|EASY: [question text]
Q5|MEDIUM: [question text]
Q6|MEDIUM: [question text]
Q7|MEDIUM: [question text]
Q8|HARD: [question text]
Q9|HARD: [question text]
Q10|HARD: [question text]

Generate all 10 questions now:"""

        try:
            response = self.llm_service._call_ollama(prompt, temperature=0.7)
            questions = self._parse_llm_questions(response)
            
            if len(questions) < 7:
                print(f"  Warning: Only generated {len(questions)} questions, retrying...")
                # Retry once with simpler prompt
                questions = self._retry_question_generation(assignment_description)
            
            return questions
            
        except Exception as e:
            print(f"  Error generating questions: {e}")
            raise ValueError(f"Failed to generate questions: {e}")
    
    def _retry_question_generation(self, assignment_description: str) -> List[Question]:
        """Retry question generation with a simpler prompt"""
        prompt = f"""Generate 10 programming concept questions for this assignment: {assignment_description}

Format each line as: Q[number]|[EASY/MEDIUM/HARD]: [question]
Q1-Q4 should be EASY, Q5-Q7 MEDIUM, Q8-Q10 HARD.

Start with: TOPIC: [main concept]
Then list all 10 questions."""

        response = self.llm_service._call_ollama(prompt, temperature=0.7)
        return self._parse_llm_questions(response)
    
    def _parse_llm_questions(self, llm_response: str) -> List[Question]:
        """Parse LLM response into Question objects with proper difficulty grouping"""
        questions = []
        topic = "programming"
        
        # Extract topic
        topic_match = re.search(r'TOPIC:\s*(.+)', llm_response, re.IGNORECASE)
        if topic_match:
            topic = topic_match.group(1).strip().lower().replace("_", " ")
        
        # Difficulty mapping to IRT scale
        # EASY: -2.0 to -0.5 (high probability of correct)
        # MEDIUM: -0.5 to 0.5 (moderate difficulty)  
        # HARD: 0.5 to 2.0 (low probability of correct)
        difficulty_base = {
            'EASY': -1.5,
            'MEDIUM': 0.0,
            'HARD': 1.2
        }
        
        # Parse questions with flexible pattern
        pattern = r'Q(\d+)\s*\|\s*(EASY|MEDIUM|HARD)\s*:\s*(.+?)(?=\nQ\d+|$)'
        matches = re.findall(pattern, llm_response, re.IGNORECASE | re.DOTALL)
        
        # Track count per difficulty for variation
        difficulty_count = {'EASY': 0, 'MEDIUM': 0, 'HARD': 0}
        
        for q_num, difficulty_str, question_text in matches:
            difficulty_level = difficulty_str.upper()
            base = difficulty_base.get(difficulty_level, 0.0)
            
            # Add variation within each difficulty band
            count = difficulty_count.get(difficulty_level, 0)
            if difficulty_level == 'EASY':
                difficulty = base + (count * 0.15)  # -1.5 to -0.45
            elif difficulty_level == 'MEDIUM':
                difficulty = base + (count * 0.15)  # 0.0 to 0.75
            else:
                difficulty = base + (count * 0.12)  # 1.2 to 2.04
            
            difficulty_count[difficulty_level] = count + 1
            
            # Clean question text
            clean_text = question_text.strip()
            clean_text = re.sub(r'\s+', ' ', clean_text)  # Normalize whitespace
            
            if clean_text:
                questions.append(Question(
                    text=clean_text,
                    difficulty=round(difficulty, 2),
                    topic=topic,
                    difficulty_level=difficulty_level
                ))
        
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
        Select next question using adaptive IRT + BKT algorithm.
        
        Strategy:
        - Question 1: Start with an EASY question to establish baseline
        - Questions 2-5: Use IRT information maximization + BKT knowledge state
        
        Args:
            conversation_history: Previous Q&A exchanges
            
        Returns:
            Optimally selected question, or None if no questions available
        """
        # Update student ability and knowledge states based on history
        if conversation_history:
            self._update_student_model(conversation_history)
        
        # Find available questions (not yet asked)
        available = [q for q in self.question_bank if not q.asked]
        
        if not available:
            return None
        
        question_num = len(conversation_history) + 1
        
        # Question 1: Start with easiest EASY question
        if question_num == 1:
            easy_questions = [q for q in available if q.difficulty_level == "EASY"]
            if easy_questions:
                easy_questions.sort(key=lambda q: q.difficulty)
                selected = easy_questions[0]
            else:
                available.sort(key=lambda q: q.difficulty)
                selected = available[0]
            selected.asked = True
            self.asked_questions.add(selected.text)
            return selected
        
        # Questions 2-5: Use IRT + BKT for adaptive selection
        best_question = None
        best_score = float('-inf')
        
        # Get last answer performance
        last_entry = conversation_history[-1]
        last_score = last_entry.score
        
        for question in available:
            score = self._calculate_question_score(question, last_score, question_num)
            
            if score > best_score:
                best_score = score
                best_question = question
        
        if best_question:
            best_question.asked = True
            self.asked_questions.add(best_question.text)
        
        return best_question
    
    def _calculate_question_score(self, question: Question, last_score: int, question_num: int) -> float:
        """
        Calculate selection score for a question using IRT + BKT.
        
        Components:
        1. IRT Information: How informative is this question at current ability?
        2. BKT Knowledge: Uncertainty about student's topic knowledge
        3. Adaptive Difficulty: Match difficulty to performance trajectory
        
        Args:
            question: Question to evaluate
            last_score: Score from previous answer (0-100)
            question_num: Current question number (2-5)
            
        Returns:
            Combined selection score (higher = better choice)
        """
        # 1. IRT Information Function (maximum at theta = difficulty)
        irt_info = self.calculate_information(self.student_theta, question.difficulty)
        
        # 2. BKT Knowledge Uncertainty (prefer questions where we're uncertain)
        topic_knowledge = self.topic_knowledge.get(question.topic, self.P_INIT)
        bkt_uncertainty = 1 - abs(topic_knowledge - 0.5) * 2  # Higher when knowledge ~0.5
        
        # 3. Adaptive Difficulty Selection
        # If student did well (>70), try harder; if poorly (<50), try easier
        if last_score >= 70:
            # Performing well - increase difficulty
            target_diff = self.student_theta + 0.5
        elif last_score < 50:
            # Struggling - decrease difficulty
            target_diff = self.student_theta - 0.5
        else:
            # Moderate - stay at current level
            target_diff = self.student_theta
        
        # Penalize questions too far from target difficulty
        difficulty_match = 1 / (1 + abs(question.difficulty - target_diff))
        
        # 4. Progressive difficulty bonus (later questions should be harder)
        progressive_bonus = 0
        expected_difficulty = self._get_expected_difficulty(question_num)
        if question.difficulty_level == expected_difficulty:
            progressive_bonus = 0.2
        
        # Combined weighted score
        score = (
            0.35 * irt_info +           # IRT information
            0.25 * bkt_uncertainty +     # BKT uncertainty
            0.25 * difficulty_match +    # Difficulty targeting
            0.15 * (1 + progressive_bonus)  # Progressive difficulty
        )
        
        return score
    
    def _get_expected_difficulty(self, question_num: int) -> str:
        """Get expected difficulty level based on question number"""
        # Q1-2: EASY, Q3: MEDIUM, Q4-5: MEDIUM/HARD
        if question_num <= 2:
            return "EASY"
        elif question_num == 3:
            return "MEDIUM"
        else:
            return "HARD"
    
    def _update_student_model(self, conversation_history: List[ConversationEntry]):
        """
        Update student ability (IRT theta) and topic knowledge (BKT).
        
        IRT Update: Maximum Likelihood Estimation based on response pattern
        BKT Update: Bayesian update based on correctness
        
        Args:
            conversation_history: All Q&A exchanges so far
        """
        # ===== IRT: Update student ability (theta) =====
        # Use weighted average with recency bias
        total_weight = 0
        weighted_sum = 0
        
        for i, entry in enumerate(conversation_history):
            # Find question difficulty
            question_diff = 0.0
            for q in self.question_bank:
                if self._questions_match(q.text, entry.question_text):
                    question_diff = q.difficulty
                    break
            
            # Convert score to ability estimate
            # Account for question difficulty: high score on hard = high ability
            score_normalized = entry.score / 100  # 0 to 1
            ability_from_response = question_diff + 2 * (score_normalized - 0.5)
            
            # Recency weight (more recent = more weight)
            weight = 1.0 + (i / len(conversation_history)) * 0.5
            
            weighted_sum += ability_from_response * weight
            total_weight += weight
        
        if total_weight > 0:
            self.student_theta = max(-3, min(3, weighted_sum / total_weight))
        
        # ===== BKT: Update topic knowledge =====
        last_entry = conversation_history[-1]
        
        # Find question topic
        question_topic = None
        for q in self.question_bank:
            if self._questions_match(q.text, last_entry.question_text):
                question_topic = q.topic
                break
        
        if question_topic and question_topic in self.topic_knowledge:
            self._bkt_update(question_topic, last_entry.score)
    
    def _bkt_update(self, topic: str, score: int):
        """
        Bayesian Knowledge Tracing update for topic knowledge.
        
        P(L_n | obs) = P(obs | L_n) * P(L_n) / P(obs)
        
        Args:
            topic: Topic to update
            score: Score achieved (0-100)
        """
        current_p = self.topic_knowledge[topic]
        correct = score >= 60  # Threshold for "correct"
        
        if correct:
            # P(L | correct) = P(correct | L) * P(L) / P(correct)
            # P(correct) = P(correct | L) * P(L) + P(correct | ~L) * P(~L)
            #            = (1 - P_SLIP) * P(L) + P_GUESS * (1 - P(L))
            p_correct = (1 - self.P_SLIP) * current_p + self.P_GUESS * (1 - current_p)
            p_learned_given_correct = (1 - self.P_SLIP) * current_p / p_correct
            
            # Add learning probability
            new_p = p_learned_given_correct + (1 - p_learned_given_correct) * self.P_LEARN
        else:
            # P(L | incorrect) = P(incorrect | L) * P(L) / P(incorrect)
            p_incorrect = self.P_SLIP * current_p + (1 - self.P_GUESS) * (1 - current_p)
            p_learned_given_incorrect = self.P_SLIP * current_p / p_incorrect
            
            # Smaller learning from incorrect (struggle leads to some learning)
            new_p = p_learned_given_incorrect + (1 - p_learned_given_incorrect) * (self.P_LEARN * 0.3)
        
        # Clamp to valid probability range
        self.topic_knowledge[topic] = max(0.05, min(0.95, new_p))
    
    def _questions_match(self, q1: str, q2: str) -> bool:
        """Check if two questions are essentially the same"""
        q1_norm = q1.lower().strip().rstrip('?')
        q2_norm = q2.lower().strip().rstrip('?')
        return q1_norm == q2_norm or q1_norm in q2_norm or q2_norm in q1_norm
    
    def generate_feedback(self, question: str, answer: str, score: int, understanding_level: str) -> str:
        """
        Generate constructive feedback for the student's answer using LLM.
        
        Args:
            question: The question that was asked
            answer: Student's answer (transcribed)
            score: Assessment score (0-100)
            understanding_level: excellent/good/partial/minimal/none
            
        Returns:
            Feedback string for the student
        """
        if not self.llm_service:
            return self._get_default_feedback(score)
        
        prompt = f"""You are a friendly programming teacher giving brief feedback on a student's verbal answer.

Question: {question}
Student's Answer: "{answer}"
Score: {score}/100
Understanding Level: {understanding_level}

Give a SHORT (1-2 sentences) constructive feedback:
- If score >= 70: Briefly acknowledge what was correct
- If score 50-69: Note what was partially correct, hint at what's missing
- If score < 50: Gently correct the misconception with a brief explanation

Be encouraging but honest. Do NOT repeat the question or answer.
Return ONLY the feedback text, nothing else."""

        try:
            feedback = self.llm_service._call_ollama(prompt, temperature=0.5)
            # Clean up response
            feedback = feedback.strip().strip('"\'')
            # Limit length
            if len(feedback) > 200:
                feedback = feedback[:197] + "..."
            return feedback
        except Exception as e:
            print(f"  Error generating feedback: {e}")
            return self._get_default_feedback(score)
    
    def _get_default_feedback(self, score: int) -> str:
        """Fallback feedback if LLM fails"""
        if score >= 80:
            return "Excellent understanding! You've got a solid grasp of this concept."
        elif score >= 60:
            return "Good attempt! You understand the basics, but there's room to deepen your knowledge."
        elif score >= 40:
            return "You have some understanding, but let's explore this concept further."
        else:
            return "Let's review this concept together. Don't worry, understanding takes practice."
    
    def get_adjusted_score(self, raw_score: int, question_difficulty: float) -> int:
        """
        Adjust score based on question difficulty using IRT principles.
        Harder questions give more credit for partial understanding.
        
        Args:
            raw_score: Raw score from LLM assessment (0-100)
            question_difficulty: Question difficulty (-2 to +2)
            
        Returns:
            Adjusted score (0-100)
        """
        # Difficulty adjustment factor
        # Hard questions (diff > 0.5): partial answers get bonus
        # Easy questions (diff < -1): no adjustment
        
        if question_difficulty < -1.0:
            return raw_score
        elif question_difficulty < 0.5:
            # Medium difficulty - small bonus
            bonus = (raw_score / 100) * 3 * (question_difficulty + 1.0)
            return min(100, int(raw_score + bonus))
        else:
            # Hard difficulty - larger bonus for partial answers
            bonus = (raw_score / 100) * 8 * min(question_difficulty, 1.5)
            return min(100, int(raw_score + bonus))
    
    def get_question_by_number(self, question_num: int) -> Optional[Question]:
        """Get a question from the asked questions by its position"""
        asked = [q for q in self.question_bank if q.asked]
        if 0 < question_num <= len(asked):
            return asked[question_num - 1]
        return None
    
    def get_diagnostics(self) -> Dict:
        """Get current model state for debugging/monitoring"""
        easy_remaining = len([q for q in self.question_bank if not q.asked and q.difficulty_level == "EASY"])
        med_remaining = len([q for q in self.question_bank if not q.asked and q.difficulty_level == "MEDIUM"])
        hard_remaining = len([q for q in self.question_bank if not q.asked and q.difficulty_level == "HARD"])
        
        return {
            "student_theta": round(self.student_theta, 3),
            "topic_knowledge": {k: round(v, 3) for k, v in self.topic_knowledge.items()},
            "questions_asked": len(self.asked_questions),
            "questions_remaining": {
                "EASY": easy_remaining,
                "MEDIUM": med_remaining,
                "HARD": hard_remaining,
                "total": easy_remaining + med_remaining + hard_remaining
            },
            "primary_topic": self.primary_topic
        }
    
    def get_final_ability_estimate(self) -> Dict:
        """
        Get final assessment of student ability after all questions.
        
        Returns:
            Dictionary with ability level and confidence
        """
        theta = self.student_theta
        topic_mastery = sum(self.topic_knowledge.values()) / max(len(self.topic_knowledge), 1)
        
        # Determine competency level
        if theta >= 1.0 and topic_mastery >= 0.7:
            level = "EXPERT"
        elif theta >= 0.3 and topic_mastery >= 0.55:
            level = "ADVANCED"
        elif theta >= -0.5 and topic_mastery >= 0.4:
            level = "INTERMEDIATE"
        else:
            level = "BEGINNER"
        
        return {
            "ability_theta": round(theta, 2),
            "topic_mastery": round(topic_mastery, 2),
            "competency_level": level,
            "topic_breakdown": {k: round(v, 2) for k, v in self.topic_knowledge.items()}
        }
