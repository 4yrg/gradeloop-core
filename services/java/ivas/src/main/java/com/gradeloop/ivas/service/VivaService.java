package com.gradeloop.ivas.service;

import com.gradeloop.ivas.dto.request.EndVivaRequest;
import com.gradeloop.ivas.dto.request.StartVivaRequest;
import com.gradeloop.ivas.dto.response.DashboardResponse;
import com.gradeloop.ivas.dto.response.SessionListResponse;
import com.gradeloop.ivas.dto.response.VivaConfigResponse;
import com.gradeloop.ivas.dto.response.VivaSessionResponse;
import com.gradeloop.ivas.model.CompetencyLevel;
import com.gradeloop.ivas.model.SessionStatus;
import com.gradeloop.ivas.model.VivaSession;
import com.gradeloop.ivas.repository.AssessmentRepository;
import com.gradeloop.ivas.repository.ConversationTurnRepository;
import com.gradeloop.ivas.repository.VivaSessionRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Service layer for IVAS Viva operations.
 */
@Service
@Transactional
public class VivaService {

    private final VivaSessionRepository sessionRepository;
    private final ConversationTurnRepository turnRepository;
    private final AssessmentRepository assessmentRepository;

    public VivaService(VivaSessionRepository sessionRepository,
                       ConversationTurnRepository turnRepository,
                       AssessmentRepository assessmentRepository) {
        this.sessionRepository = sessionRepository;
        this.turnRepository = turnRepository;
        this.assessmentRepository = assessmentRepository;
    }

    /**
     * Start a new viva session.
     */
    public VivaSessionResponse startSession(StartVivaRequest request) {
        // Check if student already has an active session for this assignment
        if (sessionRepository.hasActiveSession(request.studentId(), request.assignmentId())) {
            throw new IllegalStateException("Student already has an active session for this assignment");
        }

        VivaSession session = new VivaSession(
            request.studentId(),
            request.assignmentId(),
            request.courseId()
        );
        session.setStatus(SessionStatus.IN_PROGRESS);
        session.setStartedAt(Instant.now());

        VivaSession saved = sessionRepository.save(session);
        return VivaSessionResponse.from(saved);
    }

    /**
     * Get session by ID with full details.
     */
    @Transactional(readOnly = true)
    public VivaSessionResponse getSession(UUID sessionId) {
        VivaSession session = sessionRepository.findByIdWithAllData(sessionId)
            .orElseThrow(() -> new IllegalArgumentException("Session not found: " + sessionId));
        return VivaSessionResponse.from(session, true);
    }

    /**
     * List sessions for an assignment with optional status filter.
     */
    @Transactional(readOnly = true)
    public SessionListResponse listSessions(String assignmentId, SessionStatus status, Pageable pageable) {
        Page<VivaSession> sessions;
        
        if (status != null) {
            sessions = sessionRepository.findByAssignmentIdAndStatus(assignmentId, status, pageable);
        } else {
            sessions = sessionRepository.findByAssignmentId(assignmentId, pageable);
        }

        Page<VivaSessionResponse> responsePage = sessions.map(VivaSessionResponse::from);
        return SessionListResponse.from(responsePage);
    }

    /**
     * Get viva configuration for an assignment.
     */
    @Transactional(readOnly = true)
    public VivaConfigResponse getConfig(String assignmentId) {
        // For now, return default config. In future, this could be stored per assignment.
        return VivaConfigResponse.defaultConfig(assignmentId);
    }

    /**
     * Get dashboard data for an assignment.
     */
    @Transactional(readOnly = true)
    public DashboardResponse getDashboard(String assignmentId, int totalStudents) {
        long total = sessionRepository.countByAssignmentId(assignmentId);
        
        if (total == 0) {
            return DashboardResponse.empty(assignmentId, totalStudents);
        }

        long completed = sessionRepository.countByAssignmentIdAndStatus(assignmentId, SessionStatus.COMPLETED);
        long inProgress = sessionRepository.countByAssignmentIdAndStatus(assignmentId, SessionStatus.IN_PROGRESS);
        long notStarted = sessionRepository.countByAssignmentIdAndStatus(assignmentId, SessionStatus.NOT_STARTED);
        long abandoned = sessionRepository.countByAssignmentIdAndStatus(assignmentId, SessionStatus.ABANDONED);

        Double avgScore = sessionRepository.findAverageScoreByAssignmentId(assignmentId);

        // Get competency distribution
        Map<String, Integer> competencyDist = new HashMap<>();
        for (CompetencyLevel level : CompetencyLevel.values()) {
            competencyDist.put(level.name(), 0);
        }

        // Get score distribution (in ranges)
        Map<String, Integer> scoreDist = new HashMap<>();
        scoreDist.put("0-20", 0);
        scoreDist.put("21-40", 0);
        scoreDist.put("41-60", 0);
        scoreDist.put("61-80", 0);
        scoreDist.put("81-100", 0);

        return new DashboardResponse(
            assignmentId,
            totalStudents,
            (int) total,
            (int) completed,
            (int) inProgress,
            totalStudents - (int) total + (int) notStarted,
            (int) abandoned,
            avgScore,
            competencyDist,
            scoreDist
        );
    }

    /**
     * End a viva session.
     */
    public VivaSessionResponse endSession(UUID sessionId, EndVivaRequest request) {
        VivaSession session = sessionRepository.findById(sessionId)
            .orElseThrow(() -> new IllegalArgumentException("Session not found: " + sessionId));

        if (session.getStatus() == SessionStatus.COMPLETED || session.getStatus() == SessionStatus.ABANDONED) {
            throw new IllegalStateException("Session is already ended");
        }

        if (request != null && request.abandoned()) {
            session.setStatus(SessionStatus.ABANDONED);
        } else {
            session.setStatus(SessionStatus.COMPLETED);
        }
        session.setEndedAt(Instant.now());

        VivaSession saved = sessionRepository.save(session);
        return VivaSessionResponse.from(saved);
    }

    /**
     * End a viva session (simple version without request body).
     */
    public VivaSessionResponse endSession(UUID sessionId) {
        return endSession(sessionId, null);
    }
}
