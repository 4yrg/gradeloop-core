package com.gradeloop.authanalytics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO for receiving auth events from RabbitMQ
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthEventMessage {
    private String studentId;
    private String assignmentId;
    private String courseId;
    private String sessionId;
    private BigDecimal confidenceLevel;
    private BigDecimal riskScore;
    private Integer keystrokeSampleSize;
    private LocalDateTime timestamp;
    private Boolean authenticated;
    private BigDecimal similarityScore;
    private String metadata;
}
