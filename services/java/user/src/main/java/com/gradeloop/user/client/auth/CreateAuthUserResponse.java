package com.gradeloop.user.client.auth;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateAuthUserResponse {
    private Long userId;
    private String email;
    private String tempPassword;
}
