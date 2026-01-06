package com.gradeloop.auth.service;

import com.gradeloop.auth.dto.AuthResponse;
import com.gradeloop.auth.dto.CreateUserRequest;
import com.gradeloop.auth.dto.CreateUserResponse;
import com.gradeloop.auth.dto.LoginRequest;
import com.gradeloop.auth.model.PasswordResetToken;
import com.gradeloop.auth.model.Role;
import com.gradeloop.auth.model.User;
import com.gradeloop.auth.repository.PasswordResetTokenRepository;
import com.gradeloop.auth.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.gradeloop.auth.client.InstituteAdminResponse;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final EmailService emailService;
    private final com.gradeloop.auth.client.UserServiceClient userServiceClient;

    public AuthResponse login(LoginRequest request, HttpServletRequest servletRequest) {
        System.out.println("Login info - Attempting login for: " + request.getEmail());

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

            SecurityContextHolder.getContext().setAuthentication(authentication);
            HttpSession session = servletRequest.getSession(true);
            session.setAttribute("SPRING_SECURITY_CONTEXT", SecurityContextHolder.getContext());

            User user = userRepository.findByEmail(request.getEmail()).orElseThrow();
            System.out.println("Login info - User found with role: " + user.getRole());

            // Fetch user profile from user-service if userDbId exists
            String fullName = null;
            String instituteId = null;

            // For institute admins, fetch institute ID from user-service
            if (user.getRole() == Role.INSTITUTE_ADMIN) {
                try {
                    InstituteAdminResponse adminInfo = userServiceClient
                            .getInstituteAdminByAuthUserId(user.getId());
                    instituteId = adminInfo.getInstituteId();
                    fullName = adminInfo.getFullName();
                    session.setAttribute("instituteId", instituteId);
                    System.out.println("Login info - Institute admin logged in. Institute ID: " + instituteId);
                } catch (Exception e) {
                    System.out.println("Warning: Failed to fetch institute admin info: " + e.getMessage());
                }
            }

            // Fetch user profile from user-service if userDbId exists (for other roles)
            if (user.getUserDbId() != null && user.getRole() != Role.INSTITUTE_ADMIN) {
                try {
                    com.gradeloop.auth.client.UserProfileResponse profile = userServiceClient
                            .getUserProfile(user.getUserDbId());
                    fullName = profile.getFullName();
                    instituteId = profile.getInstituteId();
                } catch (Exception e) {
                    System.out.println("Warning: Failed to fetch user profile: " + e.getMessage());
                    // Continue without profile data
                }
            }

            // Store institute ID in session if available
            if (instituteId != null) {
                session.setAttribute("instituteId", instituteId);
            }

            return AuthResponse.builder()
                    .message("Login successful")
                    .role(user.getRole().name())
                    .token(session.getId())
                    .email(user.getEmail())
                    .forceReset(user.isTemporaryPassword())
                    .name(fullName)
                    .userId(user.getUserDbId())
                    .instituteId(instituteId)
                    .build();
        } catch (Exception e) {
            System.out.println("Login info - Authentication failed: " + e.getMessage());
            // Check manually for debugging
            userRepository.findByEmail(request.getEmail()).ifPresentOrElse(
                    u -> System.out.println("Login info - Debug: Password match result: "
                            + passwordEncoder.matches(request.getPassword(), u.getPassword())),
                    () -> System.out.println("Login info - Debug: User not found"));
            throw e;
        }
    }

    public void createSystemAdmin(String email) {
        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("User already exists");
        }

        String tempPassword = UUID.randomUUID().toString().substring(0, 8);
        User user = User.builder()
                .email(email)
                .password(passwordEncoder.encode(tempPassword))
                .tempPassword(tempPassword)
                .role(Role.SYSTEM_ADMIN)
                .isTemporaryPassword(true)
                .build();

        userRepository.save(user);
        userRepository.save(user);

        String token = generateResetToken(user);
        emailService.sendWelcomeLink(email, token);

        System.out.println("Created Admin: " + email + ". Sent Welcome Link.");
    }

    public String debugVerify(String email, String rawPassword) {
        StringBuilder sb = new StringBuilder();
        sb.append("Debug info for: ").append(email).append("\n");

        var userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            return sb.append("User NOT FOUND in database.").toString();
        }

        User user = userOpt.get();
        sb.append("User FOUND. Role: ").append(user.getRole()).append("\n");
        sb.append("Stored Password Hash: ").append(user.getPassword()).append("\n");

        boolean match = passwordEncoder.matches(rawPassword, user.getPassword());
        sb.append("Password Match (").append(rawPassword).append(" vs Hash): ").append(match).append("\n");

        return sb.toString();
    }

    public String forgotPassword(String email) {
        User user = userRepository.findByEmail(email).orElse(null);

        if (user == null) {
            throw new RuntimeException("User not found with email: " + email);
        }

        // Generate token
        String token = UUID.randomUUID().toString();
        // Hash token
        String tokenHash = org.apache.commons.codec.digest.DigestUtils.sha256Hex(token);

        PasswordResetToken resetToken = PasswordResetToken.builder()
                .tokenHash(tokenHash)
                .user(user)
                .expiryDate(java.time.LocalDateTime.now().plusMinutes(15))
                .used(false)
                .build();

        passwordResetTokenRepository.save(resetToken);

        emailService.sendResetLink(email, token);
        return token;
    }

    public void resetPassword(String token, String newPassword) {
        String tokenHash = org.apache.commons.codec.digest.DigestUtils.sha256Hex(token);

        PasswordResetToken resetToken = passwordResetTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new RuntimeException("Invalid or expired password reset token"));

        if (resetToken.isUsed() || resetToken.getExpiryDate().isBefore(java.time.LocalDateTime.now())) {
            throw new RuntimeException("Invalid or expired password reset token");
        }

        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setTemporaryPassword(false); // Reset temp password flag if it was set
        userRepository.save(user);

        resetToken.setUsed(true);
        passwordResetTokenRepository.save(resetToken);
    }

    private String generateResetToken(User user) {
        // Generate token
        String token = UUID.randomUUID().toString();
        // Hash token
        String tokenHash = org.apache.commons.codec.digest.DigestUtils.sha256Hex(token);

        PasswordResetToken resetToken = PasswordResetToken.builder()
                .tokenHash(tokenHash)
                .user(user)
                .expiryDate(java.time.LocalDateTime.now().plusHours(24)) // 24 hours for welcome/reset
                .used(false)
                .build();

        passwordResetTokenRepository.save(resetToken);
        return token;
    }

    public void sendWelcomeReset(String email) {
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
        String token = generateResetToken(user);
        emailService.sendWelcomeLink(email, token);
    }

    public CreateUserResponse createInternalUser(CreateUserRequest request) {
        java.util.Optional<User> existingUser = userRepository.findByEmail(request.getEmail());
        if (existingUser.isPresent()) {
            User user = existingUser.get();
            return CreateUserResponse.builder()
                    .authUserId(user.getId())
                    .email(user.getEmail())
                    .build();
        }

        String tempPassword = UUID.randomUUID().toString().substring(0, 8);
        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(tempPassword))
                .role(request.getRole())
                .userDbId(request.getUserDbId())
                .tempPassword(tempPassword)
                .isTemporaryPassword(true)
                .build();

        User savedUser = userRepository.save(user);

        String token = generateResetToken(savedUser);
        emailService.sendWelcomeLink(savedUser.getEmail(), token);

        return CreateUserResponse.builder()
                .authUserId(savedUser.getId())
                .email(savedUser.getEmail())
                .build();
    }

    public java.util.List<CreateUserResponse> createInternalUsersBulk(java.util.List<CreateUserRequest> requests) {
        return requests.stream()
                .map(this::createInternalUser)
                .collect(java.util.stream.Collectors.toList());
    }

    public void changePassword(String currentPassword, String newPassword) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        System.out.println("Change Password Request for: " + email);
        System.out.println(
                "Authentication Class: " + (authentication != null ? authentication.getClass().getName() : "null"));

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> {
                    System.out.println("User not found for email: " + email);
                    return new RuntimeException("User not found");
                });

        // If user has a temporary password, we allow changing it without verifying the
        // current one again
        // (Assuming they are authenticated, which they are to reach here)
        // If NOT temporary, we strictly require current password
        if (!user.isTemporaryPassword()) {
            if (currentPassword == null || !passwordEncoder.matches(currentPassword, user.getPassword())) {
                System.out.println("Password mismatch or missing for user: " + email);
                throw new RuntimeException("Invalid current password");
            }
        }
        // If isTemporaryPassword is true, we allow ignoring currentPassword

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setTemporaryPassword(false);
        user.setTempPassword(null); // Clear plain temp password
        userRepository.save(user);
        System.out.println("Password changed successfully for: " + email);
    }

    public void deleteUser(Long userId) {
        userRepository.deleteById(userId);
    }

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));
    }

    public com.gradeloop.auth.client.UserProfileResponse getUserProfile(Long userDbId) {
        return userServiceClient.getUserProfile(userDbId);
    }

    public java.util.Map<String, Object> getUserWithInstituteByEmail(String email) {
        User user = getUserByEmail(email);
        java.util.Map<String, Object> response = new java.util.HashMap<>();
        response.put("id", user.getId());
        response.put("email", user.getEmail());
        response.put("role", user.getRole().name());

        // If user is an institute admin, fetch their institute ID from user-service
        if (user.getRole() == Role.INSTITUTE_ADMIN) {
            try {
                InstituteAdminResponse adminInfo = userServiceClient
                        .getInstituteAdminByAuthUserId(user.getId());
                response.put("instituteId", adminInfo.getInstituteId());
            } catch (Exception e) {
                System.out.println("Warning: Failed to fetch institute ID: " + e.getMessage());
            }
        }

        return response;
    }
}
