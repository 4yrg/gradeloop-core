package com.gradeloop.ivas.service;

import com.gradeloop.ivas.dto.QuestionResponse;
import com.gradeloop.ivas.model.VivaQuestion;
import com.gradeloop.ivas.model.VivaSession;
import com.gradeloop.ivas.repository.VivaQuestionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service for managing viva questions during a live session
 * 
 * IMPORTANT: IVAS asks questions about the STUDENT'S SUBMITTED CODE
 * This is a voice-based assessment of their understanding of THEIR implementation
 * 
 * Flow:
 * 1. Student submits code (Submission Service)
 * 2. IVAS fetches the submitted code
 * 3. IVAS generates questions about THEIR specific implementation
 * 4. Student answers verbally about THEIR code
 * 5. IVAS evaluates understanding
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class QuestionManagementService {

    private final VivaQuestionRepository questionRepository;
    private final VivaSessionService sessionService;

    /**
     * Mock student submission - in production, this would come from Submission Service
     * This represents the student's actual submitted code for the assignment
     */
    private static final String MOCK_STUDENT_SUBMISSION = 
        "class AVLTree:\n" +
        "    def __init__(self, value):\n" +
        "        self.value = value\n" +
        "        self.left = None\n" +
        "        self.right = None\n" +
        "        self.height = 1\n\n" +
        "    def insert(self, value):\n" +
        "        if value < self.value:\n" +
        "            if self.left is None:\n" +
        "                self.left = AVLTree(value)\n" +
        "            else:\n" +
        "                self.left.insert(value)\n" +
        "        else:\n" +
        "            if self.right is None:\n" +
        "                self.right = AVLTree(value)\n" +
        "            else:\n" +
        "                self.right.insert(value)\n" +
        "        self.height = 1 + max(self.get_height(self.left), self.get_height(self.right))\n" +
        "        self.balance()\n\n" +
        "    def balance(self):\n" +
        "        balance_factor = self.get_balance_factor()\n" +
        "        if balance_factor > 1:\n" +
        "            if self.get_balance_factor(self.left) < 0:\n" +
        "                self.left.rotate_left()\n" +
        "            self.rotate_right()\n" +
        "        elif balance_factor < -1:\n" +
        "            if self.get_balance_factor(self.right) > 0:\n" +
        "                self.right.rotate_right()\n" +
        "            self.rotate_left()\n\n" +
        "    def get_height(self, node):\n" +
        "        return node.height if node else 0\n\n" +
        "    def get_balance_factor(self, node=None):\n" +
        "        if node is None:\n" +
        "            node = self\n" +
        "        return self.get_height(node.left) - self.get_height(node.right)";

    /**
     * Questions about the STUDENT'S SUBMITTED CODE
     * These ask about THEIR implementation, not generic concepts
     */
    private static final List<DemoQuestion> SUBMISSION_BASED_QUESTIONS = List.of(
            new DemoQuestion(
                    "Walk me through your AVL tree insert method. How does your implementation maintain balance?",
                    MOCK_STUDENT_SUBMISSION,
                    "Medium",
                    List.of("AVL tree", "self-balancing", "height tracking", "rotation")
            ),
            new DemoQuestion(
                    "In your balance() method, explain why you check if balance_factor > 1 or < -1. What do these values mean in your tree?",
                    MOCK_STUDENT_SUBMISSION,
                    "Hard",
                    List.of("balance factor", "tree imbalance", "rotation trigger")
            ),
            new DemoQuestion(
                    "I see you update the height after insertion. Why is this necessary in your implementation? What would happen if you forgot to update it?",
                    MOCK_STUDENT_SUBMISSION,
                    "Medium",
                    List.of("height property", "tree properties", "balance calculation")
            ),
            new DemoQuestion(
                    "Your code performs rotations (rotate_left, rotate_right). Explain when your implementation triggers a left rotation versus a right rotation.",
                    MOCK_STUDENT_SUBMISSION,
                    "Hard",
                    List.of("tree rotation", "rebalancing", "AVL properties")
            ),
            new DemoQuestion(
                    "What is the time complexity of your insert operation? Walk me through the steps and explain how you arrived at this complexity.",
                    MOCK_STUDENT_SUBMISSION,
                    "Medium",
                    List.of("time complexity", "O(log n)", "tree height", "insertion cost")
            )
    );

    /**
     * Get the next question for a session
     * Questions are about the STUDENT'S SUBMITTED CODE
     * 
     * In production: Would fetch from Submission Service and generate questions dynamically
     * For now: Uses mock submission with pre-generated questions
     */
    @Transactional
    public QuestionResponse getNextQuestion(UUID sessionId) {
        VivaSession session = sessionService.getSession(sessionId);
        
        if (session.getStatus() != VivaSession.SessionStatus.IN_PROGRESS) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Session is not in progress");
        }

        // Get already asked questions count
        List<VivaQuestion> askedQuestions = questionRepository.findBySessionIdOrderBySequence(sessionId);
        int questionIndex = askedQuestions.size();

        // Check if we've asked all questions about their submission
        if (questionIndex >= SUBMISSION_BASED_QUESTIONS.size()) {
            log.info("All questions about student's submission asked for session {}, ready to end", sessionId);
            return null; // Signal end of session
        }

        // Get next question about their submitted code
        DemoQuestion demoQ = SUBMISSION_BASED_QUESTIONS.get(questionIndex);

        // Create and save question record
        VivaQuestion question = VivaQuestion.builder()
                .session(session)
                .questionText(demoQ.text)
                .codeSnippet(demoQ.code)
                .difficulty(demoQ.difficulty)
                .sequence(questionIndex + 1)
                .askedAt(LocalDateTime.now())
                .build(); about student's submission: {}", 
                saved.getSequence(), sessionId, demoQ.text.substring(0, 50) + "...");

        return QuestionResponse.fromEntity(saved, demoQ.expectedConcepts);
    }

    /**
     * Fetch student's submitted code (mock for now)
     * In production: Would call Submission Service API
     */
    public String getStudentSubmission(UUID assignmentId, Long studentId) {
        // TODO: Replace with actual Submission Service call
        // return submissionServiceClient.getSubmission(assignmentId, studentId).getCode();
        
        log.info("Fetching mock submission for student {} on assignment {}", studentId, assignmentId);
        return MOCK_STUDENT_SUBMISSION
        log.info("Asked question {} for session {}: {}", saved.getSequence(), sessionId, demoQ.text);

        return QuestionResponse.fromEntity(saved, demoQ.expectedConcepts);
    }

    /**
     * Record student's response to a question
     */
    @Transactional
    public void recordResponse(UUID sessionId, UUID questionId, String responseText, Double score) {
        VivaQuestion question = questionRepository.findById(questionId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Question not found with id: " + questionId
                ));

        if (!question.getSession().getId().equals(sessionId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Question does not belong to this session");
        }

        question.setStudentResponse(responseText);
        question.setResponseScore(score);
        question.setTimeSpent(calculateTimeSpent(question.getAskedAt()));

        questionRepository.save(question);
        log.info("Recorded response for question {} in session {}, score: {}", questionId, sessionId, score);
    }

    /**
     * Get all questions asked in a session
     */
    public List<QuestionResponse> getSessionQuestions(UUID sessionId) {
        List<VivaQuestion> questions = questionRepository.findBySessionIdOrderBySequence(sessionId);
        return questions.stream()
                .map(q -> QuestionResponse.fromEntity(q, List.of())) // Concepts not needed for historical view
                .collect(Collectors.toList());
    }

    /**
     * Check if session should end based on questions answered
     */
    public boolean shouldEndSession(UUID sessionId) {
        List<VivaQuestion> questions = questionRepository.findBySessionIdOrderBySequence(sessionId);
        return questions.size() >= DEMO_QUESTIONS.size();
    }

    private int calculateTimeSpent(LocalDateTime startTime) {
        return (int) java.time.Duration.between(startTime, LocalDateTime.now()).getSeconds();
    }

    /**
     * Inner class for demo questions
     */
    private static record DemoQuestion(
            String text,
            String code,
            String difficulty,
            List<String> expectedConcepts
    ) {}
}
