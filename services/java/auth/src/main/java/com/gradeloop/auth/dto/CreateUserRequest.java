package com.gradeloop.auth.dto;

import com.gradeloop.auth.model.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateUserRequest {
    private String email;
    private Role role;
    private Long userDbId; // Reference to user profile ID in user-service database
}
