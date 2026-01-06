package com.gradeloop.ivas.dto.response;

/**
 * Response DTO for viva configuration.
 */
public record VivaConfigResponse(
    String assignmentId,
    boolean enabled,
    int maxQuestions,
    int maxDurationMinutes,
    int passingScore,
    String[] topics,
    String difficultyLevel
) {
    /**
     * Create default configuration for an assignment.
     */
    public static VivaConfigResponse defaultConfig(String assignmentId) {
        return new VivaConfigResponse(
            assignmentId,
            true,
            7,           // max 7 questions
            10,          // 10 minutes max duration
            60,          // 60% passing score
            new String[]{"General Programming", "Code Understanding"},
            "ADAPTIVE"   // difficulty adapts based on responses
        );
    }
}
