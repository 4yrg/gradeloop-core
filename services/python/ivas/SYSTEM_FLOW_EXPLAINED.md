# IVAS System Flow - Complete Explanation

## 🎯 Overview

IVAS (Intelligent Viva Assessment System) conducts automated oral programming exams using AI. Students answer questions verbally, and the system adapts questions based on their performance using **IRT** and **BKT** algorithms.

---

## 📊 Complete Flow: From Start to Final Report

### **Phase 1: Session Initialization** (`POST /viva/start`)

```
Student submits:
  ├─ student_id
  ├─ assignment_title
  ├─ assignment_description
  └─ student_code

↓

1. Generate Session ID (UUID)
2. Initialize Adaptive Service
3. Generate Question Bank (10 questions via LLM)
4. Select First Question (easiest)
5. Convert Question to Speech (TTS)
6. Create Session Object
7. Return: session_id, question_text, question_audio
```

**What happens internally:**

1. **LLM Service** analyzes the assignment and generates 10 conceptual questions
   - Questions grouped: EASY (Q1-4), MEDIUM (Q5-7), HARD (Q8-10)
   - Each question assigned a difficulty score: -3 (easiest) to +3 (hardest)

2. **Adaptive Service** initializes:
   - Student ability (θ) = 0.0 (neutral)
   - Topic knowledge probabilities = 0.3 (30% for all topics)
   - Question bank = 10 generated questions

3. **First Question Selection**:
   - Always picks the easiest question (lowest difficulty)
   - Typically a basic definition question like "What is a for loop?"

4. **TTS Service** converts question text to audio (MP3/WAV)

---

### **Phase 2: Answer Submission** (`POST /viva/answer`)

```
Student submits:
  ├─ session_id
  ├─ question_number
  └─ audio file (WAV/MP3)

↓

1. Transcribe Audio → Text (ASR/Whisper)
2. Assess Answer (LLM)
3. Adjust Score (IRT)
4. Generate Feedback (LLM)
5. Update Student Model (IRT + BKT)
6. Select Next Question (Adaptive)
7. Convert to Speech (TTS)
8. Return: transcript, assessment, next_question, audio

OR (after 5 questions):

8. Generate Final Report (LLM)
9. Return: final_report with competency level
```

**Detailed breakdown:**

#### **Step 1: Speech-to-Text (ASR Service)**
```python
# Uses OpenAI Whisper model
audio_bytes → Whisper → transcript

Example:
Audio: "A for loop is used when you know how many times to repeat"
→ Transcript: "A for loop is used when you know how many times to repeat"
```

**ASR Service handles:**
- Converts audio bytes to temporary file
- Runs Whisper transcription (base model)
- Returns cleaned text
- Handles transcription errors gracefully

---

#### **Step 2: Answer Assessment (LLM Service)**
```python
# LLM evaluates the answer
Question: "What is a for loop?"
Answer: "A for loop is used when you know how many times to repeat"

LLM analyzes:
  ├─ Relevance: Does it address the question?
  ├─ Correctness: Is the concept right?
  ├─ Completeness: Are key points covered?
  └─ Transcription errors: Interprets "four loop" as "for loop"

Returns:
  ├─ understanding_level: "good"
  └─ score: 75/100 (raw score)
```

**LLM Scoring Guidelines:**
- 80-100: Excellent - correct understanding
- 60-79: Good - mostly correct
- 40-59: Partial - some understanding
- 20-39: Minimal - vague/mostly incorrect
- 0-19: None - wrong/off-topic

**Post-processing validation:**
- Checks for "I don't know" → caps score at 15
- Checks for very short answers (<3 words) → caps at 25
- Handles transcription noise gracefully

---

#### **Step 3: Score Adjustment (IRT Algorithm)**

**IRT (Item Response Theory)** adjusts scores based on question difficulty:

```python
# Difficulty-based bonus
if question_difficulty < -1.0:  # EASY
    adjusted_score = raw_score  # No bonus
elif question_difficulty < 0:   # MEDIUM-EASY
    bonus = (raw_score / 100) * 5  # Up to +5 bonus
    adjusted_score = min(100, raw_score + bonus)
else:                            # MEDIUM-HARD to HARD
    bonus = (raw_score / 100) * 10  # Up to +10 bonus
    adjusted_score = min(100, raw_score + bonus)

Example:
  Question: "What is a nested loop?" (difficulty: +0.3, MEDIUM-HARD)
  Raw score: 60/100
  Bonus: (60/100) * 10 = 6
  Adjusted score: 66/100
```

