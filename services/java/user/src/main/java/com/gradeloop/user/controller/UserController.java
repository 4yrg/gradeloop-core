package com.gradeloop.user.controller;

import com.gradeloop.user.dto.UserProfileResponse;
import com.gradeloop.user.service.UserProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserProfileService userProfileService;

    @GetMapping("/profile/{userDbId}")
    public ResponseEntity<UserProfileResponse> getUserProfile(@PathVariable Long userDbId) {
        try {
            return ResponseEntity.ok(userProfileService.getUserProfileById(userDbId));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
