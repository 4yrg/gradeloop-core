package com.gradeloop.user.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateUserResponse {
    private Long id; // User Service ID (Student ID or Instructor ID)
    private Long userId; // Auth User ID
    private String email;
    private String firstName;
    private String lastName;
    private String tempPassword;
    private String role;
    private String error; // For bulk error reporting
}
