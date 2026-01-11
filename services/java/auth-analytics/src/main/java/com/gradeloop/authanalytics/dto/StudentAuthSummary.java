package com.gradeloop.authanalytics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Summary statistics for a student's auth events
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentAuthSummary {
    private String studentId;
    private String assignmentId;
    private Long totalEvents;
    private BigDecimal averageConfidence;
    private BigDecimal averageRiskScore;
    private BigDecimal minConfidence;
    private BigDecimal maxConfidence;
    private Long suspiciousEvents; // Events with risk > 0.5
    private LocalDateTime firstEventTime;
    private LocalDateTime lastEventTime;
    private String riskLevel; // LOW, MEDIUM, HIGH
}
