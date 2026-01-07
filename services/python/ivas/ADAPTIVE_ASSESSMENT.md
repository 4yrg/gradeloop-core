# Adaptive Assessment with IRT and BKT

## Overview

The IVAS system now uses **adaptive question selection** based on simplified implementations of:
- **IRT (Item Response Theory)** - for difficulty-based question selection and scoring
- **BKT (Bayesian Knowledge Tracing)** - for tracking knowledge states per topic

## Key Features

### 1. Dynamic Question Bank
- Questions are automatically selected based on assignment description keywords
- Supports multiple topics: loops, conditionals, functions, arrays, strings, variables
- Easy to extend with new topics and questions

### 2. IRT-Based Selection
- **Student Ability (θ)**: Estimated on a scale from -3 (low) to +3 (high)
- **Question Difficulty**: Each question has a difficulty parameter (-3 to +3)
- **Information Maximization**: Selects questions that provide maximum information about student ability

### 3. BKT-Based Topic Tracking
- Tracks knowledge probability for each topic (0 to 1)
- Updates based on answer correctness
- Prioritizes topics with high uncertainty

### 4. Difficulty-Adjusted Scoring
- Harder questions receive bonus points for partial answers
- Easy questions: raw score
- Medium questions: up to +5 bonus
- Hard questions: up to +10 bonus

## How It Works

### Question Selection Algorithm

```python
# For first question: Pick easiest
if first_question:
    select_easiest_question()

# For subsequent questions:
# 1. Calculate information value for each available question
irt_information = fisher_information(student_theta, question_difficulty)

# 2. Calculate topic uncertainty
topic_uncertainty = abs(0.5 - topic_knowledge_prob)

# 3. Combined score (70% information, 30% topic coverage)
score = 0.7 * irt_information + 0.3 * topic_uncertainty

# 4. Select question with highest score
```

### Student Ability Update

After each answer:
```python
# Convert score (0-100) to ability scale (-3 to +3)
ability = (score - 50) / 50 * 3

# Weighted average with recency effect
student_theta = weighted_average(all_abilities, recent_weight=0.3)
```

### Topic Knowledge Update (BKT)

```python
if answer_correct (score >= 60):
    # Increase knowledge probability
    P_new = min(0.95, P_current + (1 - P_current) * 0.3)
else:
    # Decrease knowledge probability
    P_new = max(0.05, P_current * 0.8)
```

## Example Flow

```
Assignment: "Write loops to print patterns"

1. System detects "loops" keyword
   → Initializes loop-related questions with difficulty values

2. Student starts assessment
   → θ = 0 (neutral), all topics at P=0.5
   → First question: "What is a for loop?" (difficulty: -1.5, easiest)

3. Student answers: "Loop for when you know iterations"
   → Raw score: 80/100
   → Adjusted score: 80 (no bonus, easy question)
   → Updates: θ = +0.3, P(loops) = 0.65

4. Next question selected adaptively
   → Calculates info for all remaining questions
   → "What is iteration?" (diff: -0.8) → info = 0.42
   → "What is a nested loop?" (diff: +0.3) → info = 0.35
   → Selects "What is iteration?" (higher info for current θ)

5. Process continues for 5 questions total
   → Final θ and topic probabilities used in report
```

## Configuration

### Adding New Topics

Edit `adaptive_service.py`:

```python
# Add new question set
if 'recursion' in desc_lower:
    self.question_bank.extend([
        Question("What is recursion?", -1.0, "recursion"),
        Question("What is a base case?", 0.0, "recursion"),
        Question("When should you use recursion?", 0.5, "recursion"),
    ])
```

### Tuning Parameters

```python
# In AdaptiveQuestionService.__init__()
self.irt_weight = 0.7  # Weight for information maximization
self.topic_weight = 0.3  # Weight for topic coverage
self.learning_rate = 0.3  # How fast to update knowledge (BKT)
self.recency_weight = 0.3  # Weight for recent answers
```

## Benefits

1. **No Duplicate Questions**: Tracks asked questions explicitly
2. **Adaptive Difficulty**: Matches question difficulty to student ability
3. **Fair Scoring**: Harder questions get credit for partial understanding
4. **Topic Coverage**: Ensures diverse concept testing
5. **Generic**: Works with any programming topic, not just loops

## Future Enhancements

- **Multi-dimensional IRT**: Track different skill dimensions (syntax, concepts, problem-solving)
- **Parameter Estimation**: Learn question difficulties from real student data
- **Adaptive Stopping**: End assessment early if confidence is high
- **Question Generation**: Use LLM to generate new questions on-the-fly
- **Personalized Feedback**: Use θ and topic probabilities for targeted recommendations
