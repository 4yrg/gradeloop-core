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
}
