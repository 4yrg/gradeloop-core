package com.gradeloop.ivas.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
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
@Table(name = "viva_questions", indexes = {
    @Index(name = "idx_question_session", columnList = "session_id, sequence"),
    @Index(name = "idx_question_concept", columnList = "concept_id, difficulty")
})
public class VivaQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @JsonBackReference
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private VivaSession session;

    @Column(name = "concept_id")
    private UUID conceptId;

    @Column(name = "template_id")
    private UUID templateId; // Reference to question template if from bank

    @Column(name = "question_text", nullable = false, columnDefinition = "TEXT")
    private String questionText;

    @Column(name = "code_snippet", columnDefinition = "TEXT")
    private String codeSnippet;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private VivaQuestionTemplate.DifficultyLevel difficulty;

    @Column(nullable = false)
    private Integer sequence; // Order in session

    @Column(name = "asked_at")
    private LocalDateTime askedAt;

    @Column(name = "answered_at")
    private LocalDateTime answeredAt;

    // Student response
    @Column(name = "student_response", columnDefinition = "TEXT")
    private String studentResponse;

    @Column(name = "response_audio_path")
    private String responseAudioPath;

    // Scoring
    @Column(name = "response_score")
    private Double responseScore;

    @Column(name = "irt_difficulty")
    private Double irtDifficulty;

    @Column(name = "irt_response")
    private Boolean irtResponse; // true = correct, false = incorrect for IRT

    @Column(name = "time_spent")
    private Integer timeSpent; // Seconds

    // Detected concepts and misconceptions
    @ElementCollection
    @CollectionTable(name = "viva_question_detected_concepts", joinColumns = @JoinColumn(name = "question_id"))
    @Column(name = "concept_id")
    @Builder.Default
    private List<UUID> detectedConcepts = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "viva_question_detected_misconceptions", joinColumns = @JoinColumn(name = "question_id"))
    @Column(name = "misconception_id")
    @Builder.Default
    private List<UUID> detectedMisconceptions = new ArrayList<>();

    // AI evaluation feedback
    @Column(name = "ai_feedback", columnDefinition = "TEXT")
    private String aiFeedback;

    @Column(name = "confidence_score")
    private Double confidenceScore;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
