package com.gradeloop.keystrokeanalytics.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "keystroke_events", indexes = {
    @Index(name = "idx_student_assignment", columnList = "student_id,assignment_id"),
    @Index(name = "idx_timestamp", columnList = "event_timestamp"),
    @Index(name = "idx_risk_score", columnList = "risk_score")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KeystrokeEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "student_id", nullable = false)
    private String studentId;

    @Column(name = "assignment_id")
    private String assignmentId;

    @Column(name = "course_id")
    private String courseId;

    @Column(name = "session_id")
    private String sessionId;

    @Column(name = "confidence_level", precision = 5, scale = 2)
    private BigDecimal confidenceLevel;

    @Column(name = "risk_score", precision = 5, scale = 2)
    private BigDecimal riskScore;

    @Column(name = "keystroke_sample_size")
    private Integer keystrokeSampleSize;

    @Column(name = "event_timestamp", nullable = false)
    private LocalDateTime eventTimestamp;

    @Column(name = "metadata", columnDefinition = "jsonb")
    private String metadata;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "authenticated")
    private Boolean authenticated;

    @Column(name = "similarity_score", precision = 5, scale = 2)
    private BigDecimal similarityScore;
}
