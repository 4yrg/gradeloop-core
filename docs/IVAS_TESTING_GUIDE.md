# IVAS Testing Guide

> **Quick guide to test the new question management endpoints**

## Prerequisites

```bash
# 1. Start PostgreSQL
cd infra/docker
docker compose up -d postgres

# 2. Start IVAS service
cd services/java/ivas
./mvnw spring-boot:run
# Service should start on http://localhost:8084
```

## Test Sequence

### Step 1: Create a Viva Configuration

First, create a configuration for your assignment:

```bash
curl -X POST http://localhost:8084/api/v1/viva/configurations \
  -H "Content-Type: application/json" \
  -H "X-User-Id: 1" \
  -d '{
    "assignmentId": "123e4567-e89b-12d3-a456-426614174000",
    "enabled": true,
    "duration": 600,
    "maxAttempts": 3,
    "passingThreshold": 0.6,
    "allowPracticeMode": true
  }'
```

**Expected Response:** Configuration object with `id`, `enabled: true`

---

### Step 2: Start a Viva Session

```bash
curl -X POST "http://localhost:8084/api/v1/viva/sessions/start?assignmentId=123e4567-e89b-12d3-a456-426614174000" \
  -H "X-User-Id: 1"
```

**Expected Response:**
```json
{
  "id": "session-uuid-here",
  "assignmentId": "123e4567-e89b-12d3-a456-426614174000",
  "studentId": 1,
  "attemptNumber": 1,
  "status": "IN_PROGRESS",
  "startedAt": "2026-01-06T...",
  "passFail": "PENDING"
}
```

**Copy the session `id` for next steps!**

---

### Step 3: Get First Question

```bash
# Replace {SESSION_ID} with actual session ID from step 2
curl http://localhost:8084/api/v1/viva/sessions/{SESSION_ID}/questions/next
```

**Expected Response:**
```json
{
  "id": "question-uuid",
  "questionText": "Explain how recursion works in programming. What are the key components?",
  "codeSnippet": "def factorial(n):\n    if n == 0:\n        return 1\n    return n * factorial(n-1)",
  "difficulty": "Easy",
  "sequence": 1,
  "askedAt": "2026-01-06T...",
  "expectedConcepts": ["recursion", "base case", "recursive case"]
}
```

**Copy the question `id` for next step!**

---

### Step 4: Submit Answer

```bash
# Replace {SESSION_ID} and {QUESTION_ID}
curl -X POST http://localhost:8084/api/v1/viva/sessions/{SESSION_ID}/questions/{QUESTION_ID}/answer \
  -H "Content-Type: application/json" \
  -d '{
    "responseText": "Recursion is when a function calls itself. It needs a base case to stop the recursion and a recursive case that breaks the problem down into smaller subproblems. In the factorial example, the base case is when n equals 0, returning 1. The recursive case multiplies n by factorial of n-1."
  }'
```

**Expected Response:** `200 OK` (empty body)

---

### Step 5: Get Next Question

Repeat step 3 to get the second question:

```bash
curl http://localhost:8084/api/v1/viva/sessions/{SESSION_ID}/questions/next
```

**Expected:** Question 2 about binary search time complexity

---

### Step 6: Complete All 5 Questions

Repeat steps 4-5 until you've answered all 5 questions. When you request the 6th question:

```bash
curl http://localhost:8084/api/v1/viva/sessions/{SESSION_ID}/questions/next
```

**Expected Response:** `204 No Content` (means no more questions)

---

### Step 7: End Session

```bash
curl -X POST http://localhost:8084/api/v1/viva/sessions/{SESSION_ID}/end
```

**Expected Response:**
```json
{
  "id": "session-uuid",
  "status": "COMPLETED",
  "finalScore": 0.75,
  "passFail": "PASS",
  "timeSpent": 120,
  "completedAt": "2026-01-06T..."
}
```

The `finalScore` is calculated from your answers (average of all question scores).
The `passFail` is determined by comparing to `passingThreshold` (0.6 by default).

---

### Step 8: Review Session Questions

```bash
curl http://localhost:8084/api/v1/viva/sessions/{SESSION_ID}/questions
```

**Expected Response:** Array of all 5 questions with your responses and scores:
```json
[
  {
    "id": "...",
    "questionText": "...",
    "sequence": 1,
    "studentResponse": "Recursion is...",
    "responseScore": 0.8,
    "timeSpent": 45
  },
  ...
]
```

---

## Demo Question List

The system currently has 5 hardcoded questions:

1. **Easy:** Explain recursion (base case, recursive case)
2. **Medium:** Binary search time complexity analysis
3. **Easy:** Stack vs Queue differences  
4. **Medium:** Consequences of missing base case
5. **Hard:** Fibonacci optimization (memoization)

---

## Scoring Algorithm

Current demo scoring (will be replaced with AI later):

```
Score = (Length Score × 0.5) + (Keyword Score × 0.5)

Length Score = min(word_count / 20, 0.5)
Keyword Score = min(matching_keywords / 10, 0.5)

Keywords: function, algorithm, complexity, data structure, 
          recursion, base case, time, space, optimal
```

**Example:**
- Response: 15 words, 3 keywords
- Length: 15/20 = 0.75 → capped at 0.5
- Keywords: 3/10 = 0.3 → 0.3
- **Final Score:** 0.5 + 0.3 = **0.8** (80%)

---

## Troubleshooting

### Database Connection Error
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# If not, start it
cd infra/docker && docker compose up -d postgres
```

### Configuration Not Found Error
Make sure you created the configuration first (Step 1) with the exact same `assignmentId`.

### Session Already Exists Error
If you get "Student already has an in-progress session", either:
- End the previous session first
- Use a different `X-User-Id` header
- Use a different `assignmentId`

### Port 8084 Already in Use
```bash
# Find and kill the process
lsof -ti:8084 | xargs kill -9

# Or change port in application.properties
server.port=8085
```

---

## Next Steps After Testing

Once all endpoints work:

1. **Frontend Integration** - Connect React components to these endpoints
2. **WebSocket** - Add real-time communication
3. **Audio** - Add voice recording/playback
4. **Polish** - Error handling, loading states, results page

---

**Last Updated:** January 6, 2026
