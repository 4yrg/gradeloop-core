package com.gradeloop.ivas.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "viva_configurations")
public class VivaConfiguration {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "assignment_id", nullable = false, unique = true)
    private UUID assignmentId;

    @Column(name = "course_id", nullable = false)
    private UUID courseId;

    @Column(name = "institute_id", nullable = false)
    private UUID instituteId;

    @Builder.Default
    @Column(nullable = false)
    private Boolean enabled = false;

    // Grading Settings
    @Builder.Default
    @Column(nullable = false)
    private Integer weight = 25; // Weight in overall grade (%)

    @Builder.Default
    @Column(name = "passing_threshold", nullable = false)
    private Integer passingThreshold = 70;

    @Builder.Default
    @Column(name = "max_attempts", nullable = false)
    private Integer maxAttempts = 3;

    @Builder.Default
    @Column(name = "time_limit", nullable = false)
    private Integer timeLimit = 15; // Minutes

    // Trigger Settings
    @Builder.Default
    @Column(name = "trigger_type", nullable = false)
    @Enumerated(EnumType.STRING)
    private TriggerType triggerType = TriggerType.MANUAL;

    @Builder.Default
    @Column(name = "cipas_enabled")
    private Boolean cipasEnabled = false;

    @Column(name = "cipas_threshold")
    private Integer cipasThreshold; // Threshold to trigger viva from CIPAS

    // Question Settings
    @Builder.Default
    @Column(name = "question_count", nullable = false)
    private Integer questionCount = 7;

    @Builder.Default
    @Column(name = "adaptation_strategy", nullable = false)
    @Enumerated(EnumType.STRING)
    private AdaptationStrategy adaptationStrategy = AdaptationStrategy.IRT;

    @Builder.Default
    @Column(name = "question_generation", nullable = false)
    @Enumerated(EnumType.STRING)
    private QuestionGeneration questionGeneration = QuestionGeneration.HYBRID;

    // Voice Settings
    @Builder.Default
    @Column(name = "tts_voice", nullable = false)
    private String ttsVoice = "alloy";

    @Builder.Default
    @Column(name = "speech_speed", nullable = false)
    private Double speechSpeed = 1.0;

    @Builder.Default
    @Column(name = "asr_sensitivity", nullable = false)
    private Double asrSensitivity = 0.5;

    // Student Experience Settings
    @Builder.Default
    @Column(name = "practice_mode_enabled")
    private Boolean practiceModeEnabled = true;

    @Builder.Default
    @Column(name = "show_transcription")
    private Boolean showTranscription = true;

    @Builder.Default
    @Column(name = "allow_pausing")
    private Boolean allowPausing = false;

    // Review Settings
    @Builder.Default
    @Column(name = "auto_release_results")
    private Boolean autoReleaseResults = true;

    @Builder.Default
    @Column(name = "require_instructor_review")
    private Boolean requireInstructorReview = false;

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

    public enum TriggerType {
        AUTOMATIC, MANUAL, HYBRID
    }

    public enum AdaptationStrategy {
        IRT, FIXED, HYBRID
    }

    public enum QuestionGeneration {
        BANK_ONLY, AI_GENERATED, HYBRID
    }
}