**Why?** Harder questions deserve more credit for partial understanding.

---

#### **Step 4: Generate Feedback (Adaptive Service)**

```python
# LLM generates personalized feedback
if score >= 70:
    "That's right! A for loop is used when you know the iterations."
elif score >= 50:
    "Partially correct. You mentioned repetition, but for loops are specifically for known iterations."
else:
    "Not quite. A for loop is used when you know how many times to repeat."
```

---

#### **Step 5: Update Student Model (IRT + BKT)**

**IRT: Update Student Ability (θ)**

```python
# Convert score to ability scale
ability = (score - 50) / 50 * 3

Example:
  Score 50 → θ = 0.0 (neutral)
  Score 75 → θ = +1.5 (above average)
  Score 25 → θ = -1.5 (below average)

# Weighted average with recency effect
for i, entry in enumerate(conversation_history):
    weight = 1.0 + (i / total_questions) * 0.3  # Recent answers weighted more
    weighted_sum += ability * weight

student_theta = weighted_sum / total_weight

Example progression:
  Q1: Score 80 → θ = +1.8
  Q2: Score 60 → θ = +0.6 (weighted avg)
  Q3: Score 70 → θ = +1.2 (weighted avg)
```

**BKT: Update Topic Knowledge**

```python
# Bayesian Knowledge Tracing
correct = (score >= 60)  # Consider 60+ as "correct"

if correct:
    # Increase knowledge probability
    P_new = min(0.95, P_current + (1 - P_current) * 0.3)
else:
    # Decrease knowledge probability
    P_new = max(0.05, P_current * 0.8)

Example:
  Topic: "loops"
  Initial: P(loops) = 0.3 (30% knowledge)
  
  After correct answer (score 75):
    P_new = min(0.95, 0.3 + (1 - 0.3) * 0.3)
    P_new = min(0.95, 0.3 + 0.21)
    P_new = 0.51 (51% knowledge)
  
  After incorrect answer (score 40):
    P_new = max(0.05, 0.51 * 0.8)
    P_new = 0.41 (41% knowledge)
```

**BKT Parameters:**
- `P_INIT = 0.3` - Initial knowledge probability (30%)
- `P_LEARN = 0.2` - Learning rate after correct answer
- `P_GUESS = 0.25` - Probability of guessing correctly
- `P_SLIP = 0.1` - Probability of making a mistake when you know

---

#### **Step 6: Select Next Question (Adaptive Algorithm)**

**The Magic: IRT Information Function**

```python
# 1. Calculate probability student will answer correctly (2PL IRT model)
P(correct) = 1 / (1 + e^(-1.7 * (θ - difficulty)))

Example:
  Student θ = +1.0
  Question difficulty = +0.5
  P(correct) = 1 / (1 + e^(-1.7 * (1.0 - 0.5)))
  P(correct) = 1 / (1 + e^(-0.85))
  P(correct) = 0.70 (70% chance of answering correctly)

# 2. Calculate Fisher Information (how much we learn)
I(θ, difficulty) = 1.7² * P * (1 - P)

Example:
  P = 0.70
  I = 2.89 * 0.70 * 0.30
  I = 0.61 (high information gain)

# 3. Calculate topic uncertainty
uncertainty = abs(0.5 - P(topic_knowledge))

Example:
  P(loops) = 0.51
  uncertainty = abs(0.5 - 0.51) = 0.01 (low uncertainty, we're confident)
  
  P(conditionals) = 0.30
  uncertainty = abs(0.5 - 0.30) = 0.20 (high uncertainty, need more info)

# 4. Combined score (70% information, 30% topic coverage)
score = 0.7 * IRT_information + 0.3 * topic_uncertainty

# 5. Select question with highest score
```

**Example Selection:**

```
Student θ = +1.0 (above average)
Available questions:

Q: "What is iteration?" (diff: -0.8, topic: loops)
  → P(correct) = 0.85
  → Information = 2.89 * 0.85 * 0.15 = 0.37
  → Topic uncertainty = 0.01 (loops known)
  → Combined = 0.7 * 0.37 + 0.3 * 0.01 = 0.26

Q: "What is a nested loop?" (diff: +0.3, topic: loops)
  → P(correct) = 0.67
  → Information = 2.89 * 0.67 * 0.33 = 0.64
  → Topic uncertainty = 0.01
  → Combined = 0.7 * 0.64 + 0.3 * 0.01 = 0.45 ← SELECTED!

Q: "What is a conditional?" (diff: -1.0, topic: conditionals)
  → P(correct) = 0.88
  → Information = 2.89 * 0.88 * 0.12 = 0.31
  → Topic uncertainty = 0.20 (conditionals unknown)
  → Combined = 0.7 * 0.31 + 0.3 * 0.20 = 0.28
```

