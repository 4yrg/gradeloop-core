package com.gradeloop.authanalytics.service;

import com.gradeloop.authanalytics.dto.AuthEventMessage;
import com.gradeloop.authanalytics.dto.AuthEventResponse;
import com.gradeloop.authanalytics.dto.PagedResponse;
import com.gradeloop.authanalytics.dto.StudentAuthSummary;
import com.gradeloop.authanalytics.entity.AuthEvent;
import com.gradeloop.authanalytics.exception.InvalidDataException;
import com.gradeloop.authanalytics.exception.MessagingException;
import com.gradeloop.authanalytics.exception.ResourceNotFoundException;
import com.gradeloop.authanalytics.repository.AuthEventRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Validated
public class AuthEventService {

    private final AuthEventRepository authEventRepository;
    private static final BigDecimal SUSPICIOUS_THRESHOLD = new BigDecimal("0.5");

    /**
     * Listen for auth events from RabbitMQ and store them
     */
    @RabbitListener(queues = "keystroke.auth.events")
    @Transactional
    public void handleAuthEvent(@Valid AuthEventMessage message) {
        try {
            log.info("Received auth event for student: {}, assignment: {}",
                    message.getStudentId(), message.getAssignmentId());

            validateAuthEventMessage(message);

            AuthEvent event = AuthEvent.builder()
                    .studentId(message.getStudentId())
                    .assignmentId(message.getAssignmentId())
                    .courseId(message.getCourseId())
                    .sessionId(message.getSessionId())
                    .confidenceLevel(message.getConfidenceLevel())
                    .riskScore(message.getRiskScore())
                    .keystrokeSampleSize(message.getKeystrokeSampleSize())
                    .eventTimestamp(message.getTimestamp() != null ? message.getTimestamp() : LocalDateTime.now())
                    .authenticated(message.getAuthenticated())
                    .similarityScore(message.getSimilarityScore())
                    .metadata(message.getMetadata())
                    .build();

            authEventRepository.save(event);
            log.info("Successfully stored auth event with ID: {}", event.getId());

        } catch (InvalidDataException e) {
            log.error("Invalid auth event data: {}", e.getMessage());
            throw new MessagingException("Invalid auth event data", e);
        } catch (Exception e) {
            log.error("Error processing auth event: {}", e.getMessage(), e);
            throw new MessagingException("Failed to process auth event", e);
        }
    }

    /**
     * Validate auth event message
     */
    private void validateAuthEventMessage(AuthEventMessage message) {
        if (message.getStudentId() == null || message.getStudentId().trim().isEmpty()) {
            throw new InvalidDataException("studentId", "cannot be null or empty");
        }
        if (message.getAssignmentId() == null || message.getAssignmentId().trim().isEmpty()) {
            throw new InvalidDataException("assignmentId", "cannot be null or empty");
        }
        if (message.getCourseId() == null || message.getCourseId().trim().isEmpty()) {
            throw new InvalidDataException("courseId", "cannot be null or empty");
        }
    }

