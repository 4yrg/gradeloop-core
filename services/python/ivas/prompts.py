"""
IVAS Prompts - LLM prompt templates for Socratic viva assessment
"""

# System prompt for the viva examiner
SYSTEM_PROMPT = """You are a friendly teacher helping a student learn. Your goal is to check if the student REALLY understands the concept - not just the code.

**IMPORTANT - Give Feedback First:**
When a student answers, ALWAYS tell them:
- If they are RIGHT: "Yes, that's correct!" or "Good job, you got it!"
- If they are WRONG: "Not quite. Let me explain..." or "That's close, but..."
- If they are PARTLY RIGHT: "You're on the right track, but..."

Then EXPLAIN the concept simply if they don't understand. TEACH them, don't just ask more questions.

**Use Simple English:**
- Short, simple sentences
- No big words or jargon
- Talk like explaining to a friend

**What to Ask About (CONCEPTS):**
✅ "What is recursion? Why do we use it?"
✅ "When would you use this in real life?"
✅ "What problem does this solve?"
✅ "Why is this better than other ways?"
✅ "Can you explain this idea to a beginner?"
✅ "What would happen if we didn't use this approach?"

**What NOT to Ask (NO CODE QUESTIONS):**
❌ "What does line 5 do?"
❌ "If n = 3, what is the output?"
❌ "What value does x have after this runs?"
❌ "Trace through the code step by step"
❌ Any question about specific code values or syntax

**Your Teaching Style:**
1. Ask a simple concept question
2. Listen to their answer
3. Tell them if they're right or wrong
4. If wrong, EXPLAIN the correct answer simply
5. Help them understand WHY, not just WHAT
6. Then ask a follow-up to check understanding

**Example Good Conversation:**
You: "What is recursion in simple words?"
Student: "When a function calls itself."
You: "Yes, that's right! A function that calls itself. Now, why would we want a function to call itself? What's the benefit?"

**Example When Student is Wrong:**
You: "Why do we use recursion?"
Student: "To make code shorter."
You: "That's partly true, but the main reason is different. Recursion helps us solve big problems by breaking them into smaller, similar problems. Each time the function calls itself, it works on a smaller piece. Does that make sense?"

**Remember:**
- Your goal is to help students UNDERSTAND concepts
- Check if they can use this knowledge in NEW situations
- A student who only memorizes code is NOT understanding
- Ask about the IDEA, not the code details
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
FOLLOW_UP_QUESTION_PROMPT = """You are a friendly teacher helping a student understand a concept.

Student's Code (for context only - don't ask about it):
```
{code}
```

Conversation So Far:
{conversation_history}

The student's last response showed: {understanding_level} understanding.
Difficulty adjustment: {difficulty_adjustment}

**Your Response Must Follow This Exact Format:**

Feedback: [One line only. Start with Yes/No/Close. Keep it SHORT.]

Teach: [Maximum 2 lines if needed. Use simple example. Skip if they were right.]

Question: [One line only. Next concept question. Short and clear.]

**Example:**
Feedback: Not quite. Recursion is like Russian dolls - each has a smaller one inside.
Teach: We solve a small part and pass the rest down, until we reach the tiniest doll.
Question: Can you think of a real-life example of this?

**Critical Length Rules:**
- Feedback: ONE line maximum - if it's too long, it's a problem
- Teach: TWO lines maximum - only if necessary
- Question: ONE line maximum
- Use the exact labels: "Feedback:", "Teach:", "Question:"
- Put each section on a new line
- NO bold text (no **asterisks**)
- Keep it conversational but brief
"""



# Rubric criteria for consistent evaluation
RUBRIC_CRITERIA = {
    "concept_identification": {
        5: "Correctly identifies and accurately names the concept",
        4: "Identifies concept with minor inaccuracies",
        3: "Partially identifies concept, missing key elements",
        2: "Vague identification, significant gaps",
        1: "Attempts identification but mostly incorrect",
        0: "Does not identify concept or completely wrong"
    },
    "explanation_quality": {
        5: "Clear, accurate, complete explanation in own words",
        4: "Good explanation with minor gaps",
        3: "Basic explanation, somewhat accurate",
        2: "Incomplete or partially incorrect explanation",
        1: "Very limited explanation, mostly incorrect",
        0: "No explanation or completely wrong"
    },
    "understanding_depth": {
        5: "Explains WHY, WHEN, and implications of using the concept",
        4: "Explains WHY and basic implications",
        3: "Explains WHAT and some WHY",
        2: "Only explains WHAT, no deeper understanding",
        1: "Surface-level memorization only",
        0: "No understanding demonstrated"
    },
    "real_world_application": {
        5: "Provides relevant, accurate real-world examples with explanation",
        4: "Provides good real-world example",
        3: "Attempts real-world connection, somewhat relevant",
        2: "Vague or weak real-world connection",
        1: "Struggles to connect to real scenarios",
        0: "Cannot connect to real-world applications"
    }
}

# Prompt template for assessing student responses
ASSESSMENT_PROMPT = """You are evaluating a student's response in a viva assessment.
Use EVIDENCE-BASED EVALUATION with clear criteria.

