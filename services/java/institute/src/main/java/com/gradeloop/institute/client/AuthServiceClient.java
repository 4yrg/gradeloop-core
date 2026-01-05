package com.gradeloop.institute.client;

import com.gradeloop.institute.client.auth.CreateAuthUserRequest;
import com.gradeloop.institute.client.auth.CreateAuthUserResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
@RequiredArgsConstructor
public class AuthServiceClient {

    private final RestTemplate restTemplate;

    @Value("${auth.service.url:http://auth-service:5000}")
    private String authServiceUrl;

    public CreateAuthUserResponse createInstituteAdmin(String email, String name) {
        String url = authServiceUrl + "/auth/internal/users";

        CreateAuthUserRequest request = CreateAuthUserRequest.builder()
                .email(email)
                .name(name)
                .role("INSTITUTE_ADMIN")
                .build();

        return restTemplate.postForObject(url, request, CreateAuthUserResponse.class);
    }
}