    /**
     * Get all auth events for a student on an assignment
     */
    public List<AuthEventResponse> getStudentAssignmentEvents(String studentId, String assignmentId) {
        List<AuthEvent> events = authEventRepository
                .findByStudentIdAndAssignmentIdOrderByEventTimestampDesc(studentId, assignmentId);
        return events.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get all auth events with pagination
     */
    public PagedResponse<AuthEventResponse> getStudentAssignmentEventsPaged(
            String studentId, String assignmentId, int page, int size) {
        if (page < 0) {
            throw new InvalidDataException("page", "must be non-negative");
        }
        if (size <= 0 || size > 100) {
            throw new InvalidDataException("size", "must be between 1 and 100");
        }

        Pageable pageable = PageRequest.of(page, size, Sort.by("eventTimestamp").descending());
        Page<AuthEvent> eventPage = authEventRepository.findByStudentIdAndAssignmentId(
                studentId, assignmentId, pageable);

        List<AuthEventResponse> responses = eventPage.getContent().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        return PagedResponse.<AuthEventResponse>builder()
                .content(responses)
                .page(eventPage.getNumber())
                .size(eventPage.getSize())
                .totalElements(eventPage.getTotalElements())
                .totalPages(eventPage.getTotalPages())
                .first(eventPage.isFirst())
                .last(eventPage.isLast())
                .build();
    }

    /**
     * Get summary statistics for a student on an assignment
     */
    public StudentAuthSummary getStudentAssignmentSummary(String studentId, String assignmentId) {
        List<AuthEvent> events = authEventRepository
                .findByStudentIdAndAssignmentIdOrderByEventTimestampDesc(studentId, assignmentId);

        if (events.isEmpty()) {
            throw new ResourceNotFoundException("Auth events",
                    "studentId=" + studentId + ", assignmentId=" + assignmentId);
        }
        BigDecimal avgConfidence = authEventRepository.getAverageConfidence(studentId, assignmentId);
        BigDecimal avgRiskScore = authEventRepository.getAverageRiskScore(studentId, assignmentId);
        Long suspiciousCount = authEventRepository.countSuspiciousEvents(studentId, assignmentId, SUSPICIOUS_THRESHOLD);

        List<Object[]> confidenceRange = authEventRepository.getConfidenceRange(studentId, assignmentId);
        List<Object[]> timeRange = authEventRepository.getTimeRange(studentId, assignmentId);

        BigDecimal minConfidence = BigDecimal.ZERO;
        BigDecimal maxConfidence = BigDecimal.ZERO;
        LocalDateTime firstEventTime = null;
        LocalDateTime lastEventTime = null;

        if (!confidenceRange.isEmpty() && confidenceRange.get(0)[0] != null) {
            minConfidence = (BigDecimal) confidenceRange.get(0)[0];
            maxConfidence = (BigDecimal) confidenceRange.get(0)[1];
        }

        if (!timeRange.isEmpty() && timeRange.get(0)[0] != null) {
            firstEventTime = (LocalDateTime) timeRange.get(0)[0];
            lastEventTime = (LocalDateTime) timeRange.get(0)[1];
        }

        Long totalEvents = (long) authEventRepository.findByStudentIdAndAssignmentIdOrderByEventTimestampDesc(
                studentId, assignmentId).size();

        String riskLevel = calculateRiskLevel(avgRiskScore);

        return StudentAuthSummary.builder()
                .studentId(studentId)
                .assignmentId(assignmentId)
                .totalEvents((long) totalEvents)
                .averageConfidence(avgConfidence != null ? avgConfidence.setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO)
                .averageRiskScore(avgRiskScore != null ? avgRiskScore.setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO)
                .minConfidence(minConfidence)
                .maxConfidence(maxConfidence)
                .suspiciousEvents(suspiciousCount != null ? suspiciousCount : 0L)
                .firstEventTime(firstEventTime)
                .lastEventTime(lastEventTime)
                .riskLevel(riskLevel)
                .build();
    }

    /**
     * Get all suspicious events for an assignment
     */
    public List<AuthEventResponse> getSuspiciousEvents(String assignmentId) {
        List<AuthEvent> events = authEventRepository
                .findByAssignmentIdAndRiskScoreGreaterThanOrderByEventTimestampDesc(
                        assignmentId, SUSPICIOUS_THRESHOLD);
        return events.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get all events for a course
     */
    public List<AuthEventResponse> getCourseEvents(String courseId) {
        List<AuthEvent> events = authEventRepository.findByCourseIdOrderByEventTimestampDesc(courseId);
        return events.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get all events for an assignment
     */
    public List<AuthEventResponse> getAssignmentEvents(String assignmentId) {
        List<AuthEvent> events = authEventRepository.findByAssignmentIdOrderByEventTimestampDesc(assignmentId);
        return events.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Calculate risk level based on average risk score
     */
    private String calculateRiskLevel(BigDecimal avgRiskScore) {
        if (avgRiskScore == null) {
            return "UNKNOWN";
        }
        if (avgRiskScore.compareTo(new BigDecimal("0.7")) >= 0) {
            return "HIGH";
        } else if (avgRiskScore.compareTo(new BigDecimal("0.3")) >= 0) {
            return "MEDIUM";
        } else {
            return "LOW";
        }
    }

    /**
     * Map entity to response DTO
     */
    private AuthEventResponse mapToResponse(AuthEvent event) {
        return AuthEventResponse.builder()
                .id(event.getId())
                .studentId(event.getStudentId())
                .assignmentId(event.getAssignmentId())
                .courseId(event.getCourseId())
                .sessionId(event.getSessionId())
                .confidenceLevel(event.getConfidenceLevel())
                .riskScore(event.getRiskScore())
                .keystrokeSampleSize(event.getKeystrokeSampleSize())
                .eventTimestamp(event.getEventTimestamp())
                .authenticated(event.getAuthenticated())
                .similarityScore(event.getSimilarityScore())
                .createdAt(event.getCreatedAt())
                .build();
    }
}