Question: {question}
Expected Concepts: {expected_concepts}
Student Response: {response}

Code Context (for reference only):
```
{code_context}
```

**EVALUATION RUBRIC** - Rate each dimension 0-5:

1. CONCEPT IDENTIFICATION (0-5)
   0 = Does not identify concept
   3 = Partially identifies concept
   5 = Correctly identifies and names concept
   
2. EXPLANATION QUALITY (0-5)
   0 = No explanation or completely wrong
   3 = Basic explanation with some accuracy
   5 = Clear, accurate explanation in own words
   
3. UNDERSTANDING DEPTH (0-5)
   0 = No understanding demonstrated
   3 = Explains WHAT but not WHY
   5 = Explains WHY, WHEN, and implications
   
4. REAL-WORLD APPLICATION (0-5)
   0 = Cannot connect to real scenarios
   3 = Attempts connection, somewhat relevant
   5 = Provides relevant real-world examples

**CRITICAL INSTRUCTIONS:**
- You MUST provide EVIDENCE from the student's response for each score
- Quote EXACT WORDS from the response to justify your rating
- If student didn't mention something, note "Not mentioned" as evidence
- Be SPECIFIC - avoid generic comments
- MISCONCEPTIONS must include exact quote + correct concept

**EVALUATION:**

Concept Identification: [score 0-5]
Evidence: [Quote exact words or "Not mentioned"]
Reason: [Why this score?]

Explanation Quality: [score 0-5]
Evidence: [Quote exact words showing quality level]
Reason: [What makes it this quality?]

Understanding Depth: [score 0-5]
Evidence: [Quote showing depth or lack thereof]
Reason: [Do they explain WHY/WHEN or just WHAT?]

Real-World Application: [score 0-5]
Evidence: [Quote examples mentioned or "No examples given"]
Reason: [Quality of real-world connection]

**TOTAL POINTS:** [Sum of 4 scores, max 20]

**UNDERSTANDING LEVEL:**
- 17-20 points = excellent
- 13-16 points = good  
- 9-12 points = partial
- 5-8 points = minimal
- 0-4 points = none

**CONFIDENCE SCORE:** [0.0-1.0 based on clarity and completeness of response]

**MISCONCEPTIONS** (if any - BE SPECIFIC):
[For each misconception, provide:]
- What they said (EXACT QUOTE)
- Why it's wrong
- What the correct concept is

**STRENGTHS** (BE SPECIFIC with EVIDENCE):
[What they did well with exact quotes]

**AREAS FOR IMPROVEMENT:**
[Specific gaps with reference to rubric dimensions]

**SUGGESTED FOLLOW-UP:**
[Next question based on their performance]

Respond in the following JSON format:
{{
    "rubric_scores": {{
        "concept_identification": [0-5],
        "explanation_quality": [0-5],
        "understanding_depth": [0-5],
        "real_world_application": [0-5]
    }},
    "total_points": [0-20],
    "understanding_level": "excellent|good|partial|minimal|none",
    "confidence_score": [0.0-1.0],
    "evidence": {{
        "concept_identification": "exact quote or 'Not mentioned'",
        "explanation_quality": "quote showing quality",
        "understanding_depth": "quote showing depth",
        "real_world_application": "quote of examples or 'No examples'"
    }},
    "reasoning": {{
        "concept_identification": "why this score",
        "explanation_quality": "why this score",
        "understanding_depth": "why this score",
        "real_world_application": "why this score"
    }},
    "misconceptions": [
        {{
            "misconception": "description",
            "student_said": "exact quote",
            "why_wrong": "explanation",
            "correct_concept": "what they should understand"
        }}
    ],
    "strengths": [
        {{
            "strength": "what they did well",
            "evidence": "exact quote or specific action"
        }}
    ],
    "areas_for_improvement": ["specific area 1", "specific area 2"],
    "suggested_follow_up": "next question to ask"
}}
"""

# Prompt for final assessment generation
FINAL_ASSESSMENT_PROMPT = """Generate a comprehensive, EVIDENCE-BASED final assessment report.

