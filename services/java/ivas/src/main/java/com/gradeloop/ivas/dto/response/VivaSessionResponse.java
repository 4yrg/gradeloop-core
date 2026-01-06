package com.gradeloop.ivas.dto.response;

import com.gradeloop.ivas.model.CompetencyLevel;
import com.gradeloop.ivas.model.SessionStatus;
import com.gradeloop.ivas.model.VivaSession;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Response DTO for viva session data.
 */
public record VivaSessionResponse(
    UUID id,
    String studentId,
    String assignmentId,
    String courseId,
    SessionStatus status,
    Instant startedAt,
    Instant endedAt,
    Integer score,
    CompetencyLevel competencyLevel,
    Instant createdAt,
    Instant updatedAt,
    List<ConversationTurnResponse> conversationTurns,
    AssessmentResponse assessment
) {
    /**
     * Create response from entity without conversation turns.
     */
    public static VivaSessionResponse from(VivaSession session) {
        return from(session, false);
    }

    /**
     * Create response from entity with optional conversation turns.
     */
    public static VivaSessionResponse from(VivaSession session, boolean includeConversation) {
        List<ConversationTurnResponse> turns = null;
        AssessmentResponse assessmentResponse = null;

        if (includeConversation && session.getConversationTurns() != null) {
            turns = session.getConversationTurns().stream()
                .map(ConversationTurnResponse::from)
                .toList();
        }

        if (session.getAssessment() != null) {
            assessmentResponse = AssessmentResponse.from(session.getAssessment());
        }

        return new VivaSessionResponse(
            session.getId(),
            session.getStudentId(),
            session.getAssignmentId(),
            session.getCourseId(),
            session.getStatus(),
            session.getStartedAt(),
            session.getEndedAt(),
            session.getScore(),
            session.getCompetencyLevel(),
            session.getCreatedAt(),
            session.getUpdatedAt(),
            turns,
            assessmentResponse
        );
    }
}
