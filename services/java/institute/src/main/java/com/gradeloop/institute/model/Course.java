package com.gradeloop.institute.model;

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
@Table(name = "courses", uniqueConstraints = {
        @UniqueConstraint(columnNames = { "code", "institute_id" })
})
public class Course {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String code;

    @Column(nullable = false)
    private Integer credits;

    private String department;
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "institute_id", nullable = false)
    private Institute institute;

    @ElementCollection
    @CollectionTable(name = "course_instructors", joinColumns = @JoinColumn(name = "course_id"))
    @Column(name = "instructor_id")
    @Builder.Default
    private List<Long> instructorIds = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "course_classrooms", joinColumns = @JoinColumn(name = "course_id"))
    @Column(name = "classroom_id")
    @Builder.Default
    private List<UUID> classroomIds = new ArrayList<>();

    // Audit Fields
    @Column(updatable = false)
    private Long createdBy;

    @Column(updatable = false, nullable = false)
    private java.time.LocalDateTime createdAt;

    private Long updatedBy;

    private java.time.LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = java.time.LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = java.time.LocalDateTime.now();
    }
}
