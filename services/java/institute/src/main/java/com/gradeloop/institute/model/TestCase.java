package com.gradeloop.institute.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "test_cases")
public class TestCase {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    @JsonIgnore
    private Question question;

    @Column(columnDefinition = "TEXT")
    private String input;

    @Column(columnDefinition = "TEXT")
    private String expectedOutput;

    @Column(name = "is_hidden")
    private boolean isHidden;

    @Column(nullable = false)
    private String visibility; // Test case visibility (e.g., "PUBLIC", "HIDDEN", "AFTER_DUE_DATE")

    @Column(name = "marks")
    private Integer marks; // Absolute marks/points for this test case

    // Optional: weighting for individual test cases if needed, but requirements
    // mention question-level weight.
    // We can assume equal weight per test case or specific logic later.
}
