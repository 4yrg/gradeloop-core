package com.gradeloop.institute.client.auth;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CreateAuthUserRequest {
    private String email;
    private String name;
    private String role; // "INSTITUTE_ADMIN"
}
