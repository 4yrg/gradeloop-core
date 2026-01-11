package com.gradeloop.keystrokeanalytics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO for API responses
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KeystrokeEventResponse {
    private Long id;
    private String studentId;
    private String assignmentId;
    private String courseId;
    private String sessionId;
    private BigDecimal confidenceLevel;
    private BigDecimal riskScore;
    private Integer keystrokeSampleSize;
    private LocalDateTime eventTimestamp;
    private Boolean authenticated;
    private BigDecimal similarityScore;
    private LocalDateTime createdAt;
}
