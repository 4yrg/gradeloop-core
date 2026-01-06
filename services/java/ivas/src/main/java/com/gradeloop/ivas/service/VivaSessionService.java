package com.gradeloop.ivas.service;

import com.gradeloop.ivas.model.VivaConfiguration;
import com.gradeloop.ivas.model.VivaSession;
import com.gradeloop.ivas.repository.VivaSessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class VivaSessionService {

    private final VivaSessionRepository sessionRepository;
    private final VivaConfigurationService configurationService;

    @Transactional
    public VivaSession startSession(UUID assignmentId, Long studentId) {
        // Check configuration
        VivaConfiguration config = configurationService.getConfigurationByAssignmentId(assignmentId);
        
        if (!config.getEnabled()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Viva is not enabled for this assignment");
        }

        // Check for existing in-progress session
        sessionRepository.findByStudentIdAndAssignmentIdAndStatus(studentId, assignmentId, VivaSession.SessionStatus.IN_PROGRESS)
                .ifPresent(s -> {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Student already has an in-progress session");
                });

        // Get attempt number
        List<VivaSession> previousSessions = sessionRepository.findByStudentIdAndAssignmentId(studentId, assignmentId);
        int attemptNumber = previousSessions.size() + 1;

        if (attemptNumber > config.getMaxAttempts()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Maximum attempts exceeded");
        }

        VivaSession session = VivaSession.builder()
                .assignmentId(assignmentId)
                .studentId(studentId)
                .attemptNumber(attemptNumber)
                .status(VivaSession.SessionStatus.IN_PROGRESS)
                .startedAt(LocalDateTime.now())
                .passFail(VivaSession.PassFail.PENDING)
                .build();

        VivaSession saved = sessionRepository.save(session);
        log.info("Started viva session id={} for student={}, attempt={}", saved.getId(), studentId, attemptNumber);
        return saved;
    }

    public VivaSession getSession(UUID sessionId) {
        return sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Session not found with id: " + sessionId));
    }

    public Page<VivaSession> getSessionsByAssignment(UUID assignmentId, Pageable pageable) {
        return sessionRepository.findByAssignmentId(assignmentId, pageable);
    }

    public List<VivaSession> getSessionsByStudentAndAssignment(Long studentId, UUID assignmentId) {
        return sessionRepository.findByStudentIdAndAssignmentId(studentId, assignmentId);
    }

    @Transactional
    public VivaSession endSession(UUID sessionId) {
        VivaSession session = getSession(sessionId);
        
        if (session.getStatus() != VivaSession.SessionStatus.IN_PROGRESS) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Session is not in progress");
        }

        session.setStatus(VivaSession.SessionStatus.COMPLETED);
        session.setCompletedAt(LocalDateTime.now());
        
        // Calculate time spent
        if (session.getStartedAt() != null) {
            long seconds = java.time.Duration.between(session.getStartedAt(), session.getCompletedAt()).getSeconds();
            session.setTimeSpent((int) seconds);
        }

        log.info("Ended viva session id={}", sessionId);
        return sessionRepository.save(session);
    }

    @Transactional
    public VivaSession flagSession(UUID sessionId, String reason) {
        VivaSession session = getSession(sessionId);
        session.setFlagged(true);
        session.setFlagReason(reason);
        log.info("Flagged session id={} for reason: {}", sessionId, reason);
        return sessionRepository.save(session);
    }

    @Transactional
    public VivaSession reviewSession(UUID sessionId, Long reviewerId, String feedback, Double scoreOverride, String overrideReason) {
        VivaSession session = getSession(sessionId);
        
        session.setReviewed(true);
        session.setReviewedBy(reviewerId);
        session.setReviewedAt(LocalDateTime.now());
        
        if (feedback != null) {
            session.setInstructorFeedback(feedback);
        }
        
        if (scoreOverride != null) {
            session.setScoreOverride(scoreOverride);
            session.setOverrideReason(overrideReason);
        }

        log.info("Reviewed session id={} by reviewer={}", sessionId, reviewerId);
        return sessionRepository.save(session);
    }

    public List<VivaSession> getFlaggedSessions(UUID assignmentId) {
        return sessionRepository.findByAssignmentIdAndFlaggedTrue(assignmentId);
    }
}
