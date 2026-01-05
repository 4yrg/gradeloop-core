package com.gradeloop.institute.client.auth;

import lombok.Data;

@Data
public class CreateAuthUserResponse {
    private Long userId;
    private String email;
    private String tempPassword;
}
