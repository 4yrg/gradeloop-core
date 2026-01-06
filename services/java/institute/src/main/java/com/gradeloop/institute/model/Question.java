package com.gradeloop.institute.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.UUID;
import java.util.List;
import java.util.ArrayList;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "questions")
public class Question {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignment_id", nullable = false)
    @JsonIgnore
    private Assignment assignment;

    @Column(nullable = false)
    private String title; // Question title/name

    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    @Column(nullable = false)
    private Integer points;

    @Column(nullable = false)
    private Integer weight; // Question weight/contribution to total grade

    @Column(name = "order_index")
    private Integer orderIndex;

    // Resource constraints per question (optional, falls back to assignment-level)
    @Column(name = "time_limit")
    private Integer timeLimit; // Time limit in milliseconds

    @Column(name = "memory_limit")
    private Integer memoryLimit; // Memory limit in MB

    @OneToMany(mappedBy = "question", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<TestCase> testCases = new ArrayList<>();
}
