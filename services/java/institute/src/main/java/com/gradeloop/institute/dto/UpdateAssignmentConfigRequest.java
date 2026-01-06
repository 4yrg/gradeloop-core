package com.gradeloop.institute.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateAssignmentConfigRequest {
    // Limits
    private Boolean enforceTimeLimit;
    private Integer timeLimit;
    private Integer memoryLimit;

    // Grading Policy
    private Boolean allowPartialCredits;
    private Boolean enableRetries;
    private Integer maxRetries;
    private Integer retryPenalty;
    private String markingGuide;
}
