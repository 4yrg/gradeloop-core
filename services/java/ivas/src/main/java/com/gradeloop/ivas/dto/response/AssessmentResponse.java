package com.gradeloop.ivas.dto.response;

import com.gradeloop.ivas.model.Assessment;
import com.gradeloop.ivas.model.CompetencyLevel;

import java.util.UUID;

/**
 * Response DTO for assessment data.
 */
public record AssessmentResponse(
    UUID id,
    Integer overallScore,
    CompetencyLevel competencyLevel,
    String misconceptions,
    String strengths,
    String weaknesses,
    String fullAnalysis
) {
    public static AssessmentResponse from(Assessment assessment) {
        if (assessment == null) {
            return null;
        }
        return new AssessmentResponse(
            assessment.getId(),
            assessment.getOverallScore(),
            assessment.getCompetencyLevel(),
            assessment.getMisconceptions(),
            assessment.getStrengths(),
            assessment.getWeaknesses(),
            assessment.getFullAnalysis()
        );
    }
}
