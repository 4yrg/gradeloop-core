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
@Table(name = "viva_question_templates")
public class VivaQuestionTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @JsonBackReference
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "concept_id", nullable = false)
    private VivaConcept concept;

    @Column(name = "question_text", nullable = false, columnDefinition = "TEXT")
    private String questionText;

    @Column(name = "code_snippet", columnDefinition = "TEXT")
    private String codeSnippet;

    @Builder.Default
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private DifficultyLevel difficulty = DifficultyLevel.INTERMEDIATE;

    // IRT parameters
    @Builder.Default
    @Column(name = "irt_difficulty")
    private Double irtDifficulty = 0.0; // Range: -3 to +3

    @Builder.Default
    @Column(name = "irt_discrimination")
    private Double irtDiscrimination = 1.0; // How well item discriminates between abilities

    // Expected keywords/concepts in answer
    @ElementCollection
    @CollectionTable(name = "viva_question_expected_keywords", joinColumns = @JoinColumn(name = "question_id"))
    @Column(name = "keyword")
    @Builder.Default
    private List<String> expectedKeywords = new ArrayList<>();

    // Sample/ideal answer for grading reference
    @Column(name = "sample_answer", columnDefinition = "TEXT")
    private String sampleAnswer;

    // Maximum time expected for this question (seconds)
    @Builder.Default
    @Column(name = "expected_time")
    private Integer expectedTime = 120;

    @Builder.Default
    @Column(nullable = false)
    private Boolean active = true;

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

    public enum DifficultyLevel {
        BEGINNER, INTERMEDIATE, ADVANCED, EXPERT
    }
}
