package com.gradeloop.institute.client;

import com.gradeloop.institute.client.user.UserResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
@RequiredArgsConstructor
public class UserServiceClient {

    private final RestTemplate restTemplate;

    @Value("${user.service.url:http://user-service:5000}")
    private String userServiceUrl;

    public UserResponse getStudent(Long studentId) {
        String url = userServiceUrl + "/users/students/" + studentId;
        return restTemplate.getForObject(url, UserResponse.class);
    }

    public UserResponse getInstructor(Long instructorId) {
        String url = userServiceUrl + "/users/instructors/" + instructorId;
        return restTemplate.getForObject(url, UserResponse.class);
    }

    public void createInstituteAdmin(String email, String fullName, String instituteId, Long authUserId, String role) {
        String url = userServiceUrl + "/users/institute-admins";

        java.util.Map<String, Object> request = new java.util.HashMap<>();
        request.put("email", email);
        request.put("fullName", fullName);
        request.put("instituteId", instituteId);
        request.put("authUserId", authUserId);
        request.put("role", role);

        restTemplate.postForObject(url, request, Object.class);
    }
}
