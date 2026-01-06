package com.gradeloop.ivas.dto;

import com.gradeloop.ivas.model.VivaSession;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SessionResponse {
    private UUID id;
    private UUID assignmentId;
    private Long studentId;
    private Integer attemptNumber;
    private VivaSession.SessionStatus status;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private Integer timeSpent;
    private Double overallScore;
    private VivaSession.CompetencyLevel competencyLevel;
    private Double irtAbility;
    private Double irtStandardError;
    private VivaSession.PassFail passFail;
    private Boolean flagged;
    private String flagReason;
    private Boolean reviewed;
    private Long reviewedBy;
    private LocalDateTime reviewedAt;
    private String instructorFeedback;
    private Double scoreOverride;
    private String overrideReason;
    private LocalDateTime createdAt;
    
    @Builder.Default
    private List<ConceptMasteryResponse> conceptMasteries = new ArrayList<>();
    
    public static SessionResponse fromEntity(VivaSession session) {
        return SessionResponse.builder()
                .id(session.getId())
                .assignmentId(session.getAssignmentId())
                .studentId(session.getStudentId())
                .attemptNumber(session.getAttemptNumber())
                .status(session.getStatus())
                .startedAt(session.getStartedAt())
                .completedAt(session.getCompletedAt())
                .timeSpent(session.getTimeSpent())
                .overallScore(session.getOverallScore())
                .competencyLevel(session.getCompetencyLevel())
                .irtAbility(session.getIrtAbility())
                .irtStandardError(session.getIrtStandardError())
                .passFail(session.getPassFail())
                .flagged(session.getFlagged())
                .flagReason(session.getFlagReason())
                .reviewed(session.getReviewed())
                .reviewedBy(session.getReviewedBy())
                .reviewedAt(session.getReviewedAt())
                .instructorFeedback(session.getInstructorFeedback())
                .scoreOverride(session.getScoreOverride())
                .overrideReason(session.getOverrideReason())
                .createdAt(session.getCreatedAt())
                .conceptMasteries(session.getConceptMasteries() != null
                        ? session.getConceptMasteries().stream()
                                .map(ConceptMasteryResponse::fromEntity)
                                .collect(Collectors.toList())
                        : new ArrayList<>())
                .build();
    }
}
