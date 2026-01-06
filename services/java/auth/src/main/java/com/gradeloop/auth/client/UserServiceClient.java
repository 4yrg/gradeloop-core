package com.gradeloop.auth.client;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
@RequiredArgsConstructor
public class UserServiceClient {

    private final RestTemplate restTemplate;

    @Value("${user.service.url:http://user-service:5001}")
    private String userServiceUrl;

    public UserProfileResponse getUserProfile(Long userDbId) {
        String url = userServiceUrl + "/users/profile/" + userDbId;
        try {
            return restTemplate.getForObject(url, UserProfileResponse.class);
        } catch (Exception e) {
            throw new RuntimeException("Failed to fetch user profile: " + e.getMessage(), e);
        }
    }
}
