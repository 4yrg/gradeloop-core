package com.gradeloop.ivas.dto.response;

import java.util.Map;

/**
 * Response DTO for instructor dashboard data.
 */
public record DashboardResponse(
    String assignmentId,
    int totalStudents,
    int totalSessions,
    int completedSessions,
    int inProgressSessions,
    int notStartedSessions,
    int abandonedSessions,
    Double averageScore,
    Map<String, Integer> competencyDistribution,
    Map<String, Integer> scoreDistribution
) {
    public static DashboardResponse empty(String assignmentId, int totalStudents) {
        return new DashboardResponse(
            assignmentId,
            totalStudents,
            0,
            0,
            0,
            totalStudents,
            0,
            null,
            Map.of(),
            Map.of()
        );
    }
}