**Why "nested loop" wins?**
- Provides maximum information gain (0.64)
- Matches student ability well (67% success probability)
- Not too easy, not too hard - perfect for learning

---

#### **Step 7: Text-to-Speech (TTS Service)**

```python
# Combine feedback + next question
combined_text = f"{feedback} ... Now, let's move on. {next_question}"

Example:
"That's right! A for loop is used when you know the iterations. 
... Now, let's move on. What is a nested loop?"

TTS → audio_bytes (MP3/WAV)
```

**TTS Service uses:**
- Google TTS (gTTS) - fast, cloud-based
- Fallback: pyttsx3 (offline)
- Fallback: macOS `say` command

---

### **Phase 3: Final Report Generation** (After 5 questions)

```python
# Calculate average score
total_score = sum(all_scores) / 5

# Determine competency level
if total_score >= 85:
    competency = "EXPERT"
elif total_score >= 65:
    competency = "ADVANCED"
elif total_score >= 40:
    competency = "INTERMEDIATE"
else:
    competency = "BEGINNER"

# LLM generates detailed report
report = {
    "total_score": 72,
    "competency_level": "ADVANCED",
    "strengths": [
        "Strong understanding of loop concepts",
        "Clear explanations of iteration",
        "Good grasp of when to use different loop types"
    ],
    "weaknesses": [
        "Struggled with nested loop complexity",
        "Could improve explanation of edge cases"
    ],
    "recommendations": [
        "Practice implementing nested loops",
        "Study loop termination conditions",
        "Review examples of complex iteration patterns"
    ],
    "conversation_history": [...]
}
```

---

## 🧮 Algorithm Deep Dive

### **IRT (Item Response Theory)**

**Purpose:** Match question difficulty to student ability

**Key Concepts:**
1. **Student Ability (θ)**: -3 to +3 scale
   - -3: Very low ability
   - 0: Average ability
   - +3: Very high ability

2. **Question Difficulty (b)**: -3 to +3 scale
   - -3: Very easy question
   - 0: Medium difficulty
   - +3: Very hard question

3. **2PL Model (2-Parameter Logistic)**:
   ```
   P(correct | θ, b) = 1 / (1 + e^(-a(θ - b)))
   
   Where:
   - θ = student ability
   - b = question difficulty
   - a = 1.7 (discrimination parameter, fixed)
   ```

4. **Fisher Information**:
   ```
   I(θ, b) = a² * P(θ, b) * (1 - P(θ, b))
   
   Maximum information when P ≈ 0.5
   (question difficulty matches student ability)
   ```

**Example:**
```
Student θ = 0.0 (average)

Easy question (b = -2.0):
  P(correct) = 0.95 → Information = 0.14 (low, too easy)

Medium question (b = 0.0):
  P(correct) = 0.50 → Information = 0.72 (high, perfect match!)

Hard question (b = +2.0):
  P(correct) = 0.05 → Information = 0.14 (low, too hard)
```

---

### **BKT (Bayesian Knowledge Tracing)**

**Purpose:** Track knowledge state for each topic

