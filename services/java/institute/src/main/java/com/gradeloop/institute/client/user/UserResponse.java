package com.gradeloop.institute.client.user;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {
    private Long id;
    private Long userId;
    private String email;
    private String firstName;
    private String lastName;
    private String instituteId;
    private String role;
}
