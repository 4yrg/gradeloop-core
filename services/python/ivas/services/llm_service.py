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
        prompt = f"""You are a friendly programming teacher conducting an oral exam.

Assignment Topic: {assignment_title}
Assignment Details: {assignment_description}

Ask ONE simple CONCEPTUAL question about programming concepts relevant to this assignment.

RULES:
1. Ask about CONCEPTS only - what something IS, WHY we use it, or WHEN to use it
2. Questions should be answerable in plain English without looking at code
3. NO code-specific questions like "what does line X do?"
4. Start with a basic question to gauge understanding

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
        Generate feedback for previous answer and the next question
        
        Args:
            conversation_history: All previous Q&A exchanges
            current_answer: The most recent answer from student
            question_number: Which question number this will be (2-5)
            
        Returns:
            Feedback + next question text combined
        """
        # Get the last entry for feedback context
        last_entry = conversation_history[-1] if conversation_history else None
        last_question = last_entry.question_text if last_entry else ""
        last_score = last_entry.score if last_entry else 0
        
        # Build conversation context showing already asked questions
        history_text = ""
        for entry in conversation_history:
            history_text += f"\nQ{entry.question_number}: {entry.question_text}\n"
            history_text += f"A{entry.question_number}: {entry.answer_text}\n"
            history_text += f"Assessment: {entry.understanding_level} (Score: {entry.score}/100)\n"
        
        prompt = f"""You are a friendly programming teacher giving feedback and asking the next question.

Previous Conversation:
{history_text}

Latest Question: {last_question}
Latest Answer: {current_answer}
Score: {last_score}/100

FEEDBACK BASED ON SCORE:
- Score >= 70: Acknowledge correctness briefly
- Score 50-69: Note what was partially correct
- Score < 50: Gently correct with a short explanation

NEXT QUESTION:
- Ask a NEW conceptual question (don't repeat previous questions)
- Stay relevant to programming concepts
- Keep it simple and answerable in plain English

FORMAT: [Brief feedback]. [Next question]?

Return ONLY feedback + question, nothing else."""

        response = self._call_ollama(prompt, temperature=0.7)
        response = response.replace("**", "").strip()
        response = response.strip('"\'')
        return response
    
    def assess_answer(self, question: str, answer: str) -> Dict[str, any]:
        """
        Assess a student's answer to any programming question with generic scoring
        
        Args:
            question: The question that was asked
            answer: The student's answer (transcribed from voice)
            
        Returns:
            Dictionary with 'understanding_level' and 'score'
        """
        prompt = f"""You are assessing a student's SPOKEN answer (transcribed from voice).

Question: {question}
Student's Answer: "{answer}"

CRITICAL: This is VOICE-TO-TEXT transcription, so interpret common errors:
- "four loop" = "for loop"
- "while lope" / "while globe" = "while loop"  
- "except number" = "exact number"
- "iteration" may appear as "iterated", "iterating"
- "Follow" might be "for loop"
- Other homophones and speech recognition mistakes

FOCUS: Does the student understand the CONCEPT, ignoring transcription errors?

SCORING GUIDELINES:
- 80-100: Excellent - correct understanding of the concept
- 60-79: Good - mostly correct understanding
- 40-59: Partial - some understanding but significant gaps
- 20-39: Minimal - vague or mostly incorrect
- 0-19: None - completely wrong, off-topic, or "I don't know"

Be FAIR with transcription errors. If the concept is right, score 60+.

Respond in this format:
LEVEL: [excellent/good/partial/minimal/none]
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
        
        # Only check for obvious non-answers
        answer_lower = answer.lower().strip()
        bad_indicators = [
            "i don't know", "idk", "no idea", "i have no clue",
            "pass", "skip", "next question"
        ]
        
        if any(indicator in answer_lower for indicator in bad_indicators):
            if score > 20:
                score = min(score, 15)
                understanding_level = "none"
        
        # Check for very short non-answers (less than 3 words)
        if len(answer.split()) < 3 and "[No speech detected]" not in answer:
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
