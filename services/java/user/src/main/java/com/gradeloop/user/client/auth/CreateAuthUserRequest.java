package com.gradeloop.user.client.auth;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateAuthUserRequest {
    private String email;
    private String role;
    private Long userDbId; // Reference to user profile ID in user-service database
}