**Key Concepts:**
1. **Knowledge State (L)**: Binary (knows / doesn't know)
2. **Probabilities**:
   - P(L₀) = 0.3 - Initial knowledge (30%)
   - P(T) = 0.2 - Probability of learning (transition)
   - P(G) = 0.25 - Probability of guessing correctly
   - P(S) = 0.1 - Probability of slip (error when knows)

3. **Update Rules**:
   ```
   After CORRECT answer:
     P(L_new) = P(L_old) + (1 - P(L_old)) * P(T)
     P(L_new) = min(0.95, P(L_old) + (1 - P(L_old)) * 0.3)
   
   After INCORRECT answer:
     P(L_new) = P(L_old) * (1 - P(forget))
     P(L_new) = max(0.05, P(L_old) * 0.8)
   ```

**Example Progression:**
```
Topic: "loops"

Initial: P(loops) = 0.30

Q1: "What is a for loop?" → Score 80 (correct)
  P(loops) = 0.30 + (1 - 0.30) * 0.3 = 0.51

Q2: "What is iteration?" → Score 70 (correct)
  P(loops) = 0.51 + (1 - 0.51) * 0.3 = 0.66

Q3: "What is a nested loop?" → Score 40 (incorrect)
  P(loops) = 0.66 * 0.8 = 0.53

Q4: "Why use loops?" → Score 75 (correct)
  P(loops) = 0.53 + (1 - 0.53) * 0.3 = 0.67

Final: P(loops) = 0.67 (67% confidence in loop knowledge)
```

---

## 🔄 Complete Example Session

```
ASSIGNMENT: "Write loops to print patterns"

═══════════════════════════════════════════════════════════

INITIALIZATION:
  ✓ Generated 10 questions (4 EASY, 3 MEDIUM, 3 HARD)
  ✓ Student θ = 0.0
  ✓ P(loops) = 0.3

═══════════════════════════════════════════════════════════

QUESTION 1: "What is a for loop?" (difficulty: -1.5, EASY)

Student: "A for loop is used when you know how many times to repeat"
  → Transcript: ✓
  → Raw score: 80/100 (good)
  → Adjusted: 80/100 (no bonus, easy question)
  → Feedback: "That's right! A for loop is used when you know the iterations."
  
Updates:
  → θ = +1.8
  → P(loops) = 0.51

Next question selection:
  → "What is iteration?" (I=0.42) vs "What is a nested loop?" (I=0.35)
  → Selected: "What is iteration?" (higher information)

═══════════════════════════════════════════════════════════

QUESTION 2: "What is iteration?" (difficulty: -0.8, EASY)

Student: "It's one cycle of the loop"
  → Raw score: 75/100 (good)
  → Adjusted: 75/100
  → Feedback: "Correct! Iteration is one execution of the loop body."
  
Updates:
  → θ = +1.5 (weighted average)
  → P(loops) = 0.66

═══════════════════════════════════════════════════════════

QUESTION 3: "What is a nested loop?" (difficulty: +0.3, MEDIUM)

Student: "Um... a loop inside something?"
  → Raw score: 45/100 (partial)
  → Adjusted: 50/100 (bonus for harder question)
  → Feedback: "Partially correct. A nested loop is a loop inside another loop."
  
Updates:
  → θ = +0.9
  → P(loops) = 0.53 (decreased due to incorrect)

═══════════════════════════════════════════════════════════

QUESTION 4: "Why do we use loops?" (difficulty: -1.0, EASY)

Student: "To repeat code without writing it multiple times"
  → Raw score: 85/100 (excellent)
  → Adjusted: 85/100
  → Feedback: "Excellent! That's exactly right."
  
Updates:
  → θ = +1.2
  → P(loops) = 0.67

═══════════════════════════════════════════════════════════

QUESTION 5: "What happens if a loop condition is always true?" (difficulty: +0.5, MEDIUM)

Student: "It will keep running forever"
  → Raw score: 70/100 (good)
  → Adjusted: 77/100 (bonus for harder question)
  → Feedback: "That's right! It creates an infinite loop."
  
Updates:
  → θ = +1.3
  → P(loops) = 0.77

═══════════════════════════════════════════════════════════

FINAL REPORT:

Total Score: 73/100
Competency Level: ADVANCED

Strengths:
  - Strong understanding of basic loop concepts
  - Clear explanations of iteration and loop purpose
  - Good grasp of infinite loops

Weaknesses:
  - Struggled with nested loop complexity
  - Could provide more detailed explanations

Recommendations:
  - Practice implementing nested loops with examples
  - Study complex loop patterns
  - Review loop control flow diagrams

Final Student Model:
  - Ability (θ): +1.3 (above average)
  - Loop knowledge: 77% confidence
```

---

## 📈 Key Benefits

1. **Adaptive Difficulty**: Questions match student ability
2. **Fair Scoring**: Harder questions get credit for partial answers
3. **No Duplicates**: Tracks asked questions explicitly
4. **Topic Coverage**: BKT ensures diverse concept testing
5. **Personalized**: Feedback based on actual performance
6. **Efficient**: Only 5 questions needed for accurate assessment

---

## 🎓 Summary

**IVAS Flow:**
1. Generate questions → 2. Ask easiest first → 3. Transcribe answer → 
4. Assess with LLM → 5. Adjust score (IRT) → 6. Update student model (IRT+BKT) → 
7. Select next question (maximize information) → 8. Repeat 5 times → 
9. Generate final report

**IRT does:** Match question difficulty to student ability for maximum learning
**BKT does:** Track knowledge probability per topic to ensure coverage
**LLM does:** Generate questions, assess answers, provide feedback, create reports
**ASR does:** Convert speech to text (Whisper)
**TTS does:** Convert text to speech (gTTS/pyttsx3)
