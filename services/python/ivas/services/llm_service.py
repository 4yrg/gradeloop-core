"""
LLM Service using Ollama for question generation and assessment
"""
import json
import re
from typing import List, Dict, Optional
import ollama
from models import ConversationEntry


class LLMService:
    """Service for interacting with Ollama LLM for viva assessment"""
    
    def __init__(self, model_name: str = "llama3.1:8b"):
        """
        Initialize the LLM service
        
        Args:
            model_name: Name of the Ollama model to use
        """
        self.model_name = model_name
        self.client = ollama.Client()
        print(f"✓ LLM Service initialized with model: {model_name}")
    
    def _call_ollama(self, prompt: str, temperature: float = 0.7) -> str:
        """
        Make a call to Ollama and return the response
        
        Args:
            prompt: The prompt to send
            temperature: Sampling temperature (0.0-1.0)
            
        Returns:
            Generated text response
        """
        try:
            response = self.client.generate(
                model=self.model_name,
                prompt=prompt,
                options={
                    "temperature": temperature,
                    "num_predict": 500,  # Increased for better responses
                }
            )
            return response['response'].strip()
        except Exception as e:
            print(f"Error calling Ollama: {e}")
            raise
    
    def generate_first_question(
        self,
        assignment_title: str,
        assignment_description: str,
        student_code: str
    ) -> str:
        """
        Generate the first question based on the assignment and code
        
        Args:
            assignment_title: Title of the assignment
            assignment_description: Description of the assignment
            student_code: The student's submitted code
            
        Returns:
            The first question text
        """
        prompt = f"""You are an expert computer science educator conducting a viva voce (oral examination) to assess a student's CONCEPTUAL UNDERSTANDING, not their ability to read code.

Assignment: {assignment_title}
Description: {assignment_description}

The student has submitted code for this assignment. Your job is to test if they truly understand the underlying concepts.

Generate ONE question that tests CONCEPTUAL understanding. The question should:
- Test understanding of the underlying algorithm/data structure concepts (e.g., "Why do AVL trees need balancing?", "What problem does this solve?")
- NOT ask them to explain their specific code line by line
- Be answerable by someone who understands the concept even without seeing the code
- Be clear and suitable for a verbal response
- Start simple (this is question 1 of 5)

Good examples:
- "What is the main advantage of using an AVL tree over a regular binary search tree?"
- "Can you explain what 'balance factor' means in the context of self-balancing trees?"
- "Why is O(log n) time complexity important for search operations?"

Bad examples (DO NOT ask these):
- "Can you explain what your insert function does?"
- "Walk me through your code line by line"
- "What does line 15 of your code do?"

Return ONLY the question text, nothing else."""

        question = self._call_ollama(prompt, temperature=0.7)
        # Clean up any markdown or extra formatting
        question = question.replace("**", "").replace("Question:", "").strip()
        # Remove any quotes that might wrap the question
        question = question.strip('"\'')
        return question
    
    def generate_next_question(
        self,
        conversation_history: List[ConversationEntry],
        current_answer: str,
        question_number: int
    ) -> str:
        """
        Generate the next question based on conversation so far
        
        Args:
            conversation_history: All previous Q&A exchanges
            current_answer: The most recent answer from student
            question_number: Which question number this will be (2-5)
            
        Returns:
            The next question text
        """
        # Build conversation context
        history_text = ""
        for entry in conversation_history:
            history_text += f"\nQ{entry.question_number}: {entry.question_text}\n"
            history_text += f"A{entry.question_number}: {entry.answer_text}\n"
            history_text += f"Assessment: {entry.understanding_level} (Score: {entry.score}/100)\n"
        
        prompt = f"""You are an expert computer science educator conducting a viva voce examination.

Previous conversation:
{history_text}

Latest Answer: {current_answer}

This is question {question_number} of 5. Generate the next CONCEPTUAL question.

Rules:
1. Test understanding of CONCEPTS, not code reading ability
2. Adapt difficulty based on previous performance:
   - If student showed good understanding (score >= 70): Ask deeper conceptual questions (time complexity analysis, trade-offs, edge cases, comparisons with alternatives)
   - If student struggled (score < 50): Ask simpler foundational questions to identify gaps
3. DO NOT ask them to explain code line by line
4. DO NOT repeat similar questions

Question progression examples:
- Q1: Basic concept ("What is an AVL tree?")
- Q2: Purpose/advantage ("Why use it over alternatives?")
- Q3: Core mechanism ("How does balancing work conceptually?")
- Q4: Analysis ("What's the time complexity and why?")
- Q5: Application/edge cases ("When would you choose this over a hash table?")

Return ONLY the question text, nothing else."""

        question = self._call_ollama(prompt, temperature=0.7)
        question = question.replace("**", "").replace(f"Question {question_number}:", "").strip()
        question = question.strip('"\'')
        return question
    
    def assess_answer(self, question: str, answer: str) -> Dict[str, any]:
        """
        Assess a student's answer to a question with STRICT scoring
        
        Args:
            question: The question that was asked
            answer: The student's answer (transcribed from voice)
            
        Returns:
            Dictionary with 'understanding_level' and 'score'
        """
        prompt = f"""You are a STRICT examiner assessing a student's verbal answer in an oral examination.

Question Asked: {question}

Student's Answer: "{answer}"

IMPORTANT SCORING RULES - BE STRICT:

1. First, check if the answer is VALID:
   - Is it on-topic and attempts to answer the question?
   - Is it in appropriate academic language?
   - Does it contain actual technical content?

2. If the answer is INVALID (off-topic, inappropriate, nonsense, or refuses to answer), score it as:
   LEVEL: none
   SCORE: 0

3. If the answer is valid, score based on ACCURACY and DEPTH:
   - excellent (85-100): Comprehensive, accurate, shows deep understanding with examples or nuance
   - good (65-84): Mostly correct, demonstrates solid understanding, minor gaps acceptable
   - partial (40-64): Some correct elements but missing key concepts or has misconceptions
   - minimal (15-39): Very limited correct content, major gaps or errors
   - none (0-14): Completely wrong, irrelevant, inappropriate, or empty

CRITICAL: 
- An answer like "I don't know" = SCORE: 5
- An answer with profanity or refusing to engage = SCORE: 0
- An answer that mentions some keywords but is vague = SCORE: 20-40
- Only give 80+ for genuinely good explanations with accurate content

Analyze the answer carefully, then respond EXACTLY in this format:
ANALYSIS: [1-2 sentence analysis of the answer quality]
LEVEL: [level]
SCORE: [number]"""

        response = self._call_ollama(prompt, temperature=0.2)  # Lower temperature for consistent scoring
        
        # Parse the response
        level_match = re.search(r'LEVEL:\s*(\w+)', response, re.IGNORECASE)
        score_match = re.search(r'SCORE:\s*(\d+)', response, re.IGNORECASE)
        
        understanding_level = level_match.group(1).lower() if level_match else "none"
        score = int(score_match.group(1)) if score_match else 0
        
        # Ensure valid values
        valid_levels = ["excellent", "good", "partial", "minimal", "none"]
        if understanding_level not in valid_levels:
            understanding_level = "none"
        
        score = max(0, min(100, score))  # Clamp between 0-100
        
        # Additional validation: check for obviously bad answers
        answer_lower = answer.lower().strip()
        bad_indicators = [
            "i don't know", "idk", "no idea", "fuck", "shit", "100%", 
            "give me", "i want", "pass me", "just give", "whatever"
        ]
        
        if any(indicator in answer_lower for indicator in bad_indicators):
            # Override with low score if LLM was too lenient
            if score > 20:
                score = min(score, 15)
                understanding_level = "none"
        
        # Check for very short non-answers
        if len(answer.split()) < 5:
            score = min(score, 25)
            if understanding_level in ["excellent", "good"]:
                understanding_level = "minimal"
        
        return {
            "understanding_level": understanding_level,
            "score": score
        }
    
    def generate_final_report(
        self,
        conversation_history: List[ConversationEntry],
        student_id: str,
        assignment_title: str
    ) -> Dict[str, any]:
        """
        Generate final assessment report based on entire conversation
        
        Args:
            conversation_history: All Q&A exchanges with scores
            student_id: The student's ID
            assignment_title: The assignment title
            
        Returns:
            Dictionary with final report data
        """
        # Calculate average score
        total_score = sum(entry.score for entry in conversation_history)
        avg_score = total_score // len(conversation_history) if conversation_history else 0
        
        # Build conversation summary
        history_text = ""
        for entry in conversation_history:
            history_text += f"\nQ{entry.question_number}: {entry.question_text}\n"
            history_text += f"A{entry.question_number}: {entry.answer_text}\n"
            history_text += f"Score: {entry.score}/100 ({entry.understanding_level})\n"
        
        prompt = f"""You are completing a viva voce assessment report for a student.

Assignment: {assignment_title}
Calculated Average Score: {avg_score}/100

Complete Viva Conversation:
{history_text}

Based on the student's responses during this oral examination, generate an honest assessment report.

COMPETENCY LEVEL (based on average score):
- EXPERT (85-100): Exceptional understanding demonstrated
- ADVANCED (65-84): Strong grasp of concepts
- INTERMEDIATE (40-64): Moderate understanding with gaps
- BEGINNER (0-39): Limited understanding, needs improvement

Be HONEST and SPECIFIC in your assessment. If the student gave poor or inappropriate answers, reflect that clearly.

Format your response EXACTLY as:
COMPETENCY: [EXPERT/ADVANCED/INTERMEDIATE/BEGINNER]
STRENGTHS:
- [specific strength based on their answers, or "Limited engagement with questions" if applicable]
- [another strength or "N/A"]
WEAKNESSES:
- [specific weakness based on their answers]
- [another weakness]
RECOMMENDATIONS:
- [actionable recommendation]
- [another recommendation]"""

        response = self._call_ollama(prompt, temperature=0.3)
        
        # Parse the response
        competency_match = re.search(r'COMPETENCY:\s*(\w+)', response, re.IGNORECASE)
        competency = competency_match.group(1).upper() if competency_match else "BEGINNER"
        
        # Validate and override competency based on actual score
        valid_levels = ["EXPERT", "ADVANCED", "INTERMEDIATE", "BEGINNER"]
        if competency not in valid_levels:
            competency = "BEGINNER"
        
        # Force competency to match score ranges (don't let LLM be too generous)
        if avg_score >= 85:
            competency = "EXPERT"
        elif avg_score >= 65:
            competency = "ADVANCED"
        elif avg_score >= 40:
            competency = "INTERMEDIATE"
        else:
            competency = "BEGINNER"
        
        # Extract lists
        def extract_list(section_name: str, text: str) -> List[str]:
            pattern = f"{section_name}:(.*?)(?:WEAKNESSES:|RECOMMENDATIONS:|$)"
            match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
            if match:
                section = match.group(1)
                items = re.findall(r'-\s*(.+)', section)
                return [item.strip() for item in items if item.strip()]
            return []
        
        strengths = extract_list("STRENGTHS", response)
        weaknesses = extract_list("WEAKNESSES", response)
        recommendations = extract_list("RECOMMENDATIONS", response)
        
        # Ensure we have content, with honest defaults for poor performance
        if not strengths:
            if avg_score >= 50:
                strengths = ["Participated in the viva assessment"]
            else:
                strengths = ["Completed the assessment process"]
                
        if not weaknesses:
            if avg_score < 50:
                weaknesses = ["Did not demonstrate understanding of core concepts", "Responses lacked technical depth"]
            else:
                weaknesses = ["Some areas need further review"]
                
        if not recommendations:
            if avg_score < 50:
                recommendations = ["Review fundamental concepts thoroughly", "Practice explaining technical concepts verbally", "Seek help from instructors or tutors"]
            else:
                recommendations = ["Continue practicing and deepening understanding"]
        
        return {
            "session_id": "",  # Will be filled by caller
            "student_id": student_id,
            "assignment_title": assignment_title,
            "total_score": avg_score,
            "competency_level": competency,
            "strengths": strengths[:3],  # Max 3
            "weaknesses": weaknesses[:3],
            "recommendations": recommendations[:3],
            "conversation_history": conversation_history
        }
