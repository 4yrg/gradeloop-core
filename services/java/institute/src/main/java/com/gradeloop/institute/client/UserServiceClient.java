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
}
