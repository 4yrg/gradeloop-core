package com.gradeloop.institute.service;

import com.gradeloop.institute.dto.CreateAssignmentRequest;
import com.gradeloop.institute.model.Assignment;
import com.gradeloop.institute.model.Course;
import com.gradeloop.institute.repository.AssignmentRepository;
import com.gradeloop.institute.repository.QuestionRepository;
import com.gradeloop.institute.repository.TestCaseRepository;
import com.gradeloop.institute.dto.*;
import com.gradeloop.institute.model.*;
import java.util.List;
import java.util.ArrayList;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AssignmentService {

    private final AssignmentRepository assignmentRepository;
    private final QuestionRepository questionRepository;
    private final TestCaseRepository testCaseRepository;
    private final CourseService courseService; // Assuming CourseService exists and handles course retrieval

    @Transactional
    public Assignment createAssignmentDraft(UUID courseId, CreateAssignmentRequest request) {
        // Validate Course exists
        Course course = courseService.getCourse(courseId); // Reusing existing service method

        // Phase 1 Validation
        validateDateOrdering(request.getReleaseDate(), request.getDueDate(), request.getLateDueDate());
        validateLateSubmissionRequirements(request.getAllowLateSubmissions(), request.getLateDueDate(),
                request.getDueDate());
        validateGroupSubmissionRequirements(request.getEnableGroupSubmissions(), request.getGroupSizeLimit());
        validateLeaderboardRequirements(request.getEnableLeaderboard(), request.getLeaderboardEntries());

        Assignment assignment = Assignment.builder()
                .name(request.getName())
                .course(course)
                .type(request.getType())
                .status(Assignment.AssignmentStatus.DRAFT)
                .autograderPoints(request.getAutograderPoints())
                .allowManualGrading(request.getAllowManualGrading())
                .releaseDate(request.getReleaseDate())
                .dueDate(request.getDueDate())
                .allowLateSubmissions(request.getAllowLateSubmissions())
                .lateDueDate(request.getLateDueDate())
                .enforceTimeLimit(request.getEnforceTimeLimit())
                .timeLimit(request.getTimeLimit())
                .enableGroupSubmissions(request.getEnableGroupSubmissions())
                .groupSizeLimit(request.getGroupSizeLimit())
                .enableLeaderboard(request.getEnableLeaderboard())
                .leaderboardEntries(request.getLeaderboardEntries())
                .build();

        Assignment savedAssignment = assignmentRepository.save(assignment);
        log.info("Assignment draft created: assignmentId={}, courseId={}, name={}, type={}",
                savedAssignment.getId(), courseId, savedAssignment.getName(), savedAssignment.getType());
        return savedAssignment;
    }

    @Transactional
    public QuestionResponse addQuestion(UUID assignmentId, CreateQuestionRequest request) {
        Assignment assignment = getAssignment(assignmentId);

        // Calculate next order index
        Integer maxOrderIndex = questionRepository.findByAssignment_Id(assignmentId).stream()
                .mapToInt(q -> q.getOrderIndex() != null ? q.getOrderIndex() : 0)
                .max().orElse(-1);

        // Validate resource limits if provided
        validateResourceLimits(request.getTimeLimit(), request.getMemoryLimit());

        Question question = Question.builder()
                .assignment(assignment)
                .title(request.getTitle())
                .description(request.getDescription())
                .points(request.getPoints())
                .weight(request.getWeight())
                .timeLimit(request.getTimeLimit())
                .memoryLimit(request.getMemoryLimit())
                .orderIndex(maxOrderIndex + 1)
                .build();

        Question savedQuestion = questionRepository.save(question);
        log.info("Question added: assignmentId={}, questionId={}, description={}, timeLimit={}, memoryLimit={}",
                assignmentId, savedQuestion.getId(), savedQuestion.getDescription(),
                savedQuestion.getTimeLimit(), savedQuestion.getMemoryLimit());
        return mapToQuestionResponse(savedQuestion);
    }

    @Transactional
    public QuestionResponse updateQuestion(UUID assignmentId, UUID questionId, UpdateQuestionRequest request) {
        Question question = getQuestion(questionId, assignmentId);

        if (request.getTitle() != null)
            question.setTitle(request.getTitle());
        if (request.getDescription() != null)
            question.setDescription(request.getDescription());
        if (request.getPoints() != null)
            question.setPoints(request.getPoints());
        if (request.getWeight() != null)
            question.setWeight(request.getWeight());
        if (request.getTimeLimit() != null) {
            validateResourceLimits(request.getTimeLimit(), null);
            question.setTimeLimit(request.getTimeLimit());
        }
        if (request.getMemoryLimit() != null) {
            validateResourceLimits(null, request.getMemoryLimit());
            question.setMemoryLimit(request.getMemoryLimit());
        }

        Question savedQuestion = questionRepository.save(question);
        log.info("Question updated: assignmentId={}, questionId={}", assignmentId, questionId);
        return mapToQuestionResponse(savedQuestion);
    }

    @Transactional
    public void deleteQuestion(UUID assignmentId, UUID questionId) {
        Question question = getQuestion(questionId, assignmentId);
        questionRepository.delete(question);
    }

    @Transactional
    public TestCaseResponse addTestCase(UUID assignmentId, UUID questionId, CreateTestCaseRequest request) {
        // Validate question belongs to assignment
        Question question = getQuestion(questionId, assignmentId);

        // Validate marks if provided
        if (request.getMarks() != null && request.getMarks() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    String.format("Test case marks must be non-negative, received: %d", request.getMarks()));
        }

        // Validate visibility is provided
        if (request.getVisibility() == null || request.getVisibility().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Test case visibility is required (e.g., 'PUBLIC', 'HIDDEN')");
        }

        TestCase testCase = TestCase.builder()
                .question(question)
                .input(request.getInput())
                .expectedOutput(request.getExpectedOutput())
                .isHidden(Boolean.TRUE.equals(request.getIsHidden()))
                .visibility(request.getVisibility())
                .marks(request.getMarks())
                .build();

        TestCase savedTestCase = testCaseRepository.save(testCase);
        log.info("Test case added: assignmentId={}, questionId={}, testCaseId={}, marks={}, isHidden={}",
                assignmentId, questionId, savedTestCase.getId(), savedTestCase.getMarks(), savedTestCase.isHidden());
        return mapToTestCaseResponse(savedTestCase);
    }

    @Transactional
    public TestCaseResponse updateTestCase(UUID assignmentId, UUID questionId, UUID testCaseId,
            UpdateTestCaseRequest request) {
        // Ensure hierarchy logic
        Question question = getQuestion(questionId, assignmentId);
        TestCase testCase = testCaseRepository.findById(testCaseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Test case not found"));

        if (!testCase.getQuestion().getId().equals(question.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Test case does not belong to the specified question");
        }

        if (request.getInput() != null)
            testCase.setInput(request.getInput());
        if (request.getExpectedOutput() != null)
            testCase.setExpectedOutput(request.getExpectedOutput());
        if (request.getIsHidden() != null)
            testCase.setHidden(request.getIsHidden());
        if (request.getVisibility() != null)
            testCase.setVisibility(request.getVisibility());
        if (request.getMarks() != null) {
            if (request.getMarks() < 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        String.format("Test case marks must be non-negative, received: %d", request.getMarks()));
            }
            testCase.setMarks(request.getMarks());
        }
        if (request.getVisibility() != null && !request.getVisibility().trim().isEmpty()) {
            testCase.setVisibility(request.getVisibility());
        }

        TestCase savedTestCase = testCaseRepository.save(testCase);
        log.info("Test case updated: assignmentId={}, questionId={}, testCaseId={}",
                assignmentId, questionId, testCaseId);
        return mapToTestCaseResponse(savedTestCase);
    }

    @Transactional
    public void deleteTestCase(UUID assignmentId, UUID questionId, UUID testCaseId) {
        // Ensure hierarchy logic
        getQuestion(questionId, assignmentId); // Validate question belongs to assignment
        TestCase testCase = getTestCase(testCaseId, questionId);

        testCaseRepository.delete(testCase);
        log.info("Test case deleted: assignmentId={}, questionId={}, testCaseId={}",
                assignmentId, questionId, testCaseId);
    }

    @Transactional
    public Assignment updateAssignmentConfig(UUID assignmentId, UpdateAssignmentConfigRequest request) {
        Assignment assignment = getAssignment(assignmentId);

        // Update Limits
        if (request.getEnforceTimeLimit() != null)
            assignment.setEnforceTimeLimit(request.getEnforceTimeLimit());
        if (request.getTimeLimit() != null)
            assignment.setTimeLimit(request.getTimeLimit());
        if (request.getMemoryLimit() != null)
            assignment.setMemoryLimit(request.getMemoryLimit());

        // Defaults if enforcing but no limit provided
        if (Boolean.TRUE.equals(assignment.getEnforceTimeLimit()) && assignment.getTimeLimit() == null) {
            assignment.setTimeLimit(60); // Default 60 mins
        }
        if (assignment.getMemoryLimit() == null) {
            assignment.setMemoryLimit(512); // Default 512MB safe value
        }

        // Update Grading Policy
        GradingPolicy policy = assignment.getGradingPolicy();
        if (policy == null) {
            policy = new GradingPolicy();
            assignment.setGradingPolicy(policy);
        }

        if (request.getAllowPartialCredits() != null)
            policy.setAllowPartialCredits(request.getAllowPartialCredits());
        if (request.getEnableRetries() != null)
            policy.setEnableRetries(request.getEnableRetries());
        if (request.getMaxRetries() != null)
            policy.setMaxRetries(request.getMaxRetries());
        if (request.getRetryPenalty() != null)
            policy.setRetryPenalty(request.getRetryPenalty());
        if (request.getMarkingGuide() != null)
            policy.setMarkingGuide(request.getMarkingGuide());

        // Policy Validation
        if (Boolean.TRUE.equals(policy.getEnableRetries())
                && (policy.getMaxRetries() == null || policy.getMaxRetries() < 1)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Max retries must be set when retries are enabled");
        }
        if (Boolean.FALSE.equals(policy.getEnableRetries()) && policy.getRetryPenalty() != null
                && policy.getRetryPenalty() > 0) {
            // Not necessarily an error, but logical inconsistency. We can ignore or warn.
            // Let's strict check as per requirements.
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Retry penalty specified but retries are disabled");
        }

        Assignment savedAssignment = assignmentRepository.save(assignment);
        log.info("Grading policy updated: assignmentId={}, allowPartialCredits={}, enableRetries={}",
                assignmentId, policy.getAllowPartialCredits(), policy.getEnableRetries());
        return savedAssignment;
    }

    private Assignment getAssignment(UUID assignmentId) {
        return assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        String.format("Assignment with ID '%s' not found", assignmentId)));
    }

    private Question getQuestion(UUID questionId, UUID assignmentId) {
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        String.format("Question with ID '%s' not found", questionId)));

        if (!question.getAssignment().getId().equals(assignmentId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    String.format("Question '%s' does not belong to assignment '%s'", questionId, assignmentId));
        }
        return question;
    }

    private TestCase getTestCase(UUID testCaseId, UUID questionId) {
        TestCase testCase = testCaseRepository.findById(testCaseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        String.format("Test case with ID '%s' not found", testCaseId)));

        if (!testCase.getQuestion().getId().equals(questionId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    String.format("Test case '%s' does not belong to question '%s'", testCaseId, questionId));
        }
        return testCase;
    }

    private QuestionResponse mapToQuestionResponse(Question question) {
        List<TestCaseResponse> testCases = question.getTestCases() != null
                ? question.getTestCases().stream().map(this::mapToTestCaseResponse).collect(Collectors.toList())
                : new ArrayList<>();

        return QuestionResponse.builder()
                .id(question.getId())
                .title(question.getTitle())
                .description(question.getDescription())
                .points(question.getPoints())
                .weight(question.getWeight())
                .timeLimit(question.getTimeLimit())
                .memoryLimit(question.getMemoryLimit())
                .testCases(testCases)
                .build();
    }

    private TestCaseResponse mapToTestCaseResponse(TestCase testCase) {
        return TestCaseResponse.builder()
                .id(testCase.getId())
                .input(testCase.getInput())
                .expectedOutput(testCase.getExpectedOutput())
                .isHidden(testCase.isHidden())
                .visibility(testCase.getVisibility())
                .marks(testCase.getMarks())
                .build();
    }

    // Validation helper methods
    private void validateDateOrdering(LocalDateTime releaseDate, LocalDateTime dueDate, LocalDateTime lateDueDate) {
        if (dueDate != null && releaseDate != null && dueDate.isBefore(releaseDate)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Due date cannot be before release date");
        }
        if (lateDueDate != null && dueDate != null && lateDueDate.isBefore(dueDate)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Late due date cannot be before regular due date");
        }
    }

    private void validateLateSubmissionRequirements(Boolean allowLate, LocalDateTime lateDueDate,
            LocalDateTime dueDate) {
        if (Boolean.TRUE.equals(allowLate)) {
            if (lateDueDate == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Late due date is required when late submissions are allowed");
            }
            if (dueDate != null && lateDueDate.isBefore(dueDate)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Late due date must be after regular due date");
            }
        }
    }

    private void validateGroupSubmissionRequirements(Boolean enableGroup, Integer groupSize) {
        if (Boolean.TRUE.equals(enableGroup) && (groupSize == null || groupSize < 1)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Group size limit must be at least 1 when group submissions are enabled");
        }
    }

    private void validateLeaderboardRequirements(Boolean enableLeaderboard, Integer entries) {
        if (Boolean.TRUE.equals(enableLeaderboard) && (entries == null || entries < 1)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Leaderboard entries must be at least 1 when leaderboard is enabled");
        }
    }

    private void validateResourceLimits(Integer timeLimit, Integer memoryLimit) {
        if (timeLimit != null && timeLimit < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    String.format("Time limit must be non-negative (in milliseconds), received: %d", timeLimit));
        }
        if (memoryLimit != null && memoryLimit < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    String.format("Memory limit must be non-negative (in MB), received: %d", memoryLimit));
        }
    }
}
