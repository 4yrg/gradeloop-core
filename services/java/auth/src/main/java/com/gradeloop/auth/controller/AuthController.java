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
    public ResponseEntity<String> debug(@RequestParam String email, @RequestParam String rawPassword) {
        return ResponseEntity.ok(authService.debugVerify(email, rawPassword));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<String> forgotPassword(@RequestBody java.util.Map<String, String> payload) {
        String email = payload.get("email");
        if (email == null || email.isEmpty()) {
            return ResponseEntity.badRequest().body("Email is required");
        }
        String token = authService.forgotPassword(email);
        if (token == null) {
            return ResponseEntity.ok("If an account exists for " + email + ", a password reset link has been sent.");
        }
        return ResponseEntity.ok(token);
    }

    @PostMapping("/reset-password")
    public ResponseEntity<String> resetPassword(@RequestBody java.util.Map<String, String> payload) {
        String token = payload.get("token");
        String newPassword = payload.get("newPassword");

        if (token == null || newPassword == null) {
            return ResponseEntity.badRequest().body("Token and newPassword are required");
        }

        try {
            authService.resetPassword(token, newPassword);
            return ResponseEntity.ok("Password reset successfully. You can now login with your new password.");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
