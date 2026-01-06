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
@Table(name = "viva_misconceptions")
public class VivaMisconception {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @JsonBackReference
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "concept_id", nullable = false)
    private VivaConcept concept;

    @Column(name = "misconception_text", nullable = false, columnDefinition = "TEXT")
    private String misconceptionText;

    // Keywords that indicate this misconception in student response
    @ElementCollection
    @CollectionTable(name = "viva_misconception_keywords", joinColumns = @JoinColumn(name = "misconception_id"))
    @Column(name = "keyword")
    @Builder.Default
    private List<String> detectionKeywords = new ArrayList<>();

    // Correction explanation for the misconception
    @Column(columnDefinition = "TEXT")
    private String correction;

    // Resource link for further learning
    @Column(name = "resource_url")
    private String resourceUrl;

    @Builder.Default
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private Severity severity = Severity.MEDIUM;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public enum Severity {
        LOW, MEDIUM, HIGH, CRITICAL
    }
}
