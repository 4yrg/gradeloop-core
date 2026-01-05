package com.gradeloop.institute.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.UUID;
import java.util.List;
import java.util.ArrayList;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "assignments")
public class Assignment {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    @JsonIgnore
    private Course course;

    @JsonProperty("courseId")
    public UUID getCourseId() {
        return course != null ? course.getId() : null;
    }

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AssignmentStatus status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AssignmentType type;

    private Integer autograderPoints;
    private Boolean allowManualGrading;

    private LocalDateTime releaseDate;
    private LocalDateTime dueDate;

    private Boolean allowLateSubmissions;
    private LocalDateTime lateDueDate;

    @OneToMany(mappedBy = "assignment", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Question> questions = new ArrayList<>();

    @Embedded
    private GradingPolicy gradingPolicy;

    private Boolean enforceTimeLimit;
    private Integer timeLimit; // in minutes
    private Integer memoryLimit; // in MB

    private Boolean enableGroupSubmissions;
    private Integer groupSizeLimit;

    private Boolean enableLeaderboard;
    private Integer leaderboardEntries;

    public enum AssignmentStatus {
        DRAFT,
        PUBLISHED,
        ARCHIVED
    }

    public enum AssignmentType {
        LAB,
        EXAM,
        DEMO
    }
}
