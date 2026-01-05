package com.gradeloop.institute.service;

import com.gradeloop.institute.dto.CreateAssignmentRequest;
import com.gradeloop.institute.model.Assignment;
import com.gradeloop.institute.model.Course;
import com.gradeloop.institute.repository.AssignmentRepository;
import com.gradeloop.institute.repository.CourseRepository;
import com.gradeloop.institute.repository.QuestionRepository;
import com.gradeloop.institute.repository.TestCaseRepository;
import com.gradeloop.institute.dto.*;
import com.gradeloop.institute.model.*;
import java.util.List;
import java.util.ArrayList;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AssignmentService {

    private final AssignmentRepository assignmentRepository;
    private final QuestionRepository questionRepository;
    private final TestCaseRepository testCaseRepository;
    private final CourseService courseService; // Assuming CourseService exists and handles course retrieval

    @Transactional
    public Assignment createAssignmentDraft(UUID courseId, CreateAssignmentRequest request) {
        // Validate Course exists
        Course course = courseService.getCourse(courseId); // Reusing existing service method

        // Logical Validation
        if (request.getDueDate() != null && request.getReleaseDate() != null
                && request.getDueDate().isBefore(request.getReleaseDate())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Due date cannot be before release date");
        }
        if (Boolean.TRUE.equals(request.getAllowLateSubmissions()) && request.getLateDueDate() != null
                && request.getDueDate() != null && request.getLateDueDate().isBefore(request.getDueDate())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Late due date cannot be before regular due date");
        }

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

        return assignmentRepository.save(assignment);
    }

    @Transactional
    public QuestionResponse addQuestion(UUID assignmentId, CreateQuestionRequest request) {
        Assignment assignment = getAssignment(assignmentId);

        Question question = Question.builder()
                .assignment(assignment)
                .description(request.getDescription())
                .points(request.getPoints())
                .build();

        Question savedQuestion = questionRepository.save(question);
        return mapToQuestionResponse(savedQuestion);
    }

    @Transactional
    public QuestionResponse updateQuestion(UUID assignmentId, UUID questionId, UpdateQuestionRequest request) {
        Question question = getQuestion(questionId, assignmentId);

        if (request.getDescription() != null)
            question.setDescription(request.getDescription());
        if (request.getPoints() != null)
            question.setPoints(request.getPoints());

        Question savedQuestion = questionRepository.save(question);
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

        TestCase testCase = TestCase.builder()
                .question(question)
                .input(request.getInput())
                .expectedOutput(request.getExpectedOutput())
                .isHidden(Boolean.TRUE.equals(request.getIsHidden()))
                .build();

        TestCase savedTestCase = testCaseRepository.save(testCase);
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

        TestCase savedTestCase = testCaseRepository.save(testCase);
        return mapToTestCaseResponse(savedTestCase);
    }

    @Transactional
    public void deleteTestCase(UUID assignmentId, UUID questionId, UUID testCaseId) {
        // Ensure hierarchy logic
        Question question = getQuestion(questionId, assignmentId);
        TestCase testCase = testCaseRepository.findById(testCaseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Test case not found"));

        if (!testCase.getQuestion().getId().equals(question.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Test case does not belong to the specified question");
        }

        testCaseRepository.delete(testCase);
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

        return assignmentRepository.save(assignment);
    }

    private Assignment getAssignment(UUID assignmentId) {
        return assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Assignment not found"));
    }

    private Question getQuestion(UUID questionId, UUID assignmentId) {
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Question not found"));
        if (!question.getAssignment().getId().equals(assignmentId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Question does not belong to the specified assignment");
        }
        return question;
    }

    private QuestionResponse mapToQuestionResponse(Question question) {
        List<TestCaseResponse> testCases = question.getTestCases() != null
                ? question.getTestCases().stream().map(this::mapToTestCaseResponse).collect(Collectors.toList())
                : new ArrayList<>();

        return QuestionResponse.builder()
                .id(question.getId())
                .description(question.getDescription())
                .points(question.getPoints())
                .testCases(testCases)
                .build();
    }

    private TestCaseResponse mapToTestCaseResponse(TestCase testCase) {
        return TestCaseResponse.builder()
                .id(testCase.getId())
                .input(testCase.getInput())
                .expectedOutput(testCase.getExpectedOutput())
                .isHidden(testCase.isHidden())
                .build();
    }
}
