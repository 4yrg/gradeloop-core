package com.gradeloop.institute.client.auth;

import lombok.Data;

@Data
public class CreateAuthUserResponse {
    private Long authUserId;
    private String email;
    private String tempPassword;
}
