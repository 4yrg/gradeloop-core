package com.gradeloop.ivas.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

/**
 * Entity representing the final assessment of a viva session.
 */
@Entity
@Table(name = "assessments")
public class Assessment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false, unique = true)
    private VivaSession session;

    @Column(name = "overall_score")
    private Integer overallScore;

    @Enumerated(EnumType.STRING)
    @Column(name = "competency_level")
    private CompetencyLevel competencyLevel;

    @Column(columnDefinition = "TEXT")
    private String misconceptions;

    @Column(columnDefinition = "TEXT")
    private String strengths;

    @Column(columnDefinition = "TEXT")
    private String weaknesses;

    @Column(name = "full_analysis", columnDefinition = "TEXT")
    private String fullAnalysis;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
        updatedAt = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }

    // Constructors
    public Assessment() {
    }

    public Assessment(VivaSession session) {
        this.session = session;
    }

    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public VivaSession getSession() {
        return session;
    }

    public void setSession(VivaSession session) {
        this.session = session;
    }

    public Integer getOverallScore() {
        return overallScore;
    }

    public void setOverallScore(Integer overallScore) {
        this.overallScore = overallScore;
    }

    public CompetencyLevel getCompetencyLevel() {
        return competencyLevel;
    }

    public void setCompetencyLevel(CompetencyLevel competencyLevel) {
        this.competencyLevel = competencyLevel;
    }

    public String getMisconceptions() {
        return misconceptions;
    }

    public void setMisconceptions(String misconceptions) {
        this.misconceptions = misconceptions;
    }

    public String getStrengths() {
        return strengths;
    }

    public void setStrengths(String strengths) {
        this.strengths = strengths;
    }

    public String getWeaknesses() {
        return weaknesses;
    }

    public void setWeaknesses(String weaknesses) {
        this.weaknesses = weaknesses;
    }

    public String getFullAnalysis() {
        return fullAnalysis;
    }

    public void setFullAnalysis(String fullAnalysis) {
        this.fullAnalysis = fullAnalysis;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
