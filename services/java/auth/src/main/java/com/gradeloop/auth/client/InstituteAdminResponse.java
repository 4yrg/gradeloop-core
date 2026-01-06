package com.gradeloop.auth.client;

import lombok.Data;

@Data
public class InstituteAdminResponse {
    private Long id;
    private String email;
    private String fullName;
    private String instituteId;
    private String role;
    private Long authUserId;
}