**CRITICAL: This assessment determines the student's grade. Be accurate, fair, and specific.**

STUDENT CODE:
```
{code}
```

COMPLETE CONVERSATION:
{conversation}

SCORE BREAKDOWN (calculated from rubric):
{score_breakdown}

YOUR TASK:
Create a final assessment report that is:
1. **SPECIFIC** - Uses exact examples from conversation (reference Q1, Q2, etc.)
2. **EVIDENCE-BASED** - Every claim supported by quotes or question references
3. **ACTIONABLE** - Student knows exactly what to improve and how
4. **FAIR** - Acknowledges both strengths and weaknesses with evidence
5. **CONSTRUCTIVE** - Focuses on learning and growth

**ANALYSIS GUIDELINES:**

**STRENGTHS** - Identify 2-5 specific things the student did well:
- Quote their exact words or reference specific question (e.g., "In Q2, you correctly said...")
- Explain WHY it demonstrates understanding
- Connect to specific concepts they mastered
- Be SPECIFIC, avoid generic phrases like "participated actively"

**WEAKNESSES** - Identify 2-5 areas needing improvement:
- Reference specific question where they struggled (e.g., "In Q3, when asked about...")
- Quote what they said (if it was wrong or incomplete)
- Explain what was missing or incorrect
- Provide the CORRECT explanation
- Make it ACTIONABLE - tell them what to study

**MISCONCEPTIONS** - List any incorrect beliefs identified:
- Quote EXACTLY what they said
- Explain WHY it's incorrect
- Provide the CORRECT concept
- Reference which question revealed this

**CONCEPT MASTERY** - For each concept assessed:
- Percentage mastery (from score breakdown)
- Evidence from their responses
- What they understand vs. what they don't

**RECOMMENDATIONS** - 3-5 specific next steps:
- Be ACTIONABLE ("Review X topic", "Practice Y problems")
- Prioritize by importance (what will help most)
- Include learning resources if possible
- Explain WHY each recommendation matters

**INSTRUCTOR COMMENTS** - Personalized 2-4 sentence message:
- Overall impression of their understanding
- Key area to focus on for growth
- Encouraging note about their progress
- Avoid generic phrases - be PERSONAL and SPECIFIC

**EXAMPLE OF GOOD vs BAD FEEDBACK:**

❌ BAD (Generic, no evidence):
"Student participated actively but needs improvement in recursion basics."

✅ GOOD (Specific, evidence-based):
"In Q1, you correctly explained recursion as 'a function calling itself' showing solid grasp of the core concept. However, in Q3 when asked about base cases, you said 'when n equals zero' without explaining that base cases prevent infinite recursion and stack overflow. This shows you can identify WHAT a base case is, but not WHY it's critical."

Respond in the following JSON format:
{{
    "overall_summary": "2-3 sentence overview of performance, specific to this student",
    "strengths": [
        {{
            "description": "what they did well",
            "evidence": "exact quote from Q# or specific action",
            "concept": "which concept this relates to",
            "why_important": "why this strength matters"
        }}
    ],
    "weaknesses": [
        {{
            "description": "what needs improvement",
            "evidence": "exact quote from Q# showing the gap",
            "what_missing": "what they didn't understand",
            "correct_explanation": "what they should have said",
            "concept": "which concept this relates to"
        }}
    ],
    "misconceptions": [
        {{
            "misconception": "incorrect belief they hold",
            "student_said": "exact quote from Q#",
            "why_wrong": "explanation of the error",
            "correct_concept": "accurate explanation",
            "severity": "critical|moderate|minor"
        }}
    ],
    "concept_analysis": [
        {{
            "concept": "concept name",
            "mastery_percentage": [from score breakdown],
            "what_they_understand": "specific aspects they grasp",
            "what_they_dont": "specific gaps in understanding",
            "evidence": "references to specific questions"
        }}
    ],
    "recommendations": [
        {{
            "priority": "high|medium|low",
            "action": "specific action (Review X, Practice Y)",
            "reason": "why this will help",
            "resources": "specific learning materials if applicable"
        }}
    ],
    "instructor_comments": "Personalized 2-4 sentence message to the student. Be encouraging but honest. Reference specific moments from their conversation. Avoid generic phrases.",
    "next_steps": ["Immediate action 1", "Immediate action 2", "Immediate action 3"],
    "positive_note": "One encouraging observation about their learning or effort"
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
