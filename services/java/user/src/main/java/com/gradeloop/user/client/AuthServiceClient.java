package com.gradeloop.user.client;

import com.gradeloop.user.client.auth.CreateAuthUserRequest;
import com.gradeloop.user.client.auth.CreateAuthUserResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AuthServiceClient {

    private final RestTemplate restTemplate;

    @Value("${auth.service.url:http://auth-service:5000}")
    private String authServiceUrl;

    public CreateAuthUserResponse createUser(String email, String role) {
        String url = authServiceUrl + "/auth/internal/users";

        CreateAuthUserRequest request = CreateAuthUserRequest.builder()
                .email(email)
                .role(role)
                .build();

        return restTemplate.postForObject(url, request, CreateAuthUserResponse.class);
    }

    public List<CreateAuthUserResponse> createUsersBulk(List<CreateAuthUserRequest> requests) {
        String url = authServiceUrl + "/auth/internal/users/bulk";

        HttpEntity<List<CreateAuthUserRequest>> entity = new HttpEntity<>(requests);

        ResponseEntity<List<CreateAuthUserResponse>> response = restTemplate.exchange(
                url,

                HttpMethod.POST,
                entity,
                new ParameterizedTypeReference<List<CreateAuthUserResponse>>() {
                });

        return response.getBody();
    }
}
