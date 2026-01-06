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

    public InstituteAdminResponse getInstituteAdminByAuthUserId(Long authUserId) {
        String url = userServiceUrl + "/users/institute-admins/by-auth-user-id/" + authUserId;
        try {
            return restTemplate.getForObject(url, InstituteAdminResponse.class);
        } catch (Exception e) {
            throw new RuntimeException("Failed to fetch institute admin: " + e.getMessage(), e);
        }
    }
}
