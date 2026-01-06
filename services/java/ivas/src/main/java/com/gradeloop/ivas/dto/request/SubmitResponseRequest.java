package com.gradeloop.ivas.dto.request;

import jakarta.validation.constraints.NotBlank;

/**
 * Request DTO for submitting a student response during viva.
 */
public record SubmitResponseRequest(
    @NotBlank(message = "Transcript is required")
    String transcript,
    
    String audioUrl
) {}
