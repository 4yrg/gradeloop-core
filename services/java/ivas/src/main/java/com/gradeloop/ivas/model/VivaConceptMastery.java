package com.gradeloop.ivas.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "viva_concept_masteries")
public class VivaConceptMastery {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @JsonBackReference
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private VivaSession session;

    @Column(name = "concept_id", nullable = false)
    private UUID conceptId;

    @Column(name = "concept_name")
    private String conceptName;

    // Score for this concept (0-100)
    @Column(nullable = false)
    private Double score;

    // Mastery level (0-100)
    @Column(nullable = false)
    private Double mastery;

    // Number of questions answered for this concept
    @Column(name = "questions_answered")
    private Integer questionsAnswered;

    // Number of questions answered correctly
    @Column(name = "correct_answers")
    private Integer correctAnswers;

    // Detected misconceptions for this concept
    @ElementCollection
    @CollectionTable(name = "viva_mastery_misconceptions", joinColumns = @JoinColumn(name = "mastery_id"))
    @Column(name = "misconception_id")
    @Builder.Default
    private List<UUID> detectedMisconceptions = new ArrayList<>();

    // Strengths identified
    @ElementCollection
    @CollectionTable(name = "viva_mastery_strengths", joinColumns = @JoinColumn(name = "mastery_id"))
    @Column(name = "strength")
    @Builder.Default
    private List<String> strengths = new ArrayList<>();

    // Weaknesses identified
    @ElementCollection
    @CollectionTable(name = "viva_mastery_weaknesses", joinColumns = @JoinColumn(name = "mastery_id"))
    @Column(name = "weakness")
    @Builder.Default
    private List<String> weaknesses = new ArrayList<>();
}
