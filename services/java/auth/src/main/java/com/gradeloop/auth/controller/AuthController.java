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

    @GetMapping("/me")
    public ResponseEntity<java.util.Map<String, Object>> me(
            org.springframework.security.core.Authentication authentication,
            jakarta.servlet.http.HttpServletRequest request) {
        if (authentication == null) {
            return ResponseEntity.status(401).build();
        }

        // Get user from auth-db
        String email = authentication.getName();
        com.gradeloop.auth.model.User user = authService.getUserByEmail(email);

        // Extract role from authorities (ROLE_ADMIN -> ADMIN)
        String role = authentication.getAuthorities().stream()
                .findFirst()
                .map(a -> a.getAuthority().replace("ROLE_", ""))
                .orElse("UNKNOWN");

        java.util.Map<String, Object> response = new java.util.HashMap<>();
        response.put("email", email);
        response.put("role", role);

        // Fetch user profile from user-service if userDbId exists
        if (user.getUserDbId() != null) {
            try {
                com.gradeloop.auth.client.UserProfileResponse profile = authService.getUserProfile(user.getUserDbId());
                response.put("name", profile.getFullName());
                response.put("userId", profile.getId());
                response.put("instituteId", profile.getInstituteId());
            } catch (Exception e) {
                System.out.println("Warning: Failed to fetch user profile for /me: " + e.getMessage());
                // Continue without profile data
            }
        }

        // For institute admins or if instituteId not found, try to get from session
        jakarta.servlet.http.HttpSession session = request.getSession(false);
        if (session != null) {
            String sessionInstituteId = (String) session.getAttribute("instituteId");
            if (sessionInstituteId != null && !response.containsKey("instituteId")) {
                response.put("instituteId", sessionInstituteId);
            }
        }

        return ResponseEntity.ok(response);
    }

    @GetMapping("/debug")
    public ResponseEntity<String> debug(@RequestParam String email, @RequestParam String rawPassword) {
        return ResponseEntity.ok(authService.debugVerify(email, rawPassword));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<java.util.Map<String, String>> forgotPassword(
            @RequestBody java.util.Map<String, String> payload) {
        String email = payload.get("email");
        if (email == null || email.isEmpty()) {
            return ResponseEntity.badRequest().body(java.util.Collections.singletonMap("error", "Email is required"));
        }
        try {
            String token = authService.forgotPassword(email);
            return ResponseEntity.ok(java.util.Collections.singletonMap("token", token));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(java.util.Collections.singletonMap("error", e.getMessage()));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<java.util.Map<String, String>> resetPassword(
            @RequestBody java.util.Map<String, String> payload) {
        String token = payload.get("token");
        String newPassword = payload.get("newPassword");

        if (token == null || newPassword == null) {
            return ResponseEntity.badRequest()
                    .body(java.util.Collections.singletonMap("error", "Token and newPassword are required"));
        }

        try {
            authService.resetPassword(token, newPassword);
            return ResponseEntity.ok(java.util.Collections.singletonMap("message",
                    "Password reset successfully. You can now login with your new password."));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(java.util.Collections.singletonMap("error", e.getMessage()));
        }
    }

    @PostMapping("/change-password")
    public ResponseEntity<String> changePassword(@RequestBody java.util.Map<String, String> payload) {
        String currentPassword = payload.get("currentPassword");
        String newPassword = payload.get("newPassword");

        if (newPassword == null) {
            return ResponseEntity.badRequest().body("New password is required");
        }

        try {
            authService.changePassword(currentPassword, newPassword);
            return ResponseEntity.ok("Password changed successfully");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/users/email/{email}")
    public ResponseEntity<java.util.Map<String, Object>> getUserByEmail(@PathVariable String email) {
        try {
            var userWithInstitute = authService.getUserWithInstituteByEmail(email);
            return ResponseEntity.ok(userWithInstitute);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
