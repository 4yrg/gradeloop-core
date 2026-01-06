package com.gradeloop.ivas.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "viva_sessions", indexes = {
    @Index(name = "idx_session_student", columnList = "student_id, assignment_id"),
    @Index(name = "idx_session_status", columnList = "status, created_at")
})
public class VivaSession {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "assignment_id", nullable = false)
    private UUID assignmentId;

    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @Column(name = "attempt_number", nullable = false)
    private Integer attemptNumber;

    @Builder.Default
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private SessionStatus status = SessionStatus.NOT_STARTED;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "time_spent")
    private Integer timeSpent; // Seconds

    // Scoring
    @Column(name = "overall_score")
    private Double overallScore;

    @Column(name = "competency_level")
    @Enumerated(EnumType.STRING)
    private CompetencyLevel competencyLevel;

    @Column(name = "irt_ability")
    private Double irtAbility; // Estimated ability from IRT

    @Column(name = "irt_standard_error")
    private Double irtStandardError;

    @Column(name = "pass_fail")
    @Enumerated(EnumType.STRING)
    private PassFail passFail;

    // Review
    @Builder.Default
    @Column(nullable = false)
    private Boolean flagged = false;

    @Column(name = "flag_reason")
    private String flagReason;

    @Builder.Default
    @Column(name = "reviewed", nullable = false)
    private Boolean reviewed = false;

    @Column(name = "reviewed_by")
    private Long reviewedBy;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @Column(name = "instructor_feedback", columnDefinition = "TEXT")
    private String instructorFeedback;

    // Override
    @Column(name = "score_override")
    private Double scoreOverride;

    @Column(name = "override_reason")
    private String overrideReason;

    // Audio recording
    @Column(name = "audio_recording_path")
    private String audioRecordingPath;

    // Questions answered in this session
    @Builder.Default
    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<VivaQuestion> questions = new ArrayList<>();

    // Concept mastery scores
    @Builder.Default
    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<VivaConceptMastery> conceptMasteries = new ArrayList<>();

    // Transcript
    @Builder.Default
    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("timestamp ASC")
    private List<VivaTranscript> transcripts = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum SessionStatus {
        NOT_STARTED, IN_PROGRESS, COMPLETED, SUBMITTED, CANCELLED
    }

    public enum CompetencyLevel {
        NOVICE, INTERMEDIATE, ADVANCED, EXPERT
    }

    public enum PassFail {
        PASS, FAIL, PENDING
    }
}
