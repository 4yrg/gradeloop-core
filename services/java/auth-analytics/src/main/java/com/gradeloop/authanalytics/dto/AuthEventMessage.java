package com.gradeloop.authanalytics.dto;

import jakarta.validation.constraints.*;
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
    @NotBlank(message = "Student ID is required")
    private String studentId;

    @NotBlank(message = "Assignment ID is required")
    private String assignmentId;

    @NotBlank(message = "Course ID is required")
    private String courseId;

    @NotBlank(message = "Session ID is required")
    private String sessionId;

    @NotNull(message = "Confidence level is required")
    @DecimalMin(value = "0.0", message = "Confidence level must be between 0 and 100")
    @DecimalMax(value = "100.0", message = "Confidence level must be between 0 and 100")
    private BigDecimal confidenceLevel;

    @NotNull(message = "Risk score is required")
    @DecimalMin(value = "0.0", message = "Risk score must be between 0 and 100")
    @DecimalMax(value = "100.0", message = "Risk score must be between 0 and 100")
    private BigDecimal riskScore;

    @NotNull(message = "Keystroke sample size is required")
    @Positive(message = "Keystroke sample size must be positive")
    private Integer keystrokeSampleSize;

    private LocalDateTime timestamp;

    @NotNull(message = "Authentication result is required")
    private Boolean authenticated;

    @DecimalMin(value = "0.0", message = "Similarity score must be between 0 and 100")
    @DecimalMax(value = "100.0", message = "Similarity score must be between 0 and 100")
    private BigDecimal similarityScore;

    private String metadata;
}
