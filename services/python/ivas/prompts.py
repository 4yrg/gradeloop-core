"""
IVAS Prompts - LLM prompt templates for Socratic viva assessment
"""

# System prompt for the viva examiner
SYSTEM_PROMPT = """You are a Socratic viva examiner for a computer science course. Your role is to:

1. Ask thoughtful, probing questions that assess the student's understanding of their code
2. Adapt your questions based on the student's responses - go deeper if they show understanding, simplify if they struggle
3. Focus on understanding concepts, not just memorization
4. Be encouraging but rigorous
5. Identify misconceptions and gently guide students toward correct understanding
6. Never give away answers directly - use questions to lead students to discover answers themselves

Guidelines:
- Ask one question at a time
- Keep questions clear and focused
- Reference specific parts of the student's code when relevant
- Build on previous responses in the conversation
- Maintain a professional but supportive tone
"""

# Prompt template for generating initial questions
INITIAL_QUESTION_PROMPT = """Based on the following student code submission, generate an appropriate opening question for a viva assessment.

Student's Code:
```
{code}
```

Topic/Concept: {topic}

Generate a question that:
1. Is appropriate for the difficulty level: {difficulty}
2. Tests understanding of the code's purpose and design choices
3. Opens up discussion about key concepts

Respond with ONLY the question, nothing else.
"""

# Prompt template for generating follow-up questions
FOLLOW_UP_QUESTION_PROMPT = """You are conducting a viva assessment. Based on the conversation so far, generate the next question.

Student's Code:
```
{code}
```

Conversation History:
{conversation_history}

The student's last response showed: {understanding_level} understanding.

Generate a follow-up question that:
1. Difficulty adjustment: {difficulty_adjustment}
2. Builds on the previous response
3. Probes deeper or clarifies based on what was said
4. If misconceptions were detected, address them through questioning

Respond with ONLY the question, nothing else.
"""

# Prompt template for assessing student responses
ASSESSMENT_PROMPT = """Assess the student's response to the following viva question.

Question Asked: {question}

Student's Response: {response}

Relevant Code Context:
```
{code_context}
```

Expected Concepts: {expected_concepts}

Analyze the response and provide:
1. Understanding Level (none, minimal, partial, good, excellent)
2. Clarity of Response (confused, unclear, clear, very_clear)
3. Any misconceptions identified
4. Strengths demonstrated
5. Areas for improvement
6. A suggested follow-up question

Respond in the following JSON format:
{{
    "understanding_level": "...",
    "clarity": "...",
    "confidence_score": 0.0-1.0,
    "misconceptions": ["..."],
    "strengths": ["..."],
    "areas_for_improvement": ["..."],
    "suggested_follow_up": "..."
}}
"""

# Prompt for final assessment generation
FINAL_ASSESSMENT_PROMPT = """Based on the complete viva session, generate a final assessment of the student's understanding.

Student's Code:
```
{code}
```

Complete Conversation:
{conversation}

Provide a comprehensive assessment including:
1. Overall score (0-100)
2. Competency level (BEGINNER, INTERMEDIATE, ADVANCED, EXPERT)
3. List of misconceptions identified throughout the session
4. Key strengths demonstrated
5. Areas that need improvement
6. Detailed analysis of understanding

Respond in the following JSON format:
{{
    "overall_score": 0-100,
    "competency_level": "...",
    "misconceptions": ["..."],
    "strengths": ["..."],
    "weaknesses": ["..."],
    "full_analysis": "..."
}}
"""

# Difficulty level prompts
DIFFICULTY_PROMPTS = {
    "easier": "Ask a simpler, more fundamental question that breaks down the concept into smaller parts. Focus on basic understanding.",
    "same": "Ask a follow-up question at the same level of complexity that explores a related aspect of the topic.",
    "harder": "Ask a more challenging question that requires deeper analysis, considers edge cases, or connects multiple concepts.",
}

# Emotion/tone guidelines for TTS
TTS_EMOTION_GUIDELINES = {
    "neutral": "Speak in a calm, professional manner.",
    "encouraging": "Speak with warmth and positivity, acknowledging the student's effort.",
    "questioning": "Speak with gentle curiosity, emphasizing the questioning nature.",
    "clarifying": "Speak clearly and slowly, emphasizing key terms.",
}
