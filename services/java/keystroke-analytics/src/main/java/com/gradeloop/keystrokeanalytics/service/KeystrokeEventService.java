package com.gradeloop.keystrokeanalytics.service;

import com.gradeloop.keystrokeanalytics.dto.KeystrokeEventMessage;
import com.gradeloop.keystrokeanalytics.dto.KeystrokeEventResponse;
import com.gradeloop.keystrokeanalytics.dto.PagedResponse;
import com.gradeloop.keystrokeanalytics.dto.StudentKeystrokeSummary;
import com.gradeloop.keystrokeanalytics.entity.KeystrokeEvent;
import com.gradeloop.keystrokeanalytics.exception.InvalidDataException;
import com.gradeloop.keystrokeanalytics.exception.MessagingException;
import com.gradeloop.keystrokeanalytics.exception.ResourceNotFoundException;
import com.gradeloop.keystrokeanalytics.repository.KeystrokeEventRepository;
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
public class KeystrokeEventService {

    private final KeystrokeEventRepository keystrokeEventRepository;
    private static final BigDecimal SUSPICIOUS_THRESHOLD = new BigDecimal("0.5");

    /**
     * Listen for keystroke events from RabbitMQ and store them
     */
    @RabbitListener(queues = "keystroke.auth.events")
    @Transactional
    public void handleKeystrokeEvent(@Valid KeystrokeEventMessage message) {
        try {
            log.info("Received keystroke event for student: {}, assignment: {}",
                    message.getStudentId(), message.getAssignmentId());

            validateKeystrokeEventMessage(message);

            KeystrokeEvent event = KeystrokeEvent.builder()
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

            keystrokeEventRepository.save(event);
            log.info("Successfully stored keystroke event with ID: {}", event.getId());

        } catch (InvalidDataException e) {
            log.error("Invalid keystroke event data: {}", e.getMessage());
            throw new MessagingException("Invalid keystroke event data", e);
        } catch (Exception e) {
            log.error("Error processing keystroke event: {}", e.getMessage(), e);
            throw new MessagingException("Failed to process keystroke event", e);
        }
    }

    /**
     * Validate keystroke event message
     */
    private void validateKeystrokeEventMessage(KeystrokeEventMessage message) {
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
     * Get all keystroke events for a student on an assignment
     */
    public List<KeystrokeEventResponse> getStudentAssignmentEvents(String studentId, String assignmentId) {
        List<KeystrokeEvent> events = keystrokeEventRepository
                .findByStudentIdAndAssignmentIdOrderByEventTimestampDesc(studentId, assignmentId);
        return events.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get all keystroke events with pagination
     */
    public PagedResponse<KeystrokeEventResponse> getStudentAssignmentEventsPaged(
            String studentId, String assignmentId, int page, int size) {
        if (page < 0) {
            throw new InvalidDataException("page", "must be non-negative");
        }
        if (size <= 0 || size > 100) {
            throw new InvalidDataException("size", "must be between 1 and 100");
        }

        Pageable pageable = PageRequest.of(page, size, Sort.by("eventTimestamp").descending());
        Page<KeystrokeEvent> eventPage = keystrokeEventRepository.findByStudentIdAndAssignmentId(
                studentId, assignmentId, pageable);

        List<KeystrokeEventResponse> responses = eventPage.getContent().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        return PagedResponse.<KeystrokeEventResponse>builder()
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
    public StudentKeystrokeSummary getStudentAssignmentSummary(String studentId, String assignmentId) {
        List<KeystrokeEvent> events = keystrokeEventRepository
                .findByStudentIdAndAssignmentIdOrderByEventTimestampDesc(studentId, assignmentId);

        if (events.isEmpty()) {
            throw new ResourceNotFoundException("Keystroke events",
                    "studentId=" + studentId + ", assignmentId=" + assignmentId);
        }
        BigDecimal avgConfidence = keystrokeEventRepository.getAverageConfidence(studentId, assignmentId);
        BigDecimal avgRiskScore = keystrokeEventRepository.getAverageRiskScore(studentId, assignmentId);
        Long suspiciousCount = keystrokeEventRepository.countSuspiciousEvents(studentId, assignmentId, SUSPICIOUS_THRESHOLD);

        List<Object[]> confidenceRange = keystrokeEventRepository.getConfidenceRange(studentId, assignmentId);
        List<Object[]> timeRange = keystrokeEventRepository.getTimeRange(studentId, assignmentId);

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

        Long totalEvents = (long) keystrokeEventRepository.findByStudentIdAndAssignmentIdOrderByEventTimestampDesc(
                studentId, assignmentId).size();

        String riskLevel = calculateRiskLevel(avgRiskScore);

        return StudentKeystrokeSummary.builder()
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
    public List<KeystrokeEventResponse> getSuspiciousEvents(String assignmentId) {
        List<KeystrokeEvent> events = keystrokeEventRepository
                .findByAssignmentIdAndRiskScoreGreaterThanOrderByEventTimestampDesc(
                        assignmentId, SUSPICIOUS_THRESHOLD);
        return events.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get all events for a course
     */
    public List<KeystrokeEventResponse> getCourseEvents(String courseId) {
        List<KeystrokeEvent> events = keystrokeEventRepository.findByCourseIdOrderByEventTimestampDesc(courseId);
        return events.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get all events for an assignment
     */
    public List<KeystrokeEventResponse> getAssignmentEvents(String assignmentId) {
        List<KeystrokeEvent> events = keystrokeEventRepository.findByAssignmentIdOrderByEventTimestampDesc(assignmentId);
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
    private KeystrokeEventResponse mapToResponse(KeystrokeEvent event) {
        return KeystrokeEventResponse.builder()
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
