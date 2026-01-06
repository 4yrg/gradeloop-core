package com.gradeloop.ivas.dto.request;

/**
 * Request DTO for ending a viva session.
 */
public record EndVivaRequest(
    String reason,
    boolean abandoned
) {
    public EndVivaRequest() {
        this(null, false);
    }
}
