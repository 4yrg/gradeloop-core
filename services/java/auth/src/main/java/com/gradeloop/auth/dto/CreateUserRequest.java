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
    private String name; // Note: specific services might store name, Auth Service just needs email/role
                         // usually, but good to have if we extend User later.
    private Role role;
}
