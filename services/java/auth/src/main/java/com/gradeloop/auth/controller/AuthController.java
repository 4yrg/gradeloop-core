package com.gradeloop.auth.controller;

import com.gradeloop.auth.dto.AuthResponse;
import com.gradeloop.auth.dto.LoginRequest;
import com.gradeloop.auth.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request, HttpServletRequest servletRequest) {
        return ResponseEntity.ok(authService.login(request, servletRequest));
    }

    @PostMapping("/admin/create")
    public ResponseEntity<String> createAdmin(@RequestParam String email) {
        authService.createSystemAdmin(email);
        return ResponseEntity.ok("System Admin created successfully. Email sent.");
    }

    @GetMapping("/debug")
    public ResponseEntity<String> debug(@RequestParam String email, @RequestParam String password) {
        return ResponseEntity.ok(authService.debugVerify(email, password));
    }
}
