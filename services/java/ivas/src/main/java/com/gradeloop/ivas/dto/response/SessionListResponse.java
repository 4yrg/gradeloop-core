package com.gradeloop.ivas.dto.response;

import org.springframework.data.domain.Page;

import java.util.List;

/**
 * Response DTO for paginated session list.
 */
public record SessionListResponse(
    List<VivaSessionResponse> sessions,
    int page,
    int size,
    long totalElements,
    int totalPages,
    boolean hasNext,
    boolean hasPrevious
) {
    public static SessionListResponse from(Page<VivaSessionResponse> page) {
        return new SessionListResponse(
            page.getContent(),
            page.getNumber(),
            page.getSize(),
            page.getTotalElements(),
            page.getTotalPages(),
            page.hasNext(),
            page.hasPrevious()
        );
    }
}
