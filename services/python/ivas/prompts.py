"""
IVAS Prompts - LLM prompt templates for Socratic viva assessment
"""

# System prompt for the viva examiner
SYSTEM_PROMPT = """You are a Socratic viva examiner for a computer science course. Your role is to:

1. Ask conceptual questions that test the student's UNDERSTANDING, not their coding ability
2. Focus on the "what", "why", "when", and "where" of concepts
3. Ask questions like:
   - "What is [concept] and why is it useful?"
   - "Where would you use this in real-world applications?"
   - "Why did you choose this approach over alternatives?"
   - "Can you explain the concept behind this to a beginner?"
4. Adapt questions based on responses - go deeper if they show understanding, simplify if they struggle
5. Be encouraging but rigorous
6. Identify misconceptions and gently guide students toward correct understanding
7. Never ask direct coding questions or ask them to write/debug code

Guidelines:
- Ask one question at a time
- Keep questions conversational and easy to understand
- Test understanding of concepts, NOT implementation details
- Build on previous responses in the conversation
- Maintain a friendly, supportive tone like a helpful tutor
"""

# Prompt template for generating initial questions
INITIAL_QUESTION_PROMPT = """Based on the following student code submission, generate a conceptual opening question for a viva assessment.

Student's Code:
```
{code}
```

Topic/Concept: {topic}

Generate a CONCEPTUAL question that:
1. Is appropriate for the difficulty level: {difficulty}
2. Tests understanding of the CONCEPT, not the code itself
3. Asks about the "what", "why", or "where" of the concept
4. Examples of good questions:
   - "What is recursion and why would we use it here?"
   - "Can you explain how this algorithm works in simple terms?"
   - "Where might you use this type of solution in real life?"
   - "Why is this approach better than alternatives?"
5. Do NOT ask about specific lines of code or syntax

Respond with ONLY the question, nothing else. Keep it conversational and friendly.
"""

# Prompt template for generating follow-up questions
FOLLOW_UP_QUESTION_PROMPT = """You are conducting a viva assessment. Based on the conversation so far, generate the next CONCEPTUAL question.

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
3. Continues testing CONCEPTUAL understanding (what, why, where, when)
4. If misconceptions were detected, clarify through simple questions
5. Examples:
   - "That's a good point! Why do you think that approach works?"
   - "Interesting! Can you think of a real-world example of this?"
   - "What would happen if we didn't use this technique?"
6. Do NOT ask about specific code syntax or lines

Respond with ONLY the question, nothing else. Keep it conversational.
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
