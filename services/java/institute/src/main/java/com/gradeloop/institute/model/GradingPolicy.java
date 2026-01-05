package com.gradeloop.institute.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Embeddable
public class GradingPolicy {

    private Boolean allowPartialCredits;

    private Boolean enableRetries;

    private Integer maxRetries;

    private Integer retryPenalty; // Percentage or absolute points, e.g., 10 for 10%

    @Column(columnDefinition = "TEXT")
    private String markingGuide; // Internal only
}
