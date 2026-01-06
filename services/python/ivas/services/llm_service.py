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
                    "num_predict": 300,  # Limit response length
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
        prompt = f"""You are conducting a voice-based viva (oral examination) assessment for a programming assignment.

Assignment: {assignment_title}
Description: {assignment_description}

Student's Code:
```
{student_code}
```

Generate ONE clear, simple question to start the viva. The question should:
- Test understanding of the main concept or algorithm
- Be open-ended but focused
- Be suitable for verbal response
- Not be too complex (this is question 1 of 5)

Return ONLY the question text, nothing else."""

        question = self._call_ollama(prompt, temperature=0.7)
        # Clean up any markdown or extra formatting
        question = question.replace("**", "").replace("Question:", "").strip()
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
        
        prompt = f"""You are conducting a viva assessment. Here's the conversation so far:

{history_text}

Latest Answer: {current_answer}

This is question {question_number} of 5. Based on the student's understanding shown so far:
- If they answered well with good understanding, ask a DEEPER or more ADVANCED question
- If they struggled or showed gaps, ask a SIMPLER or CLARIFYING question
- Adapt the difficulty to their demonstrated level

Generate the next question. Return ONLY the question text, nothing else."""

        question = self._call_ollama(prompt, temperature=0.7)
        question = question.replace("**", "").replace(f"Question {question_number}:", "").strip()
        return question
    
    def assess_answer(self, question: str, answer: str) -> Dict[str, any]:
        """
        Assess a student's answer to a question
        
        Args:
            question: The question that was asked
            answer: The student's answer (transcribed from voice)
            
        Returns:
            Dictionary with 'understanding_level' and 'score'
        """
        prompt = f"""You are assessing a student's answer in a viva examination.

Question: {question}

Student's Answer: {answer}

Evaluate the answer and provide:
1. Understanding level: Choose ONE of: excellent, good, partial, minimal, none
2. Score: A number from 0 to 100

Criteria:
- excellent (90-100): Comprehensive, accurate, demonstrates deep understanding
- good (70-89): Mostly correct, shows solid understanding with minor gaps
- partial (50-69): Some correct elements but significant gaps or misconceptions
- minimal (25-49): Very limited understanding, mostly incorrect
- none (0-24): Completely off-topic or no meaningful content

Format your response EXACTLY as:
LEVEL: [level]
SCORE: [number]"""

        response = self._call_ollama(prompt, temperature=0.3)
        
        # Parse the response
        level_match = re.search(r'LEVEL:\s*(\w+)', response, re.IGNORECASE)
        score_match = re.search(r'SCORE:\s*(\d+)', response, re.IGNORECASE)
        
        understanding_level = level_match.group(1).lower() if level_match else "partial"
        score = int(score_match.group(1)) if score_match else 50
        
        # Ensure valid values
        valid_levels = ["excellent", "good", "partial", "minimal", "none"]
        if understanding_level not in valid_levels:
            understanding_level = "partial"
        
        score = max(0, min(100, score))  # Clamp between 0-100
        
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
        
        prompt = f"""You are completing a viva assessment report.

Assignment: {assignment_title}
Average Score: {avg_score}/100

Complete Conversation:
{history_text}

Based on this viva assessment, generate a comprehensive report with:

1. COMPETENCY LEVEL: Choose ONE of: EXPERT, ADVANCED, INTERMEDIATE, BEGINNER
   - EXPERT (90-100): Exceptional understanding, insightful responses
   - ADVANCED (75-89): Strong grasp with minor gaps
   - INTERMEDIATE (50-74): Moderate understanding with notable gaps
   - BEGINNER (0-49): Limited understanding, needs significant improvement

2. STRENGTHS: List 2-3 specific strengths with evidence from their answers

3. WEAKNESSES: List 2-3 specific weaknesses or areas for improvement

4. RECOMMENDATIONS: List 2-3 actionable recommendations for improvement

Format your response EXACTLY as:
COMPETENCY: [level]
STRENGTHS:
- [strength 1]
- [strength 2]
- [strength 3]
WEAKNESSES:
- [weakness 1]
- [weakness 2]
- [weakness 3]
RECOMMENDATIONS:
- [recommendation 1]
- [recommendation 2]
- [recommendation 3]"""

        response = self._call_ollama(prompt, temperature=0.3)
        
        # Parse the response
        competency_match = re.search(r'COMPETENCY:\s*(\w+)', response, re.IGNORECASE)
        competency = competency_match.group(1).upper() if competency_match else "INTERMEDIATE"
        
        # Validate competency level
        valid_levels = ["EXPERT", "ADVANCED", "INTERMEDIATE", "BEGINNER"]
        if competency not in valid_levels:
            # Infer from score
            if avg_score >= 90:
                competency = "EXPERT"
            elif avg_score >= 75:
                competency = "ADVANCED"
            elif avg_score >= 50:
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
        
        # Ensure we have at least some content
        if not strengths:
            strengths = ["Completed the viva assessment"]
        if not weaknesses:
            weaknesses = ["Areas for improvement to be discussed"]
        if not recommendations:
            recommendations = ["Review course materials and practice more problems"]
        
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
