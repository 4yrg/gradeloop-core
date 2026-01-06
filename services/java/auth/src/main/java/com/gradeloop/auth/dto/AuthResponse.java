package com.gradeloop.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AuthResponse {
    private String token; // Session ID usually handled by cookie, but useful if we return user info
    private String message;
    private String role;
    private String email;
    private boolean forceReset;
    private String name; // User's full name from user-db
    private Long userId; // User profile ID from user-db
    private String instituteId; // Institute ID if applicable (nullable)
}
