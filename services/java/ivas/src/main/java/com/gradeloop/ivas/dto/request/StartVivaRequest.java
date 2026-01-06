package com.gradeloop.ivas.dto.request;

import jakarta.validation.constraints.NotBlank;

/**
 * Request DTO for starting a new viva session.
 */
public record StartVivaRequest(
    @NotBlank(message = "Student ID is required")
    String studentId,
    
    @NotBlank(message = "Assignment ID is required")
    String assignmentId,
    
    @NotBlank(message = "Course ID is required")
    String courseId
) {}
