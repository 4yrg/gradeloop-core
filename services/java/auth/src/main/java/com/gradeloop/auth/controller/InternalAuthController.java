package com.gradeloop.auth.controller;

import com.gradeloop.auth.dto.CreateUserRequest;
import com.gradeloop.auth.dto.CreateUserResponse;
import com.gradeloop.auth.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth/internal")
@RequiredArgsConstructor
public class InternalAuthController {

    private final AuthService authService;

    @PostMapping("/users")
    public ResponseEntity<CreateUserResponse> createUser(@RequestBody CreateUserRequest request) {
        return ResponseEntity.ok(authService.createInternalUser(request));
    }
}
